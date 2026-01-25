#!/bin/bash
# APEX Template Setup Script
# Creates output directory structure and initializes template files
#
# Usage: setup-templates.sh "feature-name" [other args...]
# The script auto-generates the task ID with the next available number.

set -e

# Arguments - first arg is now just the feature name (kebab-case)
FEATURE_NAME="$1"
TASK_DESCRIPTION="$2"
AUTO_MODE="${3:-false}"
EXAMINE_MODE="${4:-false}"
SAVE_MODE="${5:-false}"
TEST_MODE="${6:-false}"
ECONOMY_MODE="${7:-false}"
BRANCH_MODE="${8:-false}"
PR_MODE="${9:-false}"
INTERACTIVE_MODE="${10:-false}"
BRANCH_NAME="${11:-}"
ORIGINAL_INPUT="${12:-}"

# Validate required arguments
if [[ -z "$FEATURE_NAME" ]]; then
    echo "Error: FEATURE_NAME is required"
    exit 1
fi

if [[ -z "$TASK_DESCRIPTION" ]]; then
    echo "Error: TASK_DESCRIPTION is required"
    exit 1
fi

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Use current working directory as project root
PROJECT_ROOT=$(pwd)
APEX_OUTPUT_DIR="${PROJECT_ROOT}/.claude/output/apex"

# Create apex output directory if it doesn't exist
mkdir -p "$APEX_OUTPUT_DIR"

# Find the next available number
NEXT_NUM=1
if [[ -d "$APEX_OUTPUT_DIR" ]]; then
    # Find highest existing number prefix
    HIGHEST=$(ls -1 "$APEX_OUTPUT_DIR" 2>/dev/null | grep -oE '^[0-9]+' | sort -n | tail -1)
    if [[ -n "$HIGHEST" ]]; then
        # Force base-10 interpretation (leading zeros would be treated as octal)
        NEXT_NUM=$((10#$HIGHEST + 1))
    fi
fi

# Format with leading zeros (2 digits)
TASK_NUM=$(printf "%02d" "$NEXT_NUM")

# Build full task ID
TASK_ID="${TASK_NUM}-${FEATURE_NAME}"

OUTPUT_DIR="${APEX_OUTPUT_DIR}/${TASK_ID}"

# Get skill directory
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="${SKILL_DIR}/templates"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to replace template variables
render_template() {
    local template_file="$1"
    local output_file="$2"

    # Determine status strings based on flags
    local examine_status="⏭ Skip"
    [[ "$EXAMINE_MODE" == "true" ]] && examine_status="⏸ Pending"

    local test_status="⏭ Skip"
    [[ "$TEST_MODE" == "true" ]] && test_status="⏸ Pending"

    local pr_status="⏭ Skip"
    [[ "$PR_MODE" == "true" ]] && pr_status="⏸ Pending"

    # Read template and replace variables
    sed -e "s|{{task_id}}|${TASK_ID}|g" \
        -e "s|{{task_description}}|${TASK_DESCRIPTION}|g" \
        -e "s|{{timestamp}}|${TIMESTAMP}|g" \
        -e "s|{{auto_mode}}|${AUTO_MODE}|g" \
        -e "s|{{examine_mode}}|${EXAMINE_MODE}|g" \
        -e "s|{{save_mode}}|${SAVE_MODE}|g" \
        -e "s|{{test_mode}}|${TEST_MODE}|g" \
        -e "s|{{economy_mode}}|${ECONOMY_MODE}|g" \
        -e "s|{{branch_mode}}|${BRANCH_MODE}|g" \
        -e "s|{{pr_mode}}|${PR_MODE}|g" \
        -e "s|{{interactive_mode}}|${INTERACTIVE_MODE}|g" \
        -e "s|{{branch_name}}|${BRANCH_NAME}|g" \
        -e "s|{{original_input}}|${ORIGINAL_INPUT}|g" \
        -e "s|{{examine_status}}|${examine_status}|g" \
        -e "s|{{test_status}}|${test_status}|g" \
        -e "s|{{pr_status}}|${pr_status}|g" \
        "$template_file" > "$output_file"
}

# Initialize 00-context.md
render_template "${TEMPLATE_DIR}/00-context.md" "${OUTPUT_DIR}/00-context.md"

# Initialize other step files (only headers, content appended during execution)
render_template "${TEMPLATE_DIR}/01-analyze.md" "${OUTPUT_DIR}/01-analyze.md"
render_template "${TEMPLATE_DIR}/02-plan.md" "${OUTPUT_DIR}/02-plan.md"
render_template "${TEMPLATE_DIR}/03-execute.md" "${OUTPUT_DIR}/03-execute.md"
render_template "${TEMPLATE_DIR}/04-validate.md" "${OUTPUT_DIR}/04-validate.md"

# Conditional templates
if [[ "$EXAMINE_MODE" == "true" ]]; then
    render_template "${TEMPLATE_DIR}/05-examine.md" "${OUTPUT_DIR}/05-examine.md"
    render_template "${TEMPLATE_DIR}/06-resolve.md" "${OUTPUT_DIR}/06-resolve.md"
fi

if [[ "$TEST_MODE" == "true" ]]; then
    render_template "${TEMPLATE_DIR}/07-tests.md" "${OUTPUT_DIR}/07-tests.md"
    render_template "${TEMPLATE_DIR}/08-run-tests.md" "${OUTPUT_DIR}/08-run-tests.md"
fi

if [[ "$PR_MODE" == "true" ]]; then
    render_template "${TEMPLATE_DIR}/09-finish.md" "${OUTPUT_DIR}/09-finish.md"
fi

# Output the generated task_id for capture by caller
echo "TASK_ID=${TASK_ID}"
echo "OUTPUT_DIR=${OUTPUT_DIR}"
echo "✓ APEX templates initialized: ${OUTPUT_DIR}"
exit 0
