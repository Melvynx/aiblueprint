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
SAVE_MODE="${4:-false}"
ECONOMY_MODE="${5:-false}"
BRANCH_MODE="${6:-false}"
INTERACTIVE_MODE="${7:-false}"
BRANCH_NAME="${8:-}"
ORIGINAL_INPUT="${9:-}"

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

    # Read template and replace variables
    sed -e "s|{{task_id}}|${TASK_ID}|g" \
        -e "s|{{task_description}}|${TASK_DESCRIPTION}|g" \
        -e "s|{{timestamp}}|${TIMESTAMP}|g" \
        -e "s|{{auto_mode}}|${AUTO_MODE}|g" \
        -e "s|{{save_mode}}|${SAVE_MODE}|g" \
        -e "s|{{economy_mode}}|${ECONOMY_MODE}|g" \
        -e "s|{{branch_mode}}|${BRANCH_MODE}|g" \
        -e "s|{{interactive_mode}}|${INTERACTIVE_MODE}|g" \
        -e "s|{{branch_name}}|${BRANCH_NAME}|g" \
        -e "s|{{original_input}}|${ORIGINAL_INPUT}|g" \
        "$template_file" > "$output_file"
}

# Initialize 00-context.md
render_template "${TEMPLATE_DIR}/00-context.md" "${OUTPUT_DIR}/00-context.md"

# Initialize other step files (only headers, content appended during execution)
render_template "${TEMPLATE_DIR}/01-analyze.md" "${OUTPUT_DIR}/01-analyze.md"
render_template "${TEMPLATE_DIR}/02-plan.md" "${OUTPUT_DIR}/02-plan.md"
render_template "${TEMPLATE_DIR}/03-execute.md" "${OUTPUT_DIR}/03-execute.md"
render_template "${TEMPLATE_DIR}/04-validate.md" "${OUTPUT_DIR}/04-validate.md"

# Output the generated task_id for capture by caller
echo "TASK_ID=${TASK_ID}"
echo "OUTPUT_DIR=${OUTPUT_DIR}"
echo "✓ APEX templates initialized: ${OUTPUT_DIR}"
exit 0
