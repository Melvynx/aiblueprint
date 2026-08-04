#!/bin/bash
# Compatibility initializer for older APEX callers.

set -euo pipefail

FEATURE_NAME="${1:-}"
TASK_DESCRIPTION="${2:-}"

if [[ -z "$FEATURE_NAME" || -z "$TASK_DESCRIPTION" ]]; then
  echo "Usage: $0 <feature-name> <task-description> [legacy-options...]" >&2
  exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SKILL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

NEXT_NUMBER=1
while true; do
  RUN_ID=$(printf "%02d-%s" "$NEXT_NUMBER" "$FEATURE_NAME")
  if RESULT=$(python3 "${SKILL_DIR}/scripts/apex-state.py" init \
    --root "$PROJECT_ROOT" \
    --task "$TASK_DESCRIPTION" \
    --run-id "$RUN_ID" 2>&1); then
    break
  fi
  if [[ "$RESULT" != *"run already exists"* ]]; then
    echo "$RESULT" >&2
    exit 1
  fi
  NEXT_NUMBER=$((NEXT_NUMBER + 1))
done

OUTPUT_DIR=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["run_dir"])' <<<"$RESULT")
echo "TASK_ID=${RUN_ID}"
echo "OUTPUT_DIR=${OUTPUT_DIR}"
echo "APEX run initialized: ${OUTPUT_DIR}"
