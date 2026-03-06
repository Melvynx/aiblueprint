#!/bin/bash
# APEX Progress Update Script
# Updates 00-context.md progress table

set -e

# Arguments
TASK_ID="$1"
STEP_NUMBER="$2"
STEP_NAME="$3"
STATUS="$4"  # "in_progress" or "complete"

# Validate required arguments
if [[ -z "$TASK_ID" ]] || [[ -z "$STEP_NUMBER" ]] || [[ -z "$STEP_NAME" ]] || [[ -z "$STATUS" ]]; then
    echo "Usage: $0 <task_id> <step_number> <step_name> <status>"
    echo "Example: $0 01-add-auth 01 analyze complete"
    exit 1
fi

# Find project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
CONTEXT_FILE="${PROJECT_ROOT}/.claude/output/apex/${TASK_ID}/00-context.md"

# Validate context file exists
if [[ ! -f "$CONTEXT_FILE" ]]; then
    echo "Error: Context file not found: $CONTEXT_FILE"
    exit 1
fi

# Get timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Determine status symbol
if [[ "$STATUS" == "in_progress" ]]; then
    STATUS_SYMBOL="⏳ In Progress"
elif [[ "$STATUS" == "complete" ]]; then
    STATUS_SYMBOL="✓ Complete"
else
    echo "Error: Invalid status. Use 'in_progress' or 'complete'"
    exit 1
fi

# Create temp file
TEMP_FILE=$(mktemp)

# Update the progress table
awk -v step="${STEP_NUMBER}-${STEP_NAME}" \
    -v status="$STATUS_SYMBOL" \
    -v timestamp="$TIMESTAMP" '
BEGIN { in_table = 0; found = 0 }
{
    # Detect progress table start
    if ($0 ~ /^## Progress/) {
        in_table = 1
        print $0
        next
    }

    # If in table and found the matching step
    if (in_table && $0 ~ "\\| " step " \\|") {
        printf "| %s | %s | %s |\n", step, status, timestamp
        found = 1
        next
    }

    # Print line as-is
    print $0
}
END {
    if (!found) {
        print "Warning: Step not found in progress table" > "/dev/stderr"
    }
}
' "$CONTEXT_FILE" > "$TEMP_FILE"

# Replace original file
mv "$TEMP_FILE" "$CONTEXT_FILE"

echo "✓ Progress updated: ${STEP_NUMBER}-${STEP_NAME} → ${STATUS_SYMBOL}"
exit 0
