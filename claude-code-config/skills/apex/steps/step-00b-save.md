---
name: step-00b-save
description: Setup save output structure for APEX workflow
returns_to: step-00-init.md
---

# Step 0b: Save Mode Setup

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER start analysis or implementation
- ✅ ALWAYS run the setup script to create output structure
- ✅ ALWAYS capture the generated `{task_id}` from the script output
- 📋 YOU ARE A SETUP MANAGER, not an implementer
- 🚫 FORBIDDEN to start any analysis work

## CONTEXT BOUNDARIES:

- Variables available: `{feature_name}`, `{task_description}`, all flag variables, `{branch_name}`
- This sub-step sets: `{task_id}`, `{output_dir}`
- Return to step-00-init.md after completion

## YOUR TASK:

Create the output directory structure and initialize all output files for the APEX workflow.

---

## OUTPUT STRUCTURE:

When save_mode is enabled, all outputs go to the PROJECT directory:

```
.claude/output/apex/{task-id}/
├── 00-context.md        # Params, user request, timestamp
├── 01-analyze.md        # Analysis findings
├── 02-plan.md           # Implementation plan
├── 03-execute.md        # Execution log
├── 04-validate.md       # Validation results
├── 02b-tasks/           # Task breakdown (if -k or -m)
│   ├── README.md
│   └── task-NN-*.md
├── 05-examine.md        # Review findings (if -x)
├── 06-resolve.md        # Resolution log (if -x)
├── 07-tests.md          # Test analysis (if -t)
├── 08-run-tests.md      # Test runner log (if -t)
└── 09-finish.md         # PR creation (if -pr)
```

## EXECUTION SEQUENCE:

### 1. Run Template Setup Script

```bash
bash {skill_dir}/scripts/setup-templates.sh \
  "{feature_name}" \
  "{task_description}" \
  "{auto_mode}" \
  "{examine_mode}" \
  "{save_mode}" \
  "{test_mode}" \
  "{economy_mode}" \
  "{branch_mode}" \
  "{pr_mode}" \
  "{interactive_mode}" \
  "{tasks_mode}" \
  "{branch_name}" \
  "{original_input}"
```

**Note:** Pass `{feature_name}` (without number prefix), NOT `{task_id}`.

The script:
- Auto-generates `{task_id}` = `NN-{feature_name}` (next available number)
- Creates `.claude/output/apex/{task_id}/` directory
- Initializes `00-context.md` with configuration and progress table
- Pre-creates all step files from templates
- Only creates files for enabled steps (examine, tests, PR)
- Outputs the generated `{task_id}`

### 2. Capture Output Variables

From the script output, set:
- `{task_id}` = the generated ID (e.g., `01-add-auth-middleware`)
- `{output_dir}` = `.claude/output/apex/{task_id}`

### 3. Return

→ Return to step-00-init.md with `{task_id}` and `{output_dir}` set

---

## SAVE OUTPUT PATTERN (for all subsequent steps):

Each step uses this pattern:

1. `bash {skill_dir}/scripts/update-progress.sh "{task_id}" "{step_num}" "{step_name}" "in_progress"`
2. Append findings/outputs to the pre-created step file
3. `bash {skill_dir}/scripts/update-progress.sh "{task_id}" "{step_num}" "{step_name}" "complete"`

---

## SUCCESS METRICS:

✅ Output directory created
✅ `{task_id}` generated and captured
✅ `{output_dir}` set
✅ All template files initialized

## FAILURE MODES:

❌ Not capturing `{task_id}` from script output
❌ Starting analysis before returning

---

## RETURN:

After setup complete, return to `./step-00-init.md` to continue initialization.

<critical>
Remember: This sub-step ONLY creates the output structure. Return immediately after setting {task_id} and {output_dir}.
</critical>
