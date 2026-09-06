---
name: environments-manager
description: Set up per-worktree environments for Claude Code, Cursor, or Codex. Use for worktree-ready repos, IDE environment config, worktree-up/down scripts, or dev.sh wiring.
disable-model-invocation: true
user-invocable: true
---

Ask before writing. Use the host's question UI. Shared logic lives in `scripts/*.sh`; IDE configs only point at those files. Read a matching `examples/` file before writing, then adapt.

1. Ask what a fresh worktree should do (multi-select): copy ignored env files; install deps; isolate or seed a data backend; run codegen. Capture extra project steps in one follow-up.
2. Ask the backend. PostgreSQL → [postgresql.md](references/postgresql.md). Convex → [convex.md](references/convex.md). None → skip isolation. Any other backend: research official docs and an in-repo example; do not guess CLI flags; summarize before editing.
3. Ask which IDEs to wire (Claude Code, Cursor, Codex). Generate `scripts/` once. Then load [claude.md](references/claude.md), [cursor.md](references/cursor.md), and/or [codex.md](references/codex.md) for linking config only.

Required files: `scripts/worktree-up.sh`, `scripts/worktree-down.sh`, `scripts/dev.sh` (all must end in `.sh`). Put them on the source checkout, not only the current worktree.

Resolve paths as `WORKTREE_PATH="${CODEX_WORKTREE_PATH:-${CURSOR_WORKTREE_PATH:-$(pwd)}}"` and `SOURCE_PATH="${CODEX_SOURCE_TREE_PATH:-${ROOT_WORKTREE_PATH:-}}"`. Claude: use `WorktreeCreate`, never `SessionStart`; the wrapper adds the worktree then runs `worktree-up.sh` with `ROOT_WORKTREE_PATH` — see [claude.md](references/claude.md). Hook wrappers must survive a missing `/dev/tty`, a wrong default Node version, and CLI prompts.

`worktree-up.sh` is idempotent: `set -euo pipefail`, cd to the worktree, then the selected steps in order. Prefer `.worktreeinclude` for Claude env copy. Detect the lockfile for install. Read resource names from env/config or setup metadata; never invent them from branch names. Provide a reset escape hatch via `<PROJECT>_RESET_<RESOURCE>=1`.

`worktree-down.sh` cleans only resources this setup created. Missing tools: print one line and exit 0.

`dev.sh` picks a free port from `${DEV_PORT_START:-3910}`. Never hardcode a port.

Never commit or log secrets. Never embed multi-line programs in IDE config. Never destroy or import production data unless the user set an override env var. Put this guard in any import/replay helper:

```bash
assert_non_prod_ref() {
  case "$1" in
    prod|prod:*|prod/*|production|production:*|production/*)
      echo "refusing prod source: $1" >&2; exit 1 ;;
    *prod*|*production*)
      [ "${ALLOW_PROD_SOURCE:-0}" = "1" ] || { echo "looks like prod: $1" >&2; exit 1; } ;;
  esac
}
```

Expose Dev, typecheck, unit tests, and lint through the IDE; add E2E only if cheap.

After writing: `bash -n` the three scripts, `git status --short`, and parse generated TOML/JSON when those files exist.
