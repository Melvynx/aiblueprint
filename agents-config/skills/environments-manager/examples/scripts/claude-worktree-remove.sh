#!/usr/bin/env bash
# Claude Code WorktreeRemove hook wrapper.
# Runs scripts/worktree-down.sh for cleanup, then removes the git worktree and branch.
#
# stdin contract: JSON with { "worktree_path": "<absolute-path>", ... }

set -euo pipefail

INPUT=$(cat)
WORKTREE=$(echo "$INPUT" | jq -r '.worktree_path')
REPO="$CLAUDE_PROJECT_DIR"
CLEANUP_TIMEOUT_SEC="${CLAUDE_WORKTREE_CLEANUP_TIMEOUT:-300}"

[[ ! -d "$WORKTREE" ]] && exit 0

LOG_FILE="$WORKTREE/.worktree-cleanup.log"
: > "$LOG_FILE" 2>/dev/null || LOG_FILE=""

log_to() {
  { echo "$*" > /dev/tty; } 2>/dev/null || true
  if [[ -n "$LOG_FILE" ]]; then
    echo "$(date '+%H:%M:%S') $*" >> "$LOG_FILE" 2>/dev/null || true
  fi
}

# Cleanup may call CLIs (e.g. convex env remove) that need the project's Node version.
if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1090,SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  if [[ -f "$WORKTREE/.nvmrc" ]]; then
    (cd "$WORKTREE" && nvm use >/dev/null 2>&1) || true
  fi
elif command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --use-on-cd)" || true
fi

run_cleanup() {
  cd "$WORKTREE"
  ROOT_WORKTREE_PATH="$REPO" CI=1 bash "${REPO}/scripts/worktree-down.sh"
}

if [[ -x "${REPO}/scripts/worktree-down.sh" ]]; then
  (
    run_cleanup >> "${LOG_FILE:-/dev/null}" 2>&1
  ) &
  CLEANUP_PID=$!

  (
    sleep "$CLEANUP_TIMEOUT_SEC"
    if kill -0 "$CLEANUP_PID" 2>/dev/null; then
      log_to "[claude-worktree-remove] TIMEOUT after ${CLEANUP_TIMEOUT_SEC}s - killing cleanup"
      kill -TERM "$CLEANUP_PID" 2>/dev/null || true
      sleep 3
      kill -KILL "$CLEANUP_PID" 2>/dev/null || true
    fi
  ) &
  WATCHDOG_PID=$!

  wait "$CLEANUP_PID" 2>/dev/null || true
  kill "$WATCHDOG_PID" 2>/dev/null || true
  wait "$WATCHDOG_PID" 2>/dev/null || true
fi

BRANCH=$(git -C "$WORKTREE" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
git -C "$REPO" worktree remove "$WORKTREE" --force 2>/dev/null || true
[[ -n "$BRANCH" && "$BRANCH" != "HEAD" ]] && git -C "$REPO" branch -D "$BRANCH" 2>/dev/null || true
