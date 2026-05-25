# Claude Code Linking

Wire the shared `scripts/worktree-up.sh` and `scripts/worktree-down.sh` into Claude Code's native worktree system.

## What Claude Code Actually Provides

Claude Code DOES have native worktree support. It is fired on real worktree creation, not on every session.

| Mechanism | What it does |
| :--- | :--- |
| `claude --worktree <name>` (or `-w`) | Creates worktree at `.claude/worktrees/<name>/` on branch `worktree-<name>` |
| `.worktreeinclude` file (gitignore syntax) | Auto-copies matching **gitignored** files (e.g. `.env`, `.env.local`) into every new worktree - **no scripting required** |
| `WorktreeCreate` hook | Runs ONCE when a worktree is created. **Replaces the default `git worktree add` behavior** - the hook script must call `git worktree add` itself and print the worktree path to stdout |
| `WorktreeRemove` hook | Runs when a worktree is being deleted. Receives `worktree_path` on stdin |
| `$CLAUDE_PROJECT_DIR` | Path to the source repo root inside hook scripts |

**Do NOT use `SessionStart` for worktree setup.** `SessionStart` fires on every new conversation in any worktree, not on worktree creation. It would rerun setup every time the user opens a session.

The "run once when worktree is created" hook is `WorktreeCreate` - that is the correct mechanism.

There is no separate `PostWorktreeCreate` hook (feature request #27744 is open). Because `WorktreeCreate` replaces the default git logic, the hook script must be responsible for both the `git worktree add` call AND the project setup.

## Files to Generate

```text
.worktreeinclude                  # gitignore-syntax list of files to auto-copy
.claude/
├── settings.json                 # WorktreeCreate + WorktreeRemove hooks
└── commands/                     # optional: per-action slash commands
    ├── dev.md
    ├── typecheck.md
    ├── test.md
    └── lint.md
scripts/
├── claude-worktree-create.sh     # WorktreeCreate hook wrapper
├── claude-worktree-remove.sh     # WorktreeRemove hook wrapper
└── (shared worktree-up.sh / worktree-down.sh / dev.sh)
```

`.gitignore` must also include `**/.claude/worktrees/`.

## `.worktreeinclude`

If "Copy ignored env files" was selected in Step 1, **prefer `.worktreeinclude` over the bash `cp` loop** - it's native, zero-script, and runs on every worktree path (CLI `--worktree`, subagent worktrees, desktop parallel sessions).

```
.env
.env.local
.env.development.local
```

Only files matching a pattern **and** gitignored are copied. Tracked files are never duplicated.

## `.claude/settings.json`

```json
{
  "hooks": {
    "WorktreeCreate": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/claude-worktree-create.sh"
          }
        ]
      }
    ],
    "WorktreeRemove": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/claude-worktree-remove.sh"
          }
        ]
      }
    ]
  }
}
```

If the project already has a `settings.json`, **merge** the `hooks` block. Do not overwrite.

## `scripts/claude-worktree-create.sh` & `claude-worktree-remove.sh`

These wrappers exist because Claude's `WorktreeCreate` hook has Claude-specific responsibilities the shared `scripts/worktree-up.sh` cannot handle:

1. Call `git worktree add` itself (Claude does not do it).
2. Print the worktree path - and **only** the path - to stdout.
3. Send progress output to a log file (and to `/dev/tty` only when available).

**Do not inline the wrapper code into this doc.** The full, battle-tested wrappers live in `examples/scripts/claude-worktree-create.sh` and `claude-worktree-remove.sh`. Always start from those — they encode every gotcha listed in "Hook Robustness" below. The wrappers do these things in order:

1. Read `name` from stdin JSON, compute `WORKTREE` and `BRANCH`.
2. Create the worktree (reusing a matching branch if it exists).
3. Open a log file at `<worktree>/.worktree-setup.log`.
4. Source `nvm` or `fnm` and activate the worktree's `.nvmrc` (so child CLIs see the right Node).
5. Run `scripts/worktree-up.sh` with `ROOT_WORKTREE_PATH`, `CLAUDE_WORKTREE_NAME`, and `CI=1` set, under a watchdog that hard-kills after `CLAUDE_WORKTREE_SETUP_TIMEOUT` (default 900s).
6. Echo the worktree path on stdout — and absolutely nothing else.

The remove wrapper mirrors steps 3–5 for cleanup, then runs `git worktree remove --force` + `git branch -D`.

`ROOT_WORKTREE_PATH` is set so the shared `scripts/worktree-up.sh` can locate the source checkout via the existing cascade (`CODEX_SOURCE_TREE_PATH` → `ROOT_WORKTREE_PATH`).

## Hook Robustness (lessons from a real project)

These five fixes turn a wrapper that "works on my machine" into one that survives Claude's actual hook execution context. Every one of these came from a real bug.

1. **`set -e` + `> /dev/tty` will abort the hook.** When Claude runs the hook as a child process, `/dev/tty` may exist but be non-writable, and the redirect failure under `set -e` kills the whole script before setup ever runs. Always wrap the redirect: `{ echo "$*" > /dev/tty; } 2>/dev/null || true`. Testing with `[[ -w /dev/tty ]]` is NOT enough — the perm test can pass while the open call still fails.

2. **Hooks inherit the shell default Node, not the worktree's `.nvmrc`.** If the project's CLI tools require a newer Node (Convex needs 24+; older Node crashes on regex `v` flag), the hook will instantly die. Source `~/.nvm/nvm.sh` or run `fnm env` at the top of the wrapper, then `nvm use` inside the worktree.

3. **Always log to a file.** A hook that crashes silently is impossible to debug from the UI. Open `<worktree>/.worktree-setup.log` early, append every step. The user can `tail -f` it during the next attempt.

4. **Add a watchdog timeout — macOS has no `timeout` command.** Background the setup, background a sleep+kill, `wait` on the setup. Without a watchdog, a single interactive CLI prompt (convex, prisma, vercel) can hang the hook forever — which is what users see as "the script is infinite."

5. **Set `CI=1` before calling the setup script.** Many CLIs read `CI` and switch to non-interactive mode (skip prompts, suppress spinners). It's the cheapest insurance against interactive hangs.

## Common Misconception: Agent Worktrees

The `WorktreeCreate` hook **only fires for `claude --worktree` from the CLI**. The Agent tool's `isolation: "worktree"` feature, and parallel-session worktrees created via the desktop app, create worktrees at `~/Developer/worktrees/<repo>/<name>/` on branch `claude/<name>` — those do **not** trigger this hook. If you need setup there, the user must run `scripts/worktree-up.sh` inside the agent worktree manually (or wire a different mechanism).

Also: **`.claude/settings.json` changes only take effect after restarting Claude.** A running session keeps the old hook config. Tell the user to restart before testing.

## Custom Slash Commands as Actions (optional)

Claude Code does not have a top-bar action menu. To expose the standard actions, write one file per action under `.claude/commands/`. Each is a tiny prompt that tells Claude to run the matching shared script or package-manager command.

See `examples/claude/commands/` for the four standard ones (`dev.md`, `typecheck.md`, `test.md`, `lint.md`).

## Guardrails

- **Never use `SessionStart` for one-time worktree setup** - it fires every session. Use `WorktreeCreate`.
- **Never let `git worktree add` write to stdout** in the `WorktreeCreate` hook - redirect with `>/dev/null 2>&1`. Anything on stdout besides the path breaks Claude's parser.
- **Read stdin once** with `INPUT=$(cat)` - stdin cannot be re-read.
- **Always merge** into the existing `.claude/settings.json`, never overwrite.
- The hook must live in `.claude/settings.json`, not `.claude/settings.local.json` - it must be checked in.
- Prefer `.worktreeinclude` over a bash `cp` loop for env files. Use the `cp` loop only when you need conditional or non-gitignored copies.
- Add `**/.claude/worktrees/` to `.gitignore` so worktree contents do not pollute the main repo's `git status`.

## Verification

```bash
python3 -c "import json; json.load(open('.claude/settings.json'))"
bash -n scripts/claude-worktree-create.sh scripts/claude-worktree-remove.sh
test -x scripts/claude-worktree-create.sh scripts/claude-worktree-remove.sh
grep -q '.claude/worktrees' .gitignore || echo "ADD: **/.claude/worktrees/ to .gitignore"
```

## Online References

- Run parallel sessions with worktrees: https://code.claude.com/docs/en/worktrees
- Hooks reference (WorktreeCreate, WorktreeRemove): https://code.claude.com/docs/en/hooks
- Community reference implementation: https://github.com/tfriedel/claude-worktree-hooks
- Open feature request for PostWorktreeCreate: https://github.com/anthropics/claude-code/issues/27744
