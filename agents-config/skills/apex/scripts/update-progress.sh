#!/bin/bash
# Backward-compatible progress event writer for older APEX callers.

set -euo pipefail

RUN_ID="${1:-}"
STEP_NUMBER="${2:-}"
STEP_NAME="${3:-}"
STATUS="${4:-}"

if [[ -z "$RUN_ID" || -z "$STEP_NUMBER" || -z "$STEP_NAME" || -z "$STATUS" ]]; then
  echo "Usage: $0 <run-id> <step-number> <step-name> <status>" >&2
  exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SKILL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

python3 "${SKILL_DIR}/scripts/apex-state.py" event \
  --root "$PROJECT_ROOT" \
  --run-id "$RUN_ID" \
  --phase "$STEP_NAME" \
  --status "$STATUS" \
  --message "Legacy progress update ${STEP_NUMBER}-${STEP_NAME}"
