#!/usr/bin/env python3

from __future__ import annotations

import json
import stat
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


SCRIPT = Path(__file__).with_name("apex-state.py")
SETUP_SCRIPT = Path(__file__).with_name("setup-templates.sh")
UPDATE_SCRIPT = Path(__file__).with_name("update-progress.sh")


class ApexStateTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def run_cli(self, *arguments: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *arguments],
            check=check,
            capture_output=True,
            text=True,
        )

    def initialize(self, task: str = "Test durable state") -> dict:
        result = self.run_cli(
            "init",
            "--root",
            str(self.root),
            "--task",
            task,
            "--run-id",
            "test-run",
        )
        return json.loads(result.stdout)

    @property
    def directory(self) -> Path:
        return self.root / ".agents/apex/runs/test-run"

    def test_full_artifact_lifecycle_and_journal_recovery(self) -> None:
        initialized = self.initialize()
        self.assertEqual(initialized["run_id"], "test-run")
        self.assertNotIn("state", initialized)

        self.run_cli(
            "event",
            "--root",
            str(self.root),
            "--run-id",
            "test-run",
            "--phase",
            "analyze",
            "--status",
            "complete",
            "--message",
            "Analysis complete",
        )
        self.run_cli(
            "checkpoint",
            "--root",
            str(self.root),
            "--run-id",
            "test-run",
            "--phase",
            "plan",
            "--message",
            "Plan ready",
        )

        artifact = json.loads(
            self.run_cli(
                "artifact",
                "--root",
                str(self.root),
                "--run-id",
                "test-run",
                "--path",
                str(self.directory / "tasks.json"),
                "--type",
                "task-graph",
                "--phase",
                "plan",
            ).stdout
        )
        self.assertEqual(artifact["status"], "current")

        invalidated = json.loads(
            self.run_cli(
                "invalidate",
                "--root",
                str(self.root),
                "--run-id",
                "test-run",
                "--artifact-id",
                artifact["id"],
                "--message",
                "Plan changed",
            ).stdout
        )
        self.assertEqual(invalidated["status"], "invalidated")

        # Corrupt projections, then prove status recovers from the journal.
        projected = json.loads((self.directory / "run.json").read_text())
        projected["last_event_id"] = "stale"
        (self.directory / "run.json").write_text(json.dumps(projected))
        (self.directory / "evidence.json").write_text('{"schema_version": 1, "artifacts": []}')

        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        self.assertNotEqual(status["state"]["last_event_id"], "stale")
        self.assertEqual(status["evidence"]["artifacts"][0]["status"], "invalidated")
        self.assertFalse(status["drift"]["known"])

    def test_concurrent_events_keep_unique_ids(self) -> None:
        self.initialize()

        def record(number: int) -> None:
            self.run_cli(
                "event",
                "--root",
                str(self.root),
                "--run-id",
                "test-run",
                "--phase",
                "execute",
                "--status",
                "complete",
                "--message",
                f"Event {number}",
            )

        with ThreadPoolExecutor(max_workers=6) as executor:
            list(executor.map(record, range(12)))

        events = [json.loads(line) for line in (self.directory / "journal.jsonl").read_text().splitlines()]
        ids = [event["id"] for event in events]
        self.assertEqual(len(ids), 13)
        self.assertEqual(len(set(ids)), 13)

    def test_concurrent_init_has_one_winner(self) -> None:
        def initialize(_: int) -> int:
            return self.run_cli(
                "init",
                "--root",
                str(self.root),
                "--task",
                "Concurrent",
                "--run-id",
                "same-run",
                check=False,
            ).returncode

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(initialize, range(2)))
        self.assertEqual(sorted(results), [0, 1])
        self.assertEqual(list((self.root / ".agents/apex/runs").glob(".initializing-*")), [])

    def test_concurrent_distinct_init_on_fresh_root(self) -> None:
        def initialize(number: int) -> int:
            return self.run_cli(
                "init",
                "--root",
                str(self.root),
                "--task",
                f"Concurrent {number}",
                "--run-id",
                f"run-{number}",
                check=False,
            ).returncode

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(initialize, range(2)))
        self.assertEqual(results, [0, 0])

    def test_rejects_symlinked_state_root(self) -> None:
        outside = self.root / "outside"
        outside.mkdir()
        (self.root / ".agents").symlink_to(outside, target_is_directory=True)
        result = self.run_cli(
            "init",
            "--root",
            str(self.root),
            "--task",
            "Symlink",
            "--run-id",
            "test-run",
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("symlink", result.stderr)

    def test_redacts_secrets_and_uses_private_modes(self) -> None:
        secret = "sk-abcdefghijklmnopqrstuv"
        self.initialize(f"Fix auth token={secret}")
        state_text = (self.directory / "run.json").read_text()
        self.assertNotIn(secret, state_text)
        self.assertIn("[REDACTED_SECRET]", state_text)
        self.assertEqual(stat.S_IMODE(self.directory.stat().st_mode), 0o700)
        for name in ("run.json", "tasks.json", "evidence.json", "journal.jsonl"):
            self.assertEqual(stat.S_IMODE((self.directory / name).stat().st_mode), 0o600)

    def test_rejects_secrets_in_metadata(self) -> None:
        self.initialize()
        secret = "sk-abcdefghijklmnopqrstuv"
        for field, value in (("--task-id", secret), ("--phase", secret)):
            arguments = [
                "event",
                "--root",
                str(self.root),
                "--run-id",
                "test-run",
                "--phase",
                "execute",
                "--status",
                "complete",
                "--message",
                "Safe",
            ]
            index = arguments.index(field) if field in arguments else None
            if index is None:
                arguments.extend((field, value))
            else:
                arguments[index + 1] = value
            result = self.run_cli(*arguments, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertNotIn(secret, result.stderr)

        artifact_path = self.directory / f"token={secret}"
        artifact_path.write_text("sensitive name")
        result = self.run_cli(
            "artifact",
            "--root",
            str(self.root),
            "--run-id",
            "test-run",
            "--path",
            str(artifact_path),
            "--type",
            "task-graph",
            "--phase",
            "plan",
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn(secret, result.stderr)

    def test_tampered_artifact_is_reported_stale(self) -> None:
        self.initialize()
        artifact_path = self.directory / "tasks.json"
        artifact = json.loads(
            self.run_cli(
                "artifact",
                "--root",
                str(self.root),
                "--run-id",
                "test-run",
                "--path",
                str(artifact_path),
                "--type",
                "task-graph",
                "--phase",
                "plan",
            ).stdout
        )
        artifact_path.write_text('{"tampered": true}')
        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        current = next(item for item in status["evidence"]["artifacts"] if item["id"] == artifact["id"])
        self.assertEqual(current["status"], "stale")
        self.assertEqual(current["integrity"], "mismatch")

    def test_unborn_git_revision_makes_drift_unknown(self) -> None:
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        self.initialize()
        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        self.assertFalse(status["state"]["baseline"]["verified"])
        self.assertFalse(status["drift"]["known"])

    def test_redacted_git_paths_still_produce_known_drift(self) -> None:
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.email", "test@example.com"], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.name", "APEX Test"], check=True)
        tracked = self.root / "tracked.txt"
        tracked.write_text("baseline")
        subprocess.run(["git", "-C", str(self.root), "add", "tracked.txt"], check=True)
        subprocess.run(["git", "-C", str(self.root), "commit", "-qm", "test baseline"], check=True)
        before = self.root / "secret=old"
        before.write_text("before")
        self.initialize()
        before.unlink()
        (self.root / "secret=new").write_text("after")

        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        self.assertTrue(status["state"]["baseline"]["paths_redacted"])
        self.assertTrue(status["drift"]["known"])
        self.assertTrue(status["drift"]["changes_changed"])

    def test_redacted_branch_names_still_produce_known_drift(self) -> None:
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.email", "test@example.com"], check=True)
        subprocess.run(["git", "-C", str(self.root), "config", "user.name", "APEX Test"], check=True)
        tracked = self.root / "tracked.txt"
        tracked.write_text("baseline")
        subprocess.run(["git", "-C", str(self.root), "add", "tracked.txt"], check=True)
        subprocess.run(["git", "-C", str(self.root), "commit", "-qm", "test baseline"], check=True)
        subprocess.run(["git", "-C", str(self.root), "checkout", "-qb", "secret=old"], check=True)
        self.initialize()
        subprocess.run(["git", "-C", str(self.root), "checkout", "-qb", "secret=new"], check=True)

        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        self.assertTrue(status["drift"]["known"])
        self.assertTrue(status["drift"]["branch_changed"])

    def test_terminal_status_survives_final_checkpoint(self) -> None:
        self.initialize()
        self.run_cli(
            "event",
            "--root",
            str(self.root),
            "--run-id",
            "test-run",
            "--phase",
            "handoff",
            "--status",
            "complete",
            "--message",
            "Complete",
        )
        self.run_cli(
            "checkpoint",
            "--root",
            str(self.root),
            "--run-id",
            "test-run",
            "--phase",
            "handoff",
            "--message",
            "Final checkpoint",
        )
        status = json.loads(
            self.run_cli("status", "--root", str(self.root), "--run-id", "test-run").stdout
        )
        self.assertEqual(status["state"]["status"], "complete")

    def test_legacy_wrappers_keep_numbered_id_and_output_contract(self) -> None:
        first = subprocess.run(
            ["bash", str(SETUP_SCRIPT), "legacy-feature", "Legacy task"],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )
        values = dict(
            line.split("=", 1)
            for line in first.stdout.splitlines()
            if line.startswith(("TASK_ID=", "OUTPUT_DIR="))
        )
        self.assertEqual(values["TASK_ID"], "01-legacy-feature")
        self.assertTrue(Path(values["OUTPUT_DIR"]).is_dir())

        subprocess.run(
            ["bash", str(UPDATE_SCRIPT), values["TASK_ID"], "01", "analyze", "complete"],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )
        second = subprocess.run(
            ["bash", str(SETUP_SCRIPT), "legacy-feature", "Legacy task 2"],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn("TASK_ID=02-legacy-feature", second.stdout)

    def test_rejects_invalid_run_id(self) -> None:
        result = self.run_cli(
            "init",
            "--root",
            str(self.root),
            "--task",
            "Invalid",
            "--run-id",
            "../escape",
            check=False,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("run ID", result.stderr)


if __name__ == "__main__":
    unittest.main()
