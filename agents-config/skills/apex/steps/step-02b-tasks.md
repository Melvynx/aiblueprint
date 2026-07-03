---
name: step-02b-tasks
description: Generate task breakdown with dependencies from the implementation plan
prev_step: steps/step-02-plan.md
next_step: steps/step-03-execute.md
---

# Step 2b: Task Breakdown

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER start implementing - that's step 3
- 🛑 NEVER write or modify code in this step
- ✅ ALWAYS create individual task files with clear structure
- ✅ ALWAYS include dependencies between tasks
- ✅ ALWAYS create a README.md explaining the task graph
- 📋 YOU ARE A TASK ARCHITECT, not an implementer
- 💬 FOCUS on breaking down the plan into executable tasks
- 🚫 FORBIDDEN to use Edit, Write (except for task files), or Bash tools

## EXECUTION PROTOCOLS:

- 🎯 Analyze the plan from step-02 before creating tasks
- 💾 Create `tasks/` folder inside output directory (if save_mode)
- 📖 Reference the implementation plan structure
- 🚫 FORBIDDEN to proceed until all tasks are created

## CONTEXT BOUNDARIES:

- Context from step-01 (analysis) and step-02 (plan) is available
- Implementation has NOT started
- Tasks should map directly to plan sections
- Each task is self-contained with all context needed

## YOUR TASK:

Transform the implementation plan into individual task files with clear dependencies, enabling parallel execution where possible.

---

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{task_description}` | What to implement |
| `{task_id}` | Kebab-case identifier |
| `{acceptance_criteria}` | Success criteria from step-01 |
| `{auto_mode}` | Skip confirmations |
| `{save_mode}` | Save outputs to files |
| `{tasks_mode}` | Generate task breakdown (should be true) |
| `{output_dir}` | Path to output (if save_mode) |
| Plan | Full implementation plan from step-02 |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Create Tasks Directory

**If `{save_mode}` = true:**

```bash
mkdir -p {output_dir}/tasks
```

### 2. Analyze Plan and Identify Tasks

From the implementation plan, identify:

- **Independent tasks** - Can run in parallel (no dependencies)
- **Sequential tasks** - Must wait for other tasks to complete
- **File-grouped tasks** - Changes to same file that could be combined

**Task sizing guidelines:**

- Each task should be completable in one focused session
- Tasks should modify 1-3 files maximum
- Complex file changes can be split into multiple tasks

### 3. Create Individual Task Files

For each task, create a file: `{output_dir}/tasks/task-NN-{name}.md`

**Task file structure:**

```markdown
---
id: task-NN
name: {short-descriptive-name}
status: pending
priority: {high|medium|low}
depends_on: [task-XX, task-YY]  # Empty array if no dependencies
blocks: [task-ZZ]  # Tasks waiting for this one
estimated_files:
  - path/to/file1.ts
  - path/to/file2.ts
---

# Task NN: {Descriptive Title}

## Objective

{One sentence describing what this task accomplishes}

## Context

{2-3 sentences providing background needed to complete the task}

## Plan

{Specific implementation steps, referencing line numbers and patterns}

1. Step one
2. Step two
3. Step three

## Files to Modify

| File | Action | Changes |
|------|--------|---------|
| `path/to/file.ts` | Modify | Add function X, update Y |

## Acceptance Criteria

- [ ] AC1: {Specific testable criterion}
- [ ] AC2: {Specific testable criterion}

## Dependencies

**Depends on:**
- `task-XX`: {Why this dependency exists}

**Blocks:**
- `task-ZZ`: {Why this blocks other tasks}

## Notes

{Any additional context, gotchas, or considerations}
```

### 4. Build Dependency Graph

Analyze task relationships:

```
task-01 ──┬──► task-02 ──► task-04
          │
          └──► task-03 ──► task-05
                     ▲
                     │
task-06 ─────────────┘
```

Identify:
- **Critical path** - Longest chain of dependencies
- **Parallel groups** - Tasks that can run simultaneously
- **Bottlenecks** - Tasks blocking many others

### 5. Create README.md

Create `{output_dir}/tasks/README.md`:

```markdown
# Task Breakdown: {task_description}

**Generated:** {timestamp}
**Total Tasks:** {count}
**Parallel Groups:** {count}

## Overview

{1-2 sentences summarizing the task breakdown}

## Dependency Graph

```
[Visual representation of task dependencies]
```

## Task Summary

| ID | Name | Status | Depends On | Priority |
|----|------|--------|------------|----------|
| 01 | {name} | pending | - | high |
| 02 | {name} | pending | 01 | medium |

## Parallel Execution Groups

**Group 1 (Start immediately):**
- task-01: {name}
- task-06: {name}

**Group 2 (After Group 1):**
- task-02: {name} (after task-01)
- task-03: {name} (after task-01, task-06)

**Group 3 (After Group 2):**
- task-04: {name} (after task-02)
- task-05: {name} (after task-03)

## Critical Path

task-01 → task-02 → task-04

## Notes

{Any additional context about the task breakdown}
```

### 6. Validate Task Breakdown

Checklist:
- [ ] All plan sections have corresponding tasks
- [ ] No circular dependencies
- [ ] Each task has clear acceptance criteria
- [ ] Dependencies are logical and minimal
- [ ] Parallel opportunities maximized
- [ ] README accurately describes the graph

### 7. Present Summary

```
**Task Breakdown Complete**

**Total tasks:** {count}
**Independent (can start now):** {count}
**Sequential chains:** {count}

**Files created:**
- tasks/README.md
- tasks/task-01-{name}.md
- tasks/task-02-{name}.md
- ...
```

**If `{auto_mode}` = true:**
→ Skip confirmation, proceed to execution

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Tasks"
    question: "Task breakdown complete. Ready to proceed to implementation?"
    options:
      - label: "Continue to execution (Recommended)"
        description: "Start implementing tasks in order"
      - label: "Review tasks first"
        description: "I want to examine the task files"
      - label: "Adjust breakdown"
        description: "Modify the task structure"
    multiSelect: false
```

---

## SUCCESS METRICS:

✅ Tasks directory created with all task files
✅ Each task has clear dependencies documented
✅ README.md provides complete overview
✅ Dependency graph has no cycles
✅ Parallel groups identified
✅ Critical path documented
✅ NO code written or modified

## FAILURE MODES:

❌ Creating tasks without clear dependencies
❌ Missing README.md
❌ Circular dependencies in graph
❌ Tasks too large or too granular
❌ Starting to write code (that's step 3!)
❌ **CRITICAL**: Not using AskUserQuestion for confirmation

## TASK BREAKDOWN PROTOCOLS:

- Each task must be self-contained with all needed context
- Dependencies should be minimal and justified
- Maximize parallel execution opportunities
- Task files follow consistent structure
- README provides birds-eye view

---

## NEXT STEP:

After user confirms via AskUserQuestion (or auto-proceed):

**If `{teams_mode}` = true:**
→ Load `./step-03-execute-teams.md` for Agent Team parallel execution

**Otherwise:**
→ Load `./step-03-execute.md` to start implementation

<critical>
Remember: This step ONLY creates task documentation - save all implementation for step-03!
The tasks folder gives a clear roadmap of what to implement and in what order.
</critical>
