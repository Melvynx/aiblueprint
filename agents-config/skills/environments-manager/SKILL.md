---
name: environments-manager
description: Set up per-worktree environments for Claude Code, Cursor, or Codex. Use for worktree-ready repos, IDE environment config, worktree-up/down scripts, or dev.sh wiring.
disable-model-invocation: false
allow_implicit_invocation: true
---

# Environments Manager

Set up per-worktree environments so a fresh worktree is ready to run: env files copied, dependencies installed, optional data services isolated or seeded, generated code refreshed, and common commands exposed through the selected IDE. Supports Claude Code, Cursor, and Codex. The shared scripts are the same on every IDE; only the config file that points at them differs.

Keep this skill database-agnostic. The main flow decides what needs to happen; database-specific implementation details live in references and should be loaded only when that backend is relevant.

## Interactive Flow

This skill is interactive. Ask the user the questions below before writing anything. Use whichever interactive question mechanism the host harness provides. Do not assume answers.

### Step 1: What should happen in a fresh worktree?

Ask the user what the setup script should do, as a multi-select. The first option is the default-on baseline; the rest are additive opt-ins:

| Option | What it adds to `scripts/worktree-up.sh` |
| :--- | :--- |
| Copy ignored env files from the source checkout | Copy `.env`, `.env.local`, `.env.development.local` when the source has them and the worktree does not. For Claude Code, prefer `.worktreeinclude` when possible. |
| Install dependencies | `pnpm install`, `bun install`, `yarn install`, or `npm install` based on lockfile. |
| Isolate or seed a data backend | Load the backend reference when it exists. Otherwise use researcher agents to discover the project's backend, docs, and current best setup pattern before writing scripts. |
| Run codegen | Project-specific codegen such as Prisma, Drizzle, Convex, generated types, or SDK generation. |

If the user has project-specific steps such as seed data, S3/R2 sync, local services, webhook tunnels, fixture generation, or env cloning, ask one follow-up free-form question to capture them.

### Step 2: Which data backend, if any?

Ask which backend needs worktree isolation or seeding. Use the answer to decide which reference to load:

| Backend | Action |
| :--- | :--- |
| None | Keep setup to env copy, install, codegen, and dev scripts. |
| PostgreSQL | Load `references/postgresql.md`. |
| Convex | Load `references/convex.md`. |
| Other SQL or non-SQL backend | Use researcher agents to inspect the repo, official docs, and current CLI behavior. Then write a narrow project-specific approach instead of adapting PostgreSQL or Convex by analogy. |

For unknown backends, do not guess commands, reset behavior, file formats, import/export semantics, or production-safety flags. Ask researcher agents to find the official docs and at least one in-repo example or closely matching project pattern. Summarize the discovered approach before editing scripts.

### Step 3: Which IDEs should be wired up?

Ask a multi-select with options: Claude Code, Cursor, Codex. The user can pick any combination. Generate the shared `scripts/` directory once.

### Step 4: Apply each selected IDE

For each selected IDE, read the matching reference file and apply only its linking config. Do not duplicate script logic in IDE config; the IDE config points at `scripts/worktree-up.sh`, `scripts/worktree-down.sh`, and `scripts/dev.sh`.

- Claude Code -> load `references/claude.md`
- Cursor -> load `references/cursor.md`
- Codex -> load `references/codex.md`

## Shared Shape

Every project that uses this skill ends up with:

```text
scripts/
├── worktree-up.sh        # idempotent setup
├── worktree-down.sh      # cleanup before worktree teardown
├── dev.sh                # start dev server on a free port
└── (project-specific helpers, all *.sh)
```

Plus one or more IDE config files. The IDE config is thin; all logic lives in `scripts/`.

Naming convention: every generated script MUST end in `.sh`. No bare `worktree-up`, no `dev`. IDE configs reference scripts by full filename (`scripts/worktree-up.sh`, not `scripts/worktree-up`). This is enforced in every reference file and example.

## Environment Variable Cascade

Each IDE exposes different variables. The shared scripts accept all of them, in this priority:

```bash
WORKTREE_PATH="${CODEX_WORKTREE_PATH:-${CURSOR_WORKTREE_PATH:-$(pwd)}}"
SOURCE_PATH="${CODEX_SOURCE_TREE_PATH:-${ROOT_WORKTREE_PATH:-}}"
```

| Platform | Worktree path | Source checkout path | Setup trigger |
| :--- | :--- | :--- | :--- |
| Codex | `$CODEX_WORKTREE_PATH` | `$CODEX_SOURCE_TREE_PATH` | `[setup] script` in TOML, runs once per worktree. |
| Cursor | `pwd` inside worktree | `$ROOT_WORKTREE_PATH` | `setup-worktree-unix` in JSON, runs once per worktree. |
| Claude | `pwd` inside worktree after wrapper `cd` | `$CLAUDE_PROJECT_DIR` from the hook, re-exported as `ROOT_WORKTREE_PATH` by the wrapper | `WorktreeCreate` hook, runs once per worktree. |

Important about Claude Code: do not use `SessionStart` for setup; it fires every session. Use the `WorktreeCreate` hook, which fires once when `claude --worktree` creates the worktree. The Claude wrapper script (`scripts/claude-worktree-create.sh`) is responsible for calling `git worktree add` itself, then handing off to `scripts/worktree-up.sh` inside the new worktree with `ROOT_WORKTREE_PATH` set. See `references/claude.md`.

If no env var yields a source checkout, fall back to a project-specific absolute path only when you can infer it confidently. Otherwise ask the user during Step 1.

## `scripts/worktree-up.sh`

Setup must be idempotent: reruns are safe. Build the script from the user's Step 1 selections and any backend reference loaded in Step 2. Required behavior in order:

1. `set -euo pipefail`.
2. Resolve `WORKTREE_PATH` and `SOURCE_PATH`.
3. `cd "$WORKTREE_PATH"`.
4. If env copying was selected, copy `.env`, `.env.local`, `.env.development.local` only when the source has them and the worktree does not.
5. If dependency install was selected, detect the lockfile and run the matching install.
6. If backend isolation/seeding was selected, apply the backend reference or the researched project-specific approach.
7. If codegen was selected, run the project's codegen command.
8. Append any free-form project-specific steps from Step 1.

Base template, before backend-specific additions:

```bash
#!/usr/bin/env bash
set -euo pipefail

WORKTREE_PATH="${CODEX_WORKTREE_PATH:-${CURSOR_WORKTREE_PATH:-$(pwd)}}"
SOURCE_PATH="${CODEX_SOURCE_TREE_PATH:-${ROOT_WORKTREE_PATH:-$HOME/Developer/saas/<repo>}}"

cd "$WORKTREE_PATH"

# Copy ignored env files.
# NOTE for Claude Code users: .worktreeinclude handles this natively. Prefer it
# over the cp loop when the project uses Claude's --worktree.
for f in .env .env.local .env.development.local; do
  if [[ -f "$SOURCE_PATH/$f" && ! -f "$WORKTREE_PATH/$f" ]]; then
    cp "$SOURCE_PATH/$f" "$WORKTREE_PATH/$f"
    echo "copied $f"
  fi
done

# Install deps.
if   [[ -f pnpm-lock.yaml ]]; then pnpm install
elif [[ -f bun.lock || -f bun.lockb ]]; then bun install
elif [[ -f yarn.lock ]]; then yarn install
elif [[ -f package-lock.json ]]; then npm install
fi

# Backend isolation/seeding and codegen go here.
```

## `scripts/worktree-down.sh`

Cleanup runs before the IDE destroys the worktree. Keep cleanup scoped to resources that the setup script created or selected explicitly.

1. `set -euo pipefail`.
2. Resolve `WORKTREE_PATH`.
3. `cd "$WORKTREE_PATH"`.
4. Run backend-specific cleanup only when the loaded backend reference requires it.
5. Remove copied local env files only if that is appropriate for the project.
6. If required tools or env files are missing, print one short message and exit 0.

Never guess resource names from branch names. Read names from the worktree's env/config files or from deterministic setup metadata created by `worktree-up.sh`.

## `scripts/dev.sh`

Pick a free port so multiple worktrees can run in parallel.

```bash
#!/usr/bin/env bash
set -euo pipefail

WORKTREE_PATH="${CODEX_WORKTREE_PATH:-${CURSOR_WORKTREE_PATH:-$(pwd)}}"
cd "$WORKTREE_PATH"

port="${DEV_PORT_START:-3910}"
while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
  port=$((port + 1))
done

echo "Starting app on http://localhost:$port"
exec pnpm dev -p "$port"  # adjust for the project package manager
```

## Standard Actions

Every project should expose these four actions through the IDE's own mechanism:

| Action | Command (typical) |
| :--- | :--- |
| Dev | `scripts/dev.sh` |
| Typecheck | `pnpm ts` / `bun run typecheck` |
| Unit tests | `pnpm test:ci` / `bun test` |
| Lint | `pnpm lint:ci` / `bun run lint` |

Add `E2E` as an action only if the suite is cheap enough to run interactively.

## Universal Guardrails

- Never commit secrets. Copying ignored env files into a local worktree is fine; logging them is not.
- Never put fragile multi-line shell programs inside an IDE config file. Keep all logic in `scripts/`; the IDE config just calls those scripts.
- Never hardcode a dev port. Pick a free one starting from `${DEV_PORT_START:-3910}`.
- Setup must be idempotent. Provide a reset escape hatch for stateful resources via env var (`<PROJECT>_RESET_<RESOURCE>=1`).
- Print resource names and redacted hosts only.
- The scripts and IDE config must live on the source checkout / main branch, not only the current worktree, or future worktrees will have nothing to copy.
- Never destroy or import from production data by default. Any setup step that exports from a shared source and replays into a worktree must reject production-looking refs unless the user explicitly approved an override env var.
- Hook wrappers must survive a missing `/dev/tty`, a wrong default Node version, and CLI prompts. See `references/claude.md` -> "Hook Robustness" for the concrete fixes.

Use this production-source guard in backend references or project-specific helpers:

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

## Verification

After generating files:

```bash
bash -n scripts/worktree-up.sh scripts/worktree-down.sh scripts/dev.sh
git status --short
```

If Python 3.11+ is available, validate generated TOML:

```bash
python3 - <<'PY'
import tomllib
with open(".codex/environments/environment.toml", "rb") as f:
    tomllib.load(f)
PY
```

For JSON configs:

```bash
python3 -c "import json; json.load(open('.cursor/worktrees.json'))"
python3 -c "import json; json.load(open('.claude/settings.json'))"
```

## References

Load only the references relevant to the selected backend and IDE:

- `references/postgresql.md` - PostgreSQL isolation, reset, and cleanup.
- `references/convex.md` - Convex local/cloud deployments, allowlisted seeding, env cloning, and cleanup.
- `references/claude.md` - Claude Code WorktreeCreate/WorktreeRemove wiring.
- `references/cursor.md` - Cursor worktree setup wiring.
- `references/codex.md` - Codex local environment TOML.

## Examples

Working examples live under `examples/`. Read the relevant example before writing files into a real project, but do not copy verbatim. The user's selections, backend reference, and project conventions determine which sections survive.

```text
examples/
├── scripts/
│   ├── worktree-up.sh
│   ├── worktree-down.sh
│   ├── dev.sh
│   ├── convex-selective-seed.sh
│   ├── claude-worktree-create.sh
│   └── claude-worktree-remove.sh
├── claude/
│   ├── .worktreeinclude
│   ├── settings.json
│   └── commands/
├── cursor/
│   └── worktrees.json
└── codex/
    └── environments/
        └── environment.toml
```
