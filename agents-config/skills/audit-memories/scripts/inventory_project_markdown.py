#!/usr/bin/env python3
"""Read-only inventory of agent-facing Markdown inside a project."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote


EXCLUDED_DIRS = {
    ".git",
    ".next",
    ".turbo",
    ".cache",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "coverage",
    "tmp",
    "temp",
    "__pycache__",
}
MARKDOWN_SUFFIXES = {".md", ".mdx", ".mdc"}
AGENT_ROOTS = {".agents", ".claude", ".cursor"}
AGENT_ENTRYPOINTS = {"agents.md", "claude.md", "gemini.md", ".cursorrules"}
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
HEADING_RE = re.compile(r"^#{1,6}\s+", re.MULTILINE)
STATUS_RE = re.compile(
    r"\b(?:todo|fixme|wip|draft|deprecated|obsolete|superseded|completed|done|current|production)\b",
    re.IGNORECASE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--scope", default="", help="Optional case-insensitive path/content filter")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument("--output", type=Path, help="Optional report path outside the project root")
    return parser.parse_args()


def project_root(value: Path) -> Path:
    root = value.expanduser().resolve()
    result = subprocess.run(
        ["git", "-C", str(root), "rev-parse", "--show-toplevel"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        resolved = Path(result.stdout.strip()).resolve()
        if resolved == root or resolved in root.parents:
            return resolved
    return root


def tracked_paths(root: Path) -> tuple[set[str], set[str]]:
    tracked = subprocess.run(
        ["git", "-C", str(root), "ls-files"],
        check=False,
        capture_output=True,
        text=True,
    )
    untracked = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--others", "--exclude-standard"],
        check=False,
        capture_output=True,
        text=True,
    )
    return set(tracked.stdout.splitlines()), set(untracked.stdout.splitlines())


def markdown_files(root: Path) -> tuple[list[Path], list[dict[str, str]]]:
    files: list[Path] = []
    skipped: list[dict[str, str]] = []
    for directory, dirnames, filenames in os.walk(root, followlinks=False):
        current = Path(directory)
        kept: list[str] = []
        for dirname in sorted(dirnames):
            child = current / dirname
            relative = child.relative_to(root).as_posix()
            if dirname in EXCLUDED_DIRS:
                skipped.append({"path": relative + "/", "reason": "generated or control directory"})
            elif child.is_symlink():
                skipped.append({"path": relative, "reason": "symlink directory outside traversal"})
            else:
                kept.append(dirname)
        dirnames[:] = kept

        for filename in sorted(filenames):
            path = current / filename
            relative_path = path.relative_to(root)
            if not is_agent_markdown(relative_path):
                continue
            relative = relative_path.as_posix()
            if path.is_symlink():
                skipped.append({"path": relative, "reason": "symlink file"})
            else:
                files.append(path)
    return sorted(files), skipped


def is_agent_markdown(relative: Path) -> bool:
    parts = tuple(part.lower() for part in relative.parts)
    name = relative.name.lower()
    suffix = relative.suffix.lower()
    if name in AGENT_ENTRYPOINTS:
        return True
    if parts and parts[0] in AGENT_ROOTS and suffix in MARKDOWN_SUFFIXES:
        return True
    if parts[:2] == (".github", "copilot-instructions.md"):
        return True
    if len(parts) >= 3 and parts[:2] == (".github", "instructions") and suffix in MARKDOWN_SUFFIXES:
        return True
    return name == "skill.md" and "skills" in parts


def document_kind(relative: Path) -> str:
    name = relative.name.lower()
    parts = {part.lower() for part in relative.parts}
    if name in AGENT_ENTRYPOINTS or "rules" in parts or "skills" in parts:
        return "instruction"
    if "commands" in parts:
        return "command"
    if "plans" in parts or "tasks" in parts or "ralph-tasks" in parts:
        return "plan_or_task"
    if "output" in parts:
        return "agent_output"
    if "docs" in parts:
        return "agent_reference"
    if "styles" in parts:
        return "agent_style"
    return "agent_other"


def local_target(root: Path, source: Path, raw_target: str) -> tuple[str, bool | None, str] | None:
    target = raw_target.strip().split(maxsplit=1)[0].strip("<>")
    if not target or target.startswith(("#", "http://", "https://", "mailto:", "tel:", "data:")):
        return None
    if "{{" in target or "}}" in target:
        return None
    target = unquote(target.split("#", 1)[0].split("?", 1)[0])
    if not target:
        return None
    if target.startswith("/"):
        return target, None, "application_route"
    resolved = source.parent / target
    resolved = resolved.resolve()
    try:
        relative = resolved.relative_to(root).as_posix()
    except ValueError:
        return str(resolved), False, "outside_project"
    return relative, resolved.exists(), "project_file"


def inspect_file(path: Path, root: Path, tracked: set[str], untracked: set[str], scope: str) -> tuple[dict[str, Any], str]:
    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    relative = path.relative_to(root)
    relative_text = relative.as_posix()
    links: list[dict[str, Any]] = []
    for match in LINK_RE.finditer(text):
        checked = local_target(root, path, match.group(1))
        if checked is None:
            continue
        target, exists, kind = checked
        links.append(
            {
                "target": target,
                "exists": exists,
                "kind": kind,
                "line": text.count("\n", 0, match.start()) + 1,
            }
        )

    normalized = re.sub(r"\s+", " ", text).strip().lower().encode("utf-8")
    record = {
        "path": relative_text,
        "kind": document_kind(relative),
        "git_state": "tracked" if relative_text in tracked else "untracked" if relative_text in untracked else "ignored_or_external",
        "bytes": len(raw),
        "lines": text.count("\n") + (1 if text and not text.endswith("\n") else 0),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "normalized_sha256": hashlib.sha256(normalized).hexdigest(),
        "modified_utc": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
        "headings": len(HEADING_RE.findall(text)),
        "local_links": links,
        "broken_local_links": [
            link for link in links if link["kind"] in {"project_file", "outside_project"} and link["exists"] is False
        ],
        "application_route_links": [link for link in links if link["kind"] == "application_route"],
        "status_markers": sorted({match.group(0).lower() for match in STATUS_RE.finditer(text)}),
        "scope_hits": text.lower().count(scope.lower()) if scope else None,
    }
    return record, text


def build_report(root: Path, scope: str) -> dict[str, Any]:
    paths, skipped = markdown_files(root)
    tracked, untracked = tracked_paths(root)
    records: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []
    hashes: defaultdict[str, list[str]] = defaultdict(list)
    normalized_hashes: defaultdict[str, list[str]] = defaultdict(list)

    for path in paths:
        relative = path.relative_to(root).as_posix()
        try:
            record, _ = inspect_file(path, root, tracked, untracked, scope)
            records.append(record)
            hashes[record["sha256"]].append(relative)
            normalized_hashes[record["normalized_sha256"]].append(relative)
        except OSError as error:
            failures.append({"path": relative, "reason": str(error)})

    kind_counts = Counter(record["kind"] for record in records)
    matching = [
        record["path"]
        for record in records
        if not scope or scope.lower() in record["path"].lower() or bool(record["scope_hits"])
    ]
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": str(root),
        "scope": scope or None,
        "ledger": {
            "eligible": len(paths),
            "visited": len(records),
            "skipped": skipped,
            "failed": failures,
            "complete": len(records) + len(failures) == len(paths),
        },
        "totals": {
            "files": len(records),
            "lines": sum(record["lines"] for record in records),
            "bytes": sum(record["bytes"] for record in records),
            "by_kind": dict(sorted(kind_counts.items())),
        },
        "scope_matching_files": matching,
        "exact_duplicate_groups": [group for group in hashes.values() if len(group) > 1],
        "normalized_duplicate_groups": [group for group in normalized_hashes.values() if len(group) > 1],
        "broken_local_links": [
            {"path": record["path"], "links": record["broken_local_links"]}
            for record in records
            if record["broken_local_links"]
        ],
        "application_route_links": [
            {"path": record["path"], "links": record["application_route_links"]}
            for record in records
            if record["application_route_links"]
        ],
        "files": records,
    }


def markdown_report(report: dict[str, Any]) -> str:
    ledger = report["ledger"]
    totals = report["totals"]
    lines = [
        "# Project agent-memory inventory",
        "",
        f"- Root: `{report['root']}`",
        f"- Visited: {ledger['visited']} / {ledger['eligible']}",
        f"- Failed: {len(ledger['failed'])}",
        f"- Total: {totals['files']} files, {totals['lines']} lines, {totals['bytes']} bytes",
        f"- Exact duplicate groups: {len(report['exact_duplicate_groups'])}",
        f"- Broken-link files: {len(report['broken_local_links'])}",
        "",
        "| Path | Kind | Git | Lines | Broken links |",
        "| --- | --- | --- | ---: | ---: |",
    ]
    for record in report["files"]:
        lines.append(
            f"| `{record['path']}` | {record['kind']} | {record['git_state']} | "
            f"{record['lines']} | {len(record['broken_local_links'])} |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    args = parse_args()
    root = project_root(args.root)
    report = build_report(root, args.scope.strip())
    rendered = json.dumps(report, indent=2, ensure_ascii=False) if args.format == "json" else markdown_report(report)
    if args.output:
        output = args.output.expanduser().resolve()
        if output == root or root in output.parents:
            raise SystemExit("Refusing to write an audit report inside the project without explicit agent handling")
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered + ("\n" if args.format == "json" else ""), encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
