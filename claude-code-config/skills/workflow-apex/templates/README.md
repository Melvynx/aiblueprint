# APEX Template System

## Overview

This directory contains template files used to initialize APEX workflow outputs when save mode (`-s`) is enabled. This template system significantly reduces token usage by moving repetitive content out of step files.

## Template Files

| Template | Purpose | Created When |
|----------|---------|--------------|
| `00-context.md` | Workflow configuration and progress tracking | Always (if save_mode) |
| `01-analyze.md` | Analysis findings | Always (if save_mode) |
| `02-plan.md` | Implementation plan | Always (if save_mode) |
| `03-execute.md` | Implementation log | Always (if save_mode) |
| `04-validate.md` | Validation results | Always (if save_mode) |
| `05-examine.md` | Adversarial review findings | Only if examine_mode enabled |
| `06-resolve.md` | Finding resolution log | Only if examine_mode enabled |
| `07-tests.md` | Test analysis and creation | Only if test_mode enabled |
| `08-run-tests.md` | Test runner log | Only if test_mode enabled |
| `09-finish.md` | PR creation log | Only if pr_mode enabled |
| `step-complete.md` | Completion marker template | Referenced in steps |

## Template Variables

Templates use `{{variable}}` syntax for placeholders:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{task_id}}` | Kebab-case task identifier | `01-add-auth-middleware` |
| `{{task_description}}` | Plain text task description | `add authentication middleware` |
| `{{timestamp}}` | ISO 8601 timestamp | `2026-01-12T10:30:00Z` |
| `{{auto_mode}}` | Auto mode flag | `true` or `false` |
| `{{examine_mode}}` | Examine mode flag | `true` or `false` |
| `{{save_mode}}` | Save mode flag | `true` or `false` |
| `{{test_mode}}` | Test mode flag | `true` or `false` |
| `{{economy_mode}}` | Economy mode flag | `true` or `false` |
| `{{branch_mode}}` | Branch mode flag | `true` or `false` |
| `{{pr_mode}}` | PR mode flag | `true` or `false` |
| `{{interactive_mode}}` | Interactive mode flag | `true` or `false` |
| `{{branch_name}}` | Git branch name | `feature/add-auth` |
| `{{original_input}}` | Raw user input | `/apex -a -s add auth` |
| `{{examine_status}}` | Progress status for examine steps | `⏸ Pending` or `⏭ Skip` |
| `{{test_status}}` | Progress status for test steps | `⏸ Pending` or `⏭ Skip` |
| `{{pr_status}}` | Progress status for PR step | `⏸ Pending` or `⏭ Skip` |

## Setup Script

### `setup-templates.sh`

Initializes all template files in the output directory with variables replaced.

**Usage:**
```bash
bash scripts/setup-templates.sh \
  "task_id" \
  "task_description" \
  "auto_mode" \
  "examine_mode" \
  "save_mode" \
  "test_mode" \
  "economy_mode" \
  "branch_mode" \
  "pr_mode" \
  "interactive_mode" \
  "branch_name" \
  "original_input"
```

**Output:**
```
.claude/output/apex/01-add-auth-middleware/
├── 00-context.md      # Always created
├── 01-analyze.md      # Always created
├── 02-plan.md         # Always created
├── 03-execute.md      # Always created
├── 04-validate.md     # Always created
├── 05-examine.md      # Only if examine_mode
├── 06-resolve.md      # Only if examine_mode
├── 07-tests.md        # Only if test_mode
├── 08-run-tests.md    # Only if test_mode
└── 09-finish.md       # Only if pr_mode
```

## Progress Update Script

### `update-progress.sh`

Updates the progress table in `00-context.md` without manual markdown editing.

**Usage:**
```bash
bash scripts/update-progress.sh <task_id> <step_number> <step_name> <status>
```

**Examples:**
```bash
# Mark step 01 as in progress
bash scripts/update-progress.sh "01-add-auth" "01" "analyze" "in_progress"

# Mark step 01 as complete
bash scripts/update-progress.sh "01-add-auth" "01" "analyze" "complete"

# Mark step 02 as in progress
bash scripts/update-progress.sh "01-add-auth" "02" "plan" "in_progress"
```

**Status Values:**
- `in_progress` → `⏳ In Progress`
- `complete` → `✓ Complete`

## Token Savings

### Before Optimization

Each step file contained full template content inline:

```markdown
### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

Create `{output_dir}/01-analyze.md`:
```markdown
# Step 01: Analyze

**Task:** {task_description}
**Started:** {ISO timestamp}

---

## Context Discovery
```

Update `00-context.md` progress:
```markdown
| 01-analyze | ⏳ In Progress | {timestamp} |
```
```

**Token cost per step:** ~200 tokens × 9 steps = ~1,800 tokens

### After Optimization

Step files now reference templates and scripts:

```markdown
### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

The file `{output_dir}/01-analyze.md` has already been created by the setup script.

Update progress:
```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "01" "analyze" "in_progress"
```

Append your findings to `01-analyze.md` as you work.
```

**Token cost per step:** ~50 tokens × 9 steps = ~450 tokens

**Total savings:** ~1,350 tokens per workflow execution (75% reduction)

## How It Works

1. **Initialization (step-00-init.md):**
   - Runs `setup-templates.sh` once at workflow start
   - Creates all template files with variables replaced
   - Output directory is ready with pre-initialized files

2. **Each Step:**
   - Runs `update-progress.sh` to mark step as "in_progress"
   - Appends findings/logs to the pre-created step file
   - Runs `update-progress.sh` again to mark step as "complete"

3. **Benefits:**
   - AI doesn't need to hold template content in context
   - Consistent formatting across all workflows
   - Easy to update templates without editing step files
   - Scripts handle the tedious markdown updates

## Updating Templates

To modify template content:

1. Edit the template file in `templates/`
2. Changes apply to all future workflows automatically
3. No need to update step files

## Maintenance

- Templates are stateless (no workflow-specific logic)
- Scripts are idempotent (safe to run multiple times)
- Variables use `{{var}}` syntax to avoid conflicts with markdown
