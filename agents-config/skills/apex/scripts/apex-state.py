#!/usr/bin/env python3
"""Durable, append-only state helper for APEX runs."""

from __future__ import annotations

import argparse
import errno
import fcntl
import hashlib
import json
import os
import re
import stat
import subprocess
import tempfile
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


SCHEMA_VERSION = 1
RUN_ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$")
METADATA_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$")
EVENT_STATUSES = {"started", "in_progress", "complete", "blocked", "recorded", "failed"}
SECRET_PATTERNS = (
    re.compile(r"(?i)\b(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie)\s*[:=]\s*[^\s,;]+"),
    re.compile(r"(?i)\bbearer\s+[a-z0-9._~+/=-]{12,}"),
    re.compile(r"\b(?:sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|xox[baprs]-[A-Za-z0-9-]{12,})\b"),
    re.compile(r"-----BEGIN [^-]*PRIVATE KEY-----.*?-----END [^-]*PRIVATE KEY-----", re.DOTALL),
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def fail(message: str) -> None:
    raise SystemExit(f"apex-state: {message}")


def redact(value: str | None) -> str | None:
    if value is None:
        return None
    redacted = value
    for pattern in SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED_SECRET]", redacted)
    return redacted


def resolve_root(value: str) -> Path:
    root = Path(value).expanduser().resolve()
    if not root.is_dir():
        fail(f"root is not a directory: {root}")
    if redact(str(root)) != str(root):
        fail("root path contains secret-like content")
    return root


def validate_run_id(run_id: str) -> str:
    if redact(run_id) != run_id:
        fail("run ID contains secret-like content")
    if not RUN_ID_RE.fullmatch(run_id):
        fail("run ID must contain only letters, numbers, dot, underscore, or hyphen")
    return run_id


def validate_metadata(value: str, label: str) -> str:
    if redact(value) != value:
        fail(f"{label} contains secret-like content")
    if not METADATA_RE.fullmatch(value):
        fail(f"{label} must contain only letters, numbers, dot, underscore, or hyphen")
    return value


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:48] or "task"


def ensure_directory(path: Path, *, create: bool) -> Path:
    try:
        metadata = path.lstat()
    except FileNotFoundError:
        if not create:
            fail(f"missing state directory: {path}")
        try:
            path.mkdir(mode=0o700)
        except FileExistsError:
            pass
        metadata = path.lstat()
    if stat.S_ISLNK(metadata.st_mode):
        fail(f"state path must not be a symlink: {path}")
    if not stat.S_ISDIR(metadata.st_mode):
        fail(f"state path is not a directory: {path}")
    os.chmod(path, 0o700)
    return path


def state_root(root: Path, *, create: bool) -> Path:
    current = root
    for component in (".agents", "apex", "runs"):
        current = ensure_directory(current / component, create=create)
        try:
            current.resolve().relative_to(root)
        except ValueError:
            fail(f"state path escapes repository: {current}")
    return current


def existing_run_dir(root: Path, run_id: str) -> Path:
    base = state_root(root, create=False)
    directory = ensure_directory(base / validate_run_id(run_id), create=False)
    try:
        directory.resolve().relative_to(base.resolve())
    except ValueError:
        fail(f"run directory escapes state root: {directory}")
    return directory


def assert_regular_or_missing(path: Path) -> None:
    try:
        metadata = path.lstat()
    except FileNotFoundError:
        return
    if stat.S_ISLNK(metadata.st_mode):
        fail(f"state file must not be a symlink: {path}")
    if not stat.S_ISREG(metadata.st_mode):
        fail(f"state path is not a regular file: {path}")


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def write_json(path: Path, data: dict[str, Any]) -> None:
    assert_regular_or_missing(path)
    handle, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        os.fchmod(handle, 0o600)
        with os.fdopen(handle, "w", encoding="utf-8") as stream:
            json.dump(data, stream, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        os.chmod(path, 0o600)
        fsync_directory(path.parent)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def read_json(path: Path) -> dict[str, Any]:
    assert_regular_or_missing(path)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing state file: {path}")
    except json.JSONDecodeError as error:
        fail(f"invalid JSON in {path}: {error}")
    if not isinstance(data, dict):
        fail(f"expected a JSON object in {path}")
    return data


@contextmanager
def run_lock(directory: Path) -> Iterator[None]:
    lock_path = directory / ".state.lock"
    assert_regular_or_missing(lock_path)
    flags = os.O_CREAT | os.O_RDWR
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(lock_path, flags, 0o600)
    try:
        os.fchmod(descriptor, 0o600)
        fcntl.flock(descriptor, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(descriptor, fcntl.LOCK_UN)
        os.close(descriptor)


def journal_path(directory: Path) -> Path:
    return directory / "journal.jsonl"


def append_journal(directory: Path, event: dict[str, Any]) -> dict[str, Any]:
    path = journal_path(directory)
    assert_regular_or_missing(path)
    recorded = dict(event)
    recorded["id"] = str(uuid.uuid4())
    recorded["timestamp"] = now()
    payload = (json.dumps(recorded, sort_keys=True) + "\n").encode()
    flags = os.O_CREAT | os.O_APPEND | os.O_WRONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags, 0o600)
    try:
        os.fchmod(descriptor, 0o600)
        view = memoryview(payload)
        while view:
            written = os.write(descriptor, view)
            view = view[written:]
        os.fsync(descriptor)
    finally:
        os.close(descriptor)
    return recorded


def read_journal(directory: Path) -> list[dict[str, Any]]:
    path = journal_path(directory)
    assert_regular_or_missing(path)
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return []
    events: list[dict[str, Any]] = []
    for index, line in enumerate(lines):
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            if index == len(lines) - 1:
                break
            fail(f"corrupt journal entry at line {index + 1}")
        if not isinstance(event, dict) or not isinstance(event.get("id"), str):
            fail(f"invalid journal entry at line {index + 1}")
        events.append(event)
    return events


def project_state(base: dict[str, Any], events: list[dict[str, Any]]) -> dict[str, Any]:
    state = dict(base)
    state["status"] = "active"
    state["current_phase"] = "preflight"
    state["updated_at"] = state.get("created_at")
    state["last_event_id"] = None
    checkpoints: list[dict[str, Any]] = []
    for event in events:
        phase = event.get("phase")
        status = event.get("status")
        if isinstance(phase, str):
            state["current_phase"] = phase
        if event.get("kind") == "checkpoint" and isinstance(event.get("checkpoint"), dict):
            checkpoints.append(event["checkpoint"])
        if phase == "handoff" and status == "complete":
            state["status"] = "complete"
        elif status == "blocked":
            state["status"] = "blocked"
        elif state.get("status") != "complete" and status in {"started", "in_progress", "complete", "recorded"}:
            state["status"] = "active"
        state["last_event_id"] = event["id"]
        state["updated_at"] = event["timestamp"]
    state["checkpoints"] = checkpoints
    return state


def project_evidence(events: list[dict[str, Any]]) -> dict[str, Any]:
    artifacts: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for event in events:
        if event.get("kind") != "artifact":
            continue
        action = event.get("action")
        if action == "recorded" and isinstance(event.get("artifact"), dict):
            artifact = dict(event["artifact"])
            artifact_id = artifact.get("id")
            if isinstance(artifact_id, str):
                artifacts[artifact_id] = artifact
                if artifact_id not in order:
                    order.append(artifact_id)
        elif action == "invalidated":
            artifact_id = event.get("artifact_id")
            if artifact_id in artifacts:
                artifacts[artifact_id]["status"] = "invalidated"
                artifacts[artifact_id]["invalidated_at"] = event["timestamp"]
                artifacts[artifact_id]["invalidation_reason"] = event.get("message")
    return {"schema_version": SCHEMA_VERSION, "artifacts": [artifacts[key] for key in order]}


def load_bundle(
    root: Path, directory: Path
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    events = read_journal(directory)
    run_event = next(
        (event for event in events if event.get("kind") == "run" and isinstance(event.get("run"), dict)),
        None,
    )
    if run_event is None:
        fail(f"journal has no run record: {journal_path(directory)}")
    base = dict(run_event["run"])
    recorded_root = Path(str(base.get("root", ""))).resolve()
    if recorded_root != root:
        fail(f"run belongs to {recorded_root}, not {root}")
    if base.get("schema_version") != SCHEMA_VERSION:
        fail(f"unsupported schema version: {base.get('schema_version')}")
    return base, project_state(base, events), events, project_evidence(events)


def run_git(root: Path, *arguments: str) -> tuple[bool, bytes, str | None]:
    try:
        result = subprocess.run(
            ("git", *arguments),
            cwd=root,
            check=False,
            capture_output=True,
            timeout=10,
        )
    except subprocess.TimeoutExpired:
        return False, b"", "git command timed out"
    except OSError as error:
        return False, b"", redact(str(error))
    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="replace").strip()
        return False, result.stdout, redact(error or f"git exited {result.returncode}")
    return True, result.stdout, None


def parse_porcelain(raw: bytes) -> tuple[list[dict[str, str]], bool]:
    tokens = raw.split(b"\0")
    changes: list[dict[str, str]] = []
    paths_redacted = False
    index = 0
    while index < len(tokens):
        token = tokens[index]
        index += 1
        if not token:
            continue
        text = token.decode("utf-8", errors="surrogateescape")
        if len(text) < 4:
            continue
        status_code = text[:2]
        raw_path = text[3:]
        safe_path = redact(raw_path) or "[REDACTED_SECRET]"
        paths_redacted = paths_redacted or safe_path != raw_path
        entry = {"status": status_code, "path": safe_path}
        if ("R" in status_code or "C" in status_code) and index < len(tokens):
            original = tokens[index]
            index += 1
            original_path = original.decode("utf-8", errors="surrogateescape")
            safe_original = redact(original_path) or "[REDACTED_SECRET]"
            paths_redacted = paths_redacted or safe_original != original_path
            entry["original_path"] = safe_original
        changes.append(entry)
    return changes, paths_redacted


def git_snapshot(root: Path) -> dict[str, Any]:
    inside_ok, inside, inside_error = run_git(root, "rev-parse", "--is-inside-work-tree")
    if not inside_ok or inside.strip() != b"true":
        return {"available": False, "error": inside_error or "not a Git working tree"}

    revision_ok, revision_raw, revision_error = run_git(root, "rev-parse", "HEAD")
    branch_ok, branch_raw, branch_error = run_git(root, "branch", "--show-current")
    upstream_ok, upstream_raw, upstream_error = run_git(
        root, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"
    )
    status_ok, status_raw, status_error = run_git(root, "status", "--porcelain=v1", "-z")
    changes, paths_redacted = parse_porcelain(status_raw) if status_ok else (None, False)
    errors = [error for error in (revision_error, branch_error, status_error) if error]
    return {
        "available": True,
        "verified": status_ok and revision_ok and branch_ok,
        "revision": revision_raw.decode().strip() if revision_ok else None,
        "branch": redact(branch_raw.decode().strip()) if branch_ok else None,
        "branch_fingerprint": hashlib.sha256(branch_raw).hexdigest() if branch_ok else None,
        "upstream": redact(upstream_raw.decode().strip()) if upstream_ok else None,
        "changes": changes,
        "status_fingerprint": hashlib.sha256(status_raw).hexdigest() if status_ok else None,
        "paths_redacted": paths_redacted,
        "errors": errors,
        "upstream_error": upstream_error if not upstream_ok else None,
    }


def persist_projections(directory: Path, state: dict[str, Any], evidence: dict[str, Any]) -> None:
    write_json(directory / "run.json", state)
    write_json(directory / "evidence.json", evidence)


def cleanup_staging(directory: Path) -> None:
    """Remove only the known files created by an incomplete init."""

    if not directory.exists():
        return
    for name in ("run.json", "tasks.json", "evidence.json", "journal.jsonl", ".state.lock"):
        path = directory / name
        if path.exists() and path.is_file() and not path.is_symlink():
            path.unlink()
    for name in ("artifacts", "tasks"):
        path = directory / name
        if path.exists() and path.is_dir() and not path.is_symlink():
            try:
                path.rmdir()
            except OSError:
                pass
    try:
        directory.rmdir()
    except OSError:
        pass


def command_init(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    base = state_root(root, create=True)
    task = redact(args.task) or "task"
    prefix = args.run_id or f"{datetime.now().strftime('%Y%m%d-%H%M%S')}-{slugify(task)}-{uuid.uuid4().hex[:8]}"
    validate_run_id(prefix)
    staging = base / f".initializing-{uuid.uuid4()}"
    staging.mkdir(mode=0o700)
    published = False
    try:
        (staging / "artifacts").mkdir(mode=0o700)
        (staging / "tasks").mkdir(mode=0o700)
        timestamp = now()
        base_state: dict[str, Any] = {
            "schema_version": SCHEMA_VERSION,
            "run_id": prefix,
            "root": str(root),
            "task": task,
            "status": "active",
            "current_phase": "preflight",
            "created_at": timestamp,
            "updated_at": timestamp,
            "baseline": git_snapshot(root),
            "last_event_id": None,
            "checkpoints": [],
        }
        write_json(staging / "tasks.json", {"schema_version": SCHEMA_VERSION, "tasks": []})
        event = append_journal(
            staging,
            {
                "kind": "run",
                "phase": "preflight",
                "status": "started",
                "message": "Run initialized",
                "run": base_state,
            },
        )
        state = project_state(base_state, [event])
        evidence = project_evidence([event])
        persist_projections(staging, state, evidence)
        fsync_directory(staging / "artifacts")
        fsync_directory(staging / "tasks")
        fsync_directory(staging)

        candidate = prefix
        directory = base / candidate
        if directory.exists():
            fail(f"run already exists: {candidate}")
        try:
            os.rename(staging, directory)
            published = True
        except OSError as error:
            if error.errno in {errno.EEXIST, errno.ENOTEMPTY}:
                fail(f"run already exists: {candidate}")
            raise
        fsync_directory(base)
        print(json.dumps({"run_id": candidate, "run_dir": str(directory)}))
    finally:
        if not published:
            cleanup_staging(staging)


def command_event(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    directory = existing_run_dir(root, args.run_id)
    phase = validate_metadata(args.phase, "phase")
    task_id = validate_metadata(args.task_id, "task ID") if args.task_id else None
    if args.status not in EVENT_STATUSES:
        fail("unsupported event status")
    with run_lock(directory):
        base, _, events, _ = load_bundle(root, directory)
        payload: dict[str, Any] = {
            "kind": "task" if args.task_id else "phase",
            "phase": phase,
            "status": args.status,
            "message": redact(args.message),
        }
        if task_id:
            payload["task_id"] = task_id
        recorded = append_journal(directory, payload)
        events.append(recorded)
        persist_projections(directory, project_state(base, events), project_evidence(events))
    print(json.dumps(recorded))


def command_checkpoint(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    directory = existing_run_dir(root, args.run_id)
    phase = validate_metadata(args.phase, "phase")
    with run_lock(directory):
        base, _, events, _ = load_bundle(root, directory)
        checkpoint = {
            "id": str(uuid.uuid4()),
            "phase": phase,
            "message": redact(args.message),
            "timestamp": now(),
            "git": git_snapshot(root),
        }
        recorded = append_journal(
            directory,
            {
                "kind": "checkpoint",
                "phase": phase,
                "status": "recorded",
                "message": checkpoint["message"],
                "checkpoint": checkpoint,
            },
        )
        events.append(recorded)
        persist_projections(directory, project_state(base, events), project_evidence(events))
    print(json.dumps(checkpoint))


def inspect_file(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    flags = os.O_RDONLY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags)
    try:
        before = os.fstat(descriptor)
        if not stat.S_ISREG(before.st_mode):
            fail(f"artifact is not a regular file: {path}")
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
        after = os.fstat(descriptor)
    finally:
        os.close(descriptor)
    identity_before = (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns)
    identity_after = (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns)
    if identity_before != identity_after:
        fail(f"artifact changed while being recorded: {path}")
    return digest.hexdigest(), before.st_size


def command_artifact(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    directory = existing_run_dir(root, args.run_id)
    phase = validate_metadata(args.phase, "phase")
    artifact_type = validate_metadata(args.type, "artifact type")
    task_id = validate_metadata(args.task_id, "task ID") if args.task_id else None
    if args.layer not in {"local", "provider", "public", "authenticated-live"}:
        fail("unsupported artifact layer")
    with run_lock(directory):
        base, _, events, evidence = load_bundle(root, directory)
        artifact_path = Path(args.path).expanduser()
        artifact_path = (root / artifact_path).resolve() if not artifact_path.is_absolute() else artifact_path.resolve()
        if redact(str(artifact_path)) != str(artifact_path):
            fail("artifact path contains secret-like content")
        if not artifact_path.is_file():
            fail(f"artifact is not a file: {artifact_path}")
        try:
            stored_path = str(artifact_path.relative_to(root))
        except ValueError:
            if not args.allow_external:
                fail("artifact is outside the repository; pass --allow-external explicitly")
            stored_path = str(artifact_path)
        digest, size = inspect_file(artifact_path)
        artifact = {
            "id": str(uuid.uuid4()),
            "type": artifact_type,
            "phase": phase,
            "task_id": task_id,
            "layer": args.layer,
            "status": "current",
            "path": stored_path,
            "sha256": digest,
            "size": size,
            "revision": git_snapshot(root).get("revision"),
            "created_at": now(),
        }
        recorded = append_journal(
            directory,
            {
                "kind": "artifact",
                "action": "recorded",
                "phase": phase,
                "status": "recorded",
                "message": "Artifact recorded",
                "artifact": artifact,
            },
        )
        events.append(recorded)
        persist_projections(directory, project_state(base, events), project_evidence(events))
    print(json.dumps(artifact))


def command_invalidate(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    directory = existing_run_dir(root, args.run_id)
    with run_lock(directory):
        base, state, events, evidence = load_bundle(root, directory)
        known_ids = {item.get("id") for item in evidence.get("artifacts", [])}
        if args.artifact_id not in known_ids:
            fail("unknown artifact ID")
        recorded = append_journal(
            directory,
            {
                "kind": "artifact",
                "action": "invalidated",
                "phase": state.get("current_phase"),
                "status": "invalidated",
                "message": redact(args.message),
                "artifact_id": args.artifact_id,
            },
        )
        events.append(recorded)
        projected = project_evidence(events)
        persist_projections(directory, project_state(base, events), projected)
        target = next(item for item in projected["artifacts"] if item["id"] == args.artifact_id)
    print(json.dumps(target))


def drift(reference: dict[str, Any], current: dict[str, Any]) -> dict[str, bool | None]:
    if not reference.get("available") or not current.get("available"):
        return {"known": False, "revision_changed": None, "branch_changed": None, "changes_changed": None}
    if not reference.get("verified") or not current.get("verified"):
        return {"known": False, "revision_changed": None, "branch_changed": None, "changes_changed": None}
    return {
        "known": True,
        "revision_changed": reference.get("revision") != current.get("revision"),
        "branch_changed": reference.get("branch_fingerprint") != current.get("branch_fingerprint"),
        "changes_changed": reference.get("status_fingerprint") != current.get("status_fingerprint"),
    }


def verify_artifacts(root: Path, evidence: dict[str, Any]) -> dict[str, Any]:
    verified = json.loads(json.dumps(evidence))
    for artifact in verified.get("artifacts", []):
        if artifact.get("status") != "current":
            artifact["integrity"] = "not-current"
            continue
        stored_path = artifact.get("path")
        if not isinstance(stored_path, str):
            artifact["status"] = "stale"
            artifact["integrity"] = "missing-path"
            continue
        candidate = Path(stored_path).expanduser()
        candidate = (root / candidate).resolve() if not candidate.is_absolute() else candidate.resolve()
        try:
            digest, size = inspect_file(candidate)
        except (OSError, SystemExit) as error:
            artifact["status"] = "stale"
            artifact["integrity"] = "unavailable"
            artifact["integrity_error"] = redact(str(error))
            continue
        if digest != artifact.get("sha256") or size != artifact.get("size"):
            artifact["status"] = "stale"
            artifact["integrity"] = "mismatch"
        else:
            artifact["integrity"] = "verified"
    return verified


def command_status(args: argparse.Namespace) -> None:
    root = resolve_root(args.root)
    directory = existing_run_dir(root, args.run_id)
    with run_lock(directory):
        _, state, _, evidence = load_bundle(root, directory)
        current = git_snapshot(root)
        checkpoints = state.get("checkpoints", [])
        reference = checkpoints[-1].get("git", {}) if checkpoints else state.get("baseline", {})
        result = {
            "run_dir": str(directory),
            "state": state,
            "evidence": verify_artifacts(root, evidence),
            "current_git": current,
            "drift": drift(reference, current),
        }
    print(json.dumps(result, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage durable APEX run state")
    commands = parser.add_subparsers(dest="command", required=True)

    init = commands.add_parser("init")
    init.add_argument("--root", required=True)
    init.add_argument("--task", required=True)
    init.add_argument("--run-id")
    init.set_defaults(handler=command_init)

    event = commands.add_parser("event")
    event.add_argument("--root", required=True)
    event.add_argument("--run-id", required=True)
    event.add_argument("--phase", required=True)
    event.add_argument("--status", required=True)
    event.add_argument("--message", required=True)
    event.add_argument("--task-id")
    event.set_defaults(handler=command_event)

    checkpoint = commands.add_parser("checkpoint")
    checkpoint.add_argument("--root", required=True)
    checkpoint.add_argument("--run-id", required=True)
    checkpoint.add_argument("--phase", required=True)
    checkpoint.add_argument("--message", required=True)
    checkpoint.set_defaults(handler=command_checkpoint)

    artifact = commands.add_parser("artifact")
    artifact.add_argument("--root", required=True)
    artifact.add_argument("--run-id", required=True)
    artifact.add_argument("--path", required=True)
    artifact.add_argument("--type", required=True)
    artifact.add_argument("--phase", required=True)
    artifact.add_argument("--task-id")
    artifact.add_argument("--allow-external", action="store_true")
    artifact.add_argument("--layer", default="local")
    artifact.set_defaults(handler=command_artifact)

    invalidate = commands.add_parser("invalidate")
    invalidate.add_argument("--root", required=True)
    invalidate.add_argument("--run-id", required=True)
    invalidate.add_argument("--artifact-id", required=True)
    invalidate.add_argument("--message", required=True)
    invalidate.set_defaults(handler=command_invalidate)

    status = commands.add_parser("status")
    status.add_argument("--root", required=True)
    status.add_argument("--run-id", required=True)
    status.set_defaults(handler=command_status)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
