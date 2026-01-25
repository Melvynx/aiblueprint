---
name: step-00-init
description: Parse flags, set up Ralph structure, detect existing PRD
prev_step: null
next_step: steps/step-01-interactive-prd.md
---

# Step 0: Initialize Ralph

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip the setup script - it creates files atomically
- 🛑 NEVER run ralph.sh - only set up files and show commands
- ✅ ALWAYS resolve project path to absolute path
- ✅ ALWAYS check for existing Ralph structure before creating
- ✅ ALWAYS let user run commands themselves
- 📋 YOU ARE an initializer, not an executor
- 💬 FOCUS on parsing flags and setting up structure only
- 🚫 FORBIDDEN to create PRD content in this step
- 🚫 FORBIDDEN to execute ralph.sh

## EXECUTION PROTOCOLS:

- 🎯 Parse all flags before taking any action
- 💾 Run setup script to create file structure
- 📖 Complete setup fully before next step
- 🚫 FORBIDDEN to load next step until structure exists

## CONTEXT BOUNDARIES:

- User arguments are available in the skill invocation
- No previous state exists (this is the first step)
- Setup script will create all necessary files

## YOUR TASK:

Initialize Ralph by parsing flags, running the setup script, and preparing for PRD creation.

---

## EXECUTION SEQUENCE:

### 1. Parse User Arguments

Extract from skill arguments:

```yaml
# DEFAULTS
project_path: "."              # Current directory if not specified
interactive_mode: false        # -i or --interactive
setup_only: false              # --setup-only
feature_name: null             # -f or --feature <name>
```

**Parsing Rules:**
- First non-flag argument = project_path
- `-i` or `--interactive` = interactive_mode: true
- `--setup-only` = setup_only: true
- `-f <name>` or `--feature <name>` = feature_name

### 2. Validate Project Path

```bash
# Check project exists
if [ ! -d "{project_path}" ]; then
  echo "Error: Project path not found"
  exit 1
fi

# Resolve to absolute path
project_path=$(cd "{project_path}" && pwd)
```

### 3. Generate Feature Name (if not provided)

If `{feature_name}` is null:
- Use AskUserQuestion to get feature name
- Generate kebab-case ID: `NN-feature-name`
- NN = next available number (01, 02, 03...)

**If interactive_mode = false and no feature_name:**
```yaml
questions:
  - header: "Feature"
    question: "What is the name of this feature? (will be used for folder name)"
    options:
      - label: "Let me type it"
        description: "I'll provide a custom feature name"
    multiSelect: false
```

### 4. Set State Variables

```yaml
{project_path}: "/absolute/path/to/project"
{ralph_dir}: "{project_path}/.claude/ralph"
{tasks_dir}: "{ralph_dir}/tasks"
{feature_name}: "01-feature-name"
{feature_dir}: "{tasks_dir}/{feature_name}"
{interactive_mode}: true/false
{setup_only}: true/false
```

### 5. Check for Existing Structure

```bash
# Check if Ralph already exists
if [ -d "{ralph_dir}" ]; then
  echo "✅ Ralph structure already exists"
fi

# Check if feature folder exists
if [ -d "{feature_dir}" ]; then
  echo "✅ Feature folder already exists"
  # Check for existing PRD
  if [ -f "{feature_dir}/PRD.md" ]; then
    echo "📄 Found existing PRD.md"
    {has_existing_prd} = true
  fi
  if [ -f "{feature_dir}/prd.json" ]; then
    # Check if prd.json has stories
    stories_count=$(jq '.userStories | length' "{feature_dir}/prd.json")
    if [ "$stories_count" -gt 0 ]; then
      echo "📋 Found $stories_count user stories in prd.json"
      {has_user_stories} = true
    fi
  fi
fi
```

### 6. Run Setup Script

**Use Bash tool to run the setup script:**

```bash
# Make script executable and run it
chmod +x /Users/melvynx/.claude/skills/setup-ralph/scripts/setup.sh
/Users/melvynx/.claude/skills/setup-ralph/scripts/setup.sh "{project_path}" "{feature_name}"
```

The setup script creates:
- `.claude/ralph/ralph.sh` (main loop)
- `.claude/ralph/prompt.md` (agent instructions)
- `.claude/ralph/tasks/{feature_name}/PRD.md` (empty template)
- `.claude/ralph/tasks/{feature_name}/prd.json` (empty stories)
- `.claude/ralph/tasks/{feature_name}/progress.txt` (learning log)

### 7. Determine Next Step

**Decision Tree:**

```
If {setup_only} = true:
  → Show success message, END workflow

If {has_user_stories} = true:
  → Skip to step-03-finish.md (ready to run)

If {has_existing_prd} = true AND content is not template:
  → Skip to step-02-create-stories.md (transform PRD to stories)

If {interactive_mode} = true:
  → Load step-01-interactive-prd.md (brainstorm PRD)

Else:
  → Ask user what to do next
```

**If need to ask:**
```yaml
questions:
  - header: "Next Step"
    question: "Ralph is set up. What would you like to do next?"
    options:
      - label: "Create PRD interactively (Recommended)"
        description: "Brainstorm and create PRD with AI assistance"
      - label: "I'll write PRD manually"
        description: "Edit PRD.md yourself, then run /setup-ralph again"
      - label: "Transform existing PRD to stories"
        description: "I already have a PRD, just create user stories"
    multiSelect: false
```

---

## SUCCESS METRICS:

✅ Project path resolved to absolute path
✅ Feature name generated or provided
✅ Setup script executed successfully
✅ All Ralph files created
✅ State variables properly set
✅ Next step determined

## FAILURE MODES:

❌ Project path doesn't exist
❌ Setup script fails
❌ Permission denied creating directories
❌ Feature name contains invalid characters

## INIT PROTOCOLS:

- Always use absolute paths
- Always run setup script (it's idempotent)
- Never modify existing PRD.md if it has content
- Use AskUserQuestion for any user decisions

## NEXT STEP:

Based on decision tree above, load the appropriate next step.

<critical>
Remember: This step ONLY sets up structure. PRD content is created in step-01.
</critical>
