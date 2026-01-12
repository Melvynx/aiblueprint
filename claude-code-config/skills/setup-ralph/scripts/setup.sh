#!/bin/bash
# Ralph Setup Script - Creates all Ralph files atomically
# Usage: ./setup.sh <project-path> [feature-name]

set -e

PROJECT_PATH="${1:-.}"
FEATURE_NAME="${2:-01-feature}"

# Resolve absolute path
PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)
RALPH_DIR="$PROJECT_PATH/.claude/ralph"
TASKS_DIR="$RALPH_DIR/tasks"
FEATURE_DIR="$TASKS_DIR/$FEATURE_NAME"

echo "🚀 Setting up Ralph in: $PROJECT_PATH"
echo "📁 Feature: $FEATURE_NAME"

# Create directory structure
mkdir -p "$RALPH_DIR"
mkdir -p "$FEATURE_DIR"

# Create ralph.sh (main loop script)
cat > "$RALPH_DIR/ralph.sh" << 'RALPH_SH'
#!/bin/bash
# Ralph - Autonomous AI Coding Loop
# Usage: ./ralph.sh -f <feature-folder> [-n <max-iterations>]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=10
FEATURE_FOLDER=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--feature)
      FEATURE_FOLDER="$2"
      shift 2
      ;;
    -n|--max)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./ralph.sh -f <feature-folder> [-n <max-iterations>]"
      exit 1
      ;;
  esac
done

if [ -z "$FEATURE_FOLDER" ]; then
  echo "❌ Error: Feature folder required"
  echo "Usage: ./ralph.sh -f <feature-folder> [-n <max-iterations>]"
  echo ""
  echo "Available features:"
  ls -1 "$SCRIPT_DIR/tasks/" 2>/dev/null || echo "  No features found. Create one first!"
  exit 1
fi

TASK_DIR="$SCRIPT_DIR/tasks/$FEATURE_FOLDER"

if [ ! -d "$TASK_DIR" ]; then
  echo "❌ Error: Feature folder not found: $TASK_DIR"
  echo ""
  echo "Available features:"
  ls -1 "$SCRIPT_DIR/tasks/" 2>/dev/null || echo "  No features found"
  exit 1
fi

PRD_FILE="$TASK_DIR/prd.json"
PROGRESS_FILE="$TASK_DIR/progress.txt"
PROMPT_FILE="$SCRIPT_DIR/prompt.md"

if [ ! -f "$PRD_FILE" ]; then
  echo "❌ Error: prd.json not found in $TASK_DIR"
  exit 1
fi

# Get story counts
TOTAL_STORIES=$(jq '.userStories | length' "$PRD_FILE")
COMPLETED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    🤖 RALPH STARTING                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Feature: $FEATURE_FOLDER"
echo "║ Stories: $COMPLETED / $TOTAL_STORIES completed"
echo "║ Max iterations: $MAX_ITERATIONS"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

for ((i=1; i<=$MAX_ITERATIONS; i++)); do
  # Refresh counts
  COMPLETED=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
  REMAINING=$((TOTAL_STORIES - COMPLETED))

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "📍 Iteration $i / $MAX_ITERATIONS | Completed: $COMPLETED / $TOTAL_STORIES | Remaining: $REMAINING"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  # Run Claude with the prompt
  OUTPUT=$(claude -p --dangerously-skip-permissions \
    "@$PRD_FILE @$PROGRESS_FILE @$PROMPT_FILE" 2>&1 \
    | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    ✅ RALPH COMPLETE                       ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║ All $TOTAL_STORIES stories completed in $i iterations!"
    echo "╚════════════════════════════════════════════════════════════╝"
    exit 0
  fi

  sleep 2
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ⚠️  MAX ITERATIONS                       ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Reached $MAX_ITERATIONS iterations. Run again to continue."
echo "╚════════════════════════════════════════════════════════════╝"
exit 1
RALPH_SH

chmod +x "$RALPH_DIR/ralph.sh"
echo "✅ Created ralph.sh"

# Create prompt.md (agent instructions)
cat > "$RALPH_DIR/prompt.md" << 'PROMPT_MD'
# Ralph Agent Instructions

## Your Task

You are an autonomous AI coding agent running in a loop. Each iteration, you implement ONE user story from the PRD.

## Execution Sequence

1. **Read Context**
   - Read the PRD (prd.json) to understand all user stories
   - Read progress.txt to see patterns and learnings from previous iterations
   - Identify the **highest priority** story where `passes: false`

2. **Check Git Branch**
   - Verify you're on the correct branch (see `branchName` in prd.json)
   - If not, checkout the branch: `git checkout <branchName>` or create it

3. **Implement ONE Story**
   - Focus on implementing ONLY the selected story
   - Follow the acceptance criteria exactly
   - Make minimal changes to achieve the goal

4. **Verify Quality**
   - Run typecheck (if applicable): `pnpm tsc --noEmit` or `npm run typecheck`
   - Run tests (if applicable): `pnpm test` or `npm test`
   - Fix any issues before proceeding

5. **Commit Changes**
   - Stage your changes: `git add .`
   - Commit with format: `feat: [STORY-ID] - [Title]`
   - Example: `feat: US-001 - Add login form validation`

6. **Update PRD**
   - Update prd.json to mark the story as `passes: true`
   - Add any notes about the implementation

7. **Log Learnings**
   - Append to progress.txt with format:

```
## [Date] - [Story ID]: [Title]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns

Check the TOP of progress.txt for patterns discovered by previous iterations:
- Follow existing patterns
- Add new patterns when you discover them
- Update patterns if they're outdated

## Stop Condition

**If ALL stories have `passes: true`**, output this exact text:

<promise>COMPLETE</promise>

This signals the loop to stop.

## Critical Rules

- 🛑 NEVER implement more than ONE story per iteration
- 🛑 NEVER skip the verification step (typecheck/tests)
- 🛑 NEVER commit if tests are failing
- ✅ ALWAYS check progress.txt for patterns FIRST
- ✅ ALWAYS update prd.json after implementing
- ✅ ALWAYS append learnings to progress.txt
PROMPT_MD

echo "✅ Created prompt.md"

# Create empty prd.json template
cat > "$FEATURE_DIR/prd.json" << 'PRD_JSON'
{
  "branchName": "feat/FEATURE_NAME",
  "userStories": []
}
PRD_JSON

# Replace placeholder
sed -i '' "s/FEATURE_NAME/${FEATURE_NAME}/g" "$FEATURE_DIR/prd.json" 2>/dev/null || \
sed -i "s/FEATURE_NAME/${FEATURE_NAME}/g" "$FEATURE_DIR/prd.json"

echo "✅ Created prd.json"

# Create progress.txt template
cat > "$FEATURE_DIR/progress.txt" << PROGRESS_TXT
# Ralph Progress Log
Started: $(date +%Y-%m-%d)
Feature: $FEATURE_NAME

## Codebase Patterns
(Add discovered patterns here - Ralph will read these each iteration)

---

PROGRESS_TXT

echo "✅ Created progress.txt"

# Create empty PRD.md
cat > "$FEATURE_DIR/PRD.md" << 'PRD_MD'
# Feature: [Feature Name]

## Vision
[What this feature accomplishes]

## Problem
[What problem does this solve]

## Solution
[High-level approach]

## User Stories
[Will be converted to prd.json]

## Technical Notes
[Implementation details, constraints, dependencies]
PRD_MD

echo "✅ Created PRD.md"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ RALPH SETUP COMPLETE                  ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Structure created at: $RALPH_DIR"
echo "║ Feature folder: $FEATURE_DIR"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Next steps:"
echo "║ 1. Edit PRD.md with your feature requirements"
echo "║ 2. Run /ralph -i to brainstorm PRD interactively"
echo "║ 3. Transform PRD to user stories in prd.json"
echo "║ 4. Run: bun run $RALPH_DIR/ralph.sh -f $FEATURE_NAME"
echo "╚════════════════════════════════════════════════════════════╝"
