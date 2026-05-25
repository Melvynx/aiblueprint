#!/usr/bin/env bash
# Claude Code WorktreeCreate hook wrapper.
# Replaces default `git worktree add` behavior, then runs the shared scripts/worktree-up.sh.
#
# stdin contract:  JSON with { "name": "<worktree-name>", ... }
# stdout contract: the absolute worktree path and NOTHING ELSE.
# Progress goes to <worktree>/.worktree-setup.log AND /dev/tty when available.

set -euo pipefail

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name')
REPO="$CLAUDE_PROJECT_DIR"
WORKTREE="${REPO}/.claude/worktrees/${NAME}"
BRANCH="worktree-${NAME}"
SETUP_TIMEOUT_SEC="${CLAUDE_WORKTREE_SETUP_TIMEOUT:-900}"

LOG_FILE=""

# Both the /dev/tty redirect AND the log append are guarded so a missing tty or
# read-only worktree never aborts the hook (the script runs under `set -e`).
log_to() {
  { echo "$*" > /dev/tty; } 2>/dev/null || true
  if [[ -n "$LOG_FILE" ]]; then
    echo "$(date '+%H:%M:%S') $*" >> "$LOG_FILE" 2>/dev/null || true
  fi
}

log_to "[claude-worktree-create] Creating worktree (branch: $BRANCH)..."

mkdir -p "${REPO}/.claude/worktrees"
if git -C "$REPO" rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git -C "$REPO" worktree add "$WORKTREE" "$BRANCH" >/dev/null 2>&1
else
  git -C "$REPO" worktree add -b "$BRANCH" "$WORKTREE" HEAD >/dev/null 2>&1
fi

LOG_FILE="$WORKTREE/.worktree-setup.log"
: > "$LOG_FILE"

# Hooks inherit the shell default Node, NOT the project's .nvmrc. Many CLIs
# (e.g. Convex) crash on older Node. Source nvm/fnm so `node` resolves to
# whatever the worktree's .nvmrc demands.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  if [[ -f "$WORKTREE/.nvmrc" ]]; then
    (cd "$WORKTREE" && nvm use >/dev/null 2>&1) || true
  fi
elif command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd)" || true
fi

log_to "[claude-worktree-create] Using node: $(node --version 2>&1 || echo unknown)"

run_setup() {
  cd "$WORKTREE"
  # CI=1 keeps interactive CLIs (convex, prisma, etc.) from prompting and hanging.
  ROOT_WORKTREE_PATH="$REPO" \
  CLAUDE_WORKTREE_NAME="$NAME" \
  CI=1 \
    bash "${REPO}/scripts/worktree-up.sh"
}

# Watchdog: hard-kill setup after SETUP_TIMEOUT_SEC. macOS has no `timeout`
# command by default, so we background the setup and a sleeper that kills it
# on timeout. Without this, an interactive prompt would hang the hook forever.
(
  run_setup >> "$LOG_FILE" 2>&1
) &
SETUP_PID=$!

(
  sleep "$SETUP_TIMEOUT_SEC"
  if kill -0 "$SETUP_PID" 2>/dev/null; then
    echo "[claude-worktree-create] TIMEOUT after ${SETUP_TIMEOUT_SEC}s - killing setup (PID $SETUP_PID)" >> "$LOG_FILE"
    kill -TERM "$SETUP_PID" 2>/dev/null || true
    sleep 5
    kill -KILL "$SETUP_PID" 2>/dev/null || true
  fi
) &
WATCHDOG_PID=$!

SETUP_EXIT=0
wait "$SETUP_PID" || SETUP_EXIT=$?
kill "$WATCHDOG_PID" 2>/dev/null || true
wait "$WATCHDOG_PID" 2>/dev/null || true

if [[ "$SETUP_EXIT" -ne 0 ]]; then
  log_to "[claude-worktree-create] worktree-up.sh exited $SETUP_EXIT - see $LOG_FILE"
else
  log_to "[claude-worktree-create] Worktree ready."
fi

# THE ONLY THING ON STDOUT - Claude parses this as the cwd.
echo "$WORKTREE"
