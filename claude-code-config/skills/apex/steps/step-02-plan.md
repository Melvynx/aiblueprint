---
name: step-02-plan
description: Strategic planning - create detailed file-by-file implementation strategy
prev_step: steps/step-01-analyze.md
next_step: steps/step-03-execute.md
---

# Step 2: Plan (Strategic Design)

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER start implementing - that's step 3
- 🛑 NEVER write or modify code in this step
- 🛑 NEVER mark plan as "complete" BEFORE writing plan to `{output_dir}/02-plan.md` (if save_mode)
- ✅ ALWAYS structure plan by FILE, not by feature
- ✅ ALWAYS include specific line numbers from analysis
- ✅ ALWAYS map acceptance criteria to file changes
- ✅ ALWAYS create a TaskList using TaskCreate tool to track all planned file changes
- ✅ IF save_mode: ALWAYS use Edit tool to write the full plan to `{output_dir}/02-plan.md` BEFORE showing summary
- 📋 YOU ARE A PLANNER, not an implementer
- 💬 FOCUS on "What changes need to be made where?"
- 🚫 FORBIDDEN to use Edit/Write on source code files (only on output files if save_mode)

## EXECUTION PROTOCOLS:

- 🎯 ULTRA THINK before creating the plan
- 💾 IF save_mode: Use Edit tool to write the full plan to `{output_dir}/02-plan.md` AFTER creating the plan and BEFORE presenting summary
- 📖 Reference patterns from step-01 analysis
- 🚫 FORBIDDEN to proceed until user approves plan (unless auto_mode)
- 🚫 FORBIDDEN to proceed to step-03 without saving plan first (if save_mode)

## CONTEXT BOUNDARIES:

- Context from step-01 (files, patterns, utilities) is available
- Implementation has NOT started
- User has NOT approved any changes yet
- Plan must be complete before execution

## YOUR TASK:

Transform analysis findings into a comprehensive, executable, file-by-file implementation plan.

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
| `{output_dir}` | Path to output (if save_mode) |
| Files found | From step-01 codebase exploration |
| Patterns | From step-01 pattern analysis |
| Utilities | From step-01 utility discovery |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "02" "plan" "in_progress"
```

Append plan to `{output_dir}/02-plan.md` as you work.

### 2. ULTRA THINK: Design Complete Strategy

**CRITICAL: Think through ENTIRE implementation before writing any plan.**

Mental simulation:
- Walk through the implementation step by step
- Identify all files that need changes
- Determine logical order (dependencies first)
- Consider edge cases and error handling
- Plan test coverage

### 3. Clarify Ambiguities

**If `{auto_mode}` = true:**
→ Use recommended option for any ambiguity, proceed automatically

**If `{auto_mode}` = false AND multiple valid approaches exist:**

```yaml
questions:
  - header: "Approach"
    question: "Multiple approaches are possible. Which should we use?"
    options:
      - label: "Approach A (Recommended)"
        description: "Description and tradeoffs of A"
      - label: "Approach B"
        description: "Description and tradeoffs of B"
      - label: "Approach C"
        description: "Description and tradeoffs of C"
    multiSelect: false
```

### 4. Create Detailed Plan

**Structure by FILE, not by feature:**

```markdown
## Implementation Plan: {task_description}

### Overview
[1-2 sentences: High-level strategy and approach]

### Prerequisites
- [ ] Prerequisite 1 (if any)
- [ ] Prerequisite 2 (if any)

---

### File Changes

#### `src/path/file1.ts`
- Add `functionName` that handles X
- Extract logic from Y (follow pattern in `example.ts:45`)
- Handle error case: [specific scenario]
- Consider: [edge case or important context]

#### `src/path/file2.ts`
- Update imports to include new module
- Call `functionName` in existing flow at line ~42
- Update types: Add `NewType` interface

#### `src/path/file3.ts` (NEW FILE)
- Create utility for Z
- Export: `utilityFunction`, `HelperType`
- Pattern: Follow `similar-util.ts` structure

---

### Testing Strategy

**New tests:**
- `src/path/file1.test.ts` - Test functionName with:
  - Happy path
  - Error case
  - Edge case

**Update existing:**
- `src/path/existing.test.ts` - Add test for new flow

---

### Acceptance Criteria Mapping
- [ ] AC1: Satisfied by changes in `file1.ts`
- [ ] AC2: Satisfied by changes in `file2.ts`

---

### Risks & Considerations
- Risk 1: [potential issue and mitigation]
```

**IF `{save_mode}` = true (MANDATORY - DO THIS NOW):**

<critical>
Use the **Edit tool** to write the FULL plan to `{output_dir}/02-plan.md`. Replace the placeholder content with the complete plan including all file changes, testing strategy, acceptance criteria mapping, and risks.
</critical>

### 5. Create Team (if teams_mode - BEFORE TaskList)

<critical>
If `{teams_mode}` = true, you MUST create the team BEFORE creating any tasks.
TeamCreate resets the task list — so the team must exist first, then tasks are added to it.
Do NOT spawn any agents yet — that happens in step-03-execute-teams.
</critical>

**If `{teams_mode}` = true:**

```
TeamCreate:
  team_name: "apex-{feature_name}"
  description: "APEX: {task_description}"
```

→ This creates the team and its empty task list.
→ All subsequent TaskCreate calls will use this team's task list.
→ Agents are spawned later in step-03-execute-teams.

### 6. Create Task List (MANDATORY)

<critical>
You MUST create a TaskList using TaskCreate for every planned change.
This is NOT optional - the task list tracks progress through execution.
If teams_mode is enabled, the team was already created in step 5 — tasks go into the team's task list.
</critical>

**Create one task per file change from the plan:**

For each file in the plan, call `TaskCreate` with:
- **subject**: `{action} {filepath}` (e.g., "Add validateToken to src/auth/handler.ts")
- **description**: The full details of what changes are needed for this file, including specific functions, patterns to follow, and line references
- **activeForm**: Present continuous form (e.g., "Adding validateToken to handler.ts")

**Then set up dependencies using `TaskUpdate`:**
- If file B depends on file A (e.g., B imports from A), use `addBlockedBy` to mark the dependency
- This ensures execution follows the correct order

**Example:**
```
TaskCreate: "Create auth types in src/types/auth.ts"
  → description: "Create AuthToken interface, ValidateResult type. Follow pattern from src/types/user.ts"
  → activeForm: "Creating auth types"

TaskCreate: "Add validateToken to src/auth/handler.ts"
  → description: "Add validateToken function that returns ValidateResult. Handle expired token error case."
  → activeForm: "Adding validateToken to handler"
  → Then: TaskUpdate with addBlockedBy: [auth-types-task-id]
```

### 7. Verify Plan Completeness

Checklist:
- [ ] All files identified - nothing missing
- [ ] Logical order - dependencies handled first
- [ ] Clear actions - every step specific and actionable
- [ ] Test coverage - all paths have test strategy
- [ ] In scope - no scope creep
- [ ] AC mapped - every criterion has implementation
- [ ] **TaskList created with all file changes**
- [ ] **Task dependencies set correctly**

### 8. Brainstorm Uncertainty Points

<critical>
Before proceeding, THINK about what you're NOT 100% certain about.
DO NOT ask generic "is this plan good?" questions.
Instead, identify SPECIFIC uncertainties and ask TARGETED questions.
</critical>

**ULTRA THINK: Identify Uncertainties**

For each aspect of the plan, rate your confidence (High/Medium/Low):

```markdown
## Uncertainty Analysis

| Aspect | Confidence | Uncertainty |
|--------|------------|-------------|
| File locations correct? | High/Medium/Low | [What's unclear] |
| Patterns match codebase? | High/Medium/Low | [What's unclear] |
| Dependencies complete? | High/Medium/Low | [What's unclear] |
| Error handling approach? | High/Medium/Low | [What's unclear] |
| User expectations for X? | High/Medium/Low | [What's unclear] |
| Technical approach for Y? | High/Medium/Low | [What's unclear] |
```

**Identify TOP 1-4 uncertainties with Low or Medium confidence.**

These are the ONLY things worth asking about.

---

### 9. Ask Smart Questions (if not auto_mode)

**If `{auto_mode}` = true:**
→ Skip questions, use your best judgment, proceed directly

**If `{auto_mode}` = false AND you have uncertainties:**

<critical>
ONLY ask questions about things where:
1. Multiple valid approaches exist AND the choice significantly impacts implementation
2. User intent is genuinely ambiguous from the task description
3. A wrong assumption could cause significant rework

DO NOT ask about:
- Implementation details you can decide yourself
- Things you're "slightly unsure" about (just decide)
- Generic plan approval (never ask "is this plan good?")
</critical>

**Question Types to Use:**

**Type 1: Behavior Clarification**
When user intent is genuinely unclear:
```yaml
questions:
  - header: "Behavior"
    question: "When [specific scenario], should the system [option A] or [option B]?"
    options:
      - label: "[Option A] (Recommended)"
        description: "[What A does and why it might be preferred]"
      - label: "[Option B]"
        description: "[What B does and when it's better]"
    multiSelect: false
```

**Type 2: Scope Clarification**
When scope boundaries are unclear:
```yaml
questions:
  - header: "Scope"
    question: "Should we also [related thing] as part of this, or keep it focused on [core thing]?"
    options:
      - label: "Keep focused (Recommended)"
        description: "Only do [core thing], faster implementation"
      - label: "Include [related thing]"
        description: "More complete but expands scope"
    multiSelect: false
```

**Type 3: Technical Choice**
When multiple valid technical approaches exist:
```yaml
questions:
  - header: "Approach"
    question: "For [specific technical decision], we can use [approach A] or [approach B]. Which fits your needs?"
    options:
      - label: "[Approach A] (Recommended)"
        description: "[Tradeoffs of A - e.g., simpler but less flexible]"
      - label: "[Approach B]"
        description: "[Tradeoffs of B - e.g., more complex but extensible]"
    multiSelect: false
```

**Type 4: Edge Case Handling**
When edge case behavior is unclear:
```yaml
questions:
  - header: "Edge case"
    question: "If [edge case scenario] occurs, should we [behavior A] or [behavior B]?"
    options:
      - label: "[Behavior A] (Recommended)"
        description: "[What happens with A]"
      - label: "[Behavior B]"
        description: "[What happens with B]"
    multiSelect: false
```

**If you have 0 uncertainties worth asking about:**
→ Proceed directly to execution without asking anything

**Example of GOOD questions:**
- "When a user submits invalid email format, should we show inline validation or only validate on submit?"
- "Should the loading state show a spinner on the button or a full-page skeleton?"
- "For rate limiting, should we limit per user or per IP address?"

**Example of BAD questions (NEVER ask these):**
- ❌ "Does this plan look good to you?"
- ❌ "Ready to proceed with implementation?"
- ❌ "Should I use async/await or promises?" (just decide)
- ❌ "Is the file structure correct?" (you already verified)

---

### 10. Present Plan Summary & Approve

**Always show the full plan summary (both auto and non-auto):**

```
**Implementation Plan Ready: {task_description}**

**Overview:** [1 sentence summary]

**Files to modify:** {count} files
**New files:** {count} files
**Tests:** {count} test files

**Key decisions made:**
- [Decision 1 from user responses or auto-decided]
- [Decision 2 from user responses or auto-decided]

**Estimated changes:**
- `file1.ts` - Major changes (add function, handle errors)
- `file2.ts` - Minor changes (imports, single call)
- `file1.test.ts` - New test file

**Acceptance Criteria Coverage:**
- [ ] AC1: Satisfied by changes in `file1.ts`
- [ ] AC2: Satisfied by changes in `file2.ts`

**Risks & Considerations:**
- [Risk 1 and mitigation]
```

---

**If `{auto_mode}` = true:**
→ Show the full summary above, then proceed directly to next step

**If `{auto_mode}` = false:**

<critical>
Use EnterPlanMode / ExitPlanMode for plan approval — NOT AskUserQuestion.
This gives the user proper plan review UI and supports "Execute and clear context".
</critical>

**Step 10a: Call `EnterPlanMode`**

This transitions into plan mode so the user can review and approve.

**Step 10b: Write the plan to the plan file**

The system will provide a plan file path. Write the FULL plan to it, including APEX state for context survival.

<critical>
The plan file must contain ALL details from step 4 — do NOT strip sections.
Include everything: Overview, Prerequisites, File Changes, Testing Strategy, Acceptance Criteria Mapping, Risks & Considerations, Key Decisions.
</critical>

```markdown
# APEX Implementation Plan: {task_description}

## APEX Workflow Context

> **IMPORTANT:** This is an APEX workflow plan. If you are reading this after
> "Execute and clear context", continue the APEX workflow by loading the next
> step file listed below.

### State Variables
| Variable | Value |
|----------|-------|
| task_description | {task_description} |
| task_id | {task_id} |
| feature_name | {feature_name} |
| auto_mode | {auto_mode} |
| examine_mode | {examine_mode} |
| save_mode | {save_mode} |
| test_mode | {test_mode} |
| economy_mode | {economy_mode} |
| branch_mode | {branch_mode} |
| pr_mode | {pr_mode} |
| tasks_mode | {tasks_mode} |
| teams_mode | {teams_mode} |
| output_dir | {output_dir} |
| branch_name | {branch_name} |

### Next Step After Approval
{if tasks_mode or teams_mode:}
  Load `skills/workflow-apex/steps/step-02b-tasks.md`
{else:}
  Load `skills/workflow-apex/steps/step-03-execute.md`

---

## Plan Overview
[1-2 sentence high-level strategy and approach]

## Prerequisites
- [ ] Prerequisite 1 (if any)
- [ ] Prerequisite 2 (if any)

## File Changes

[Full file-by-file plan from step 4 — every file with specific actions, line references, patterns to follow, edge cases]

## Testing Strategy

**New tests:**
- [test files to create with coverage details]

**Update existing:**
- [existing test files to modify]

## Acceptance Criteria Mapping
- [ ] AC1: Satisfied by changes in `file1.ts`
- [ ] AC2: Satisfied by changes in `file2.ts`

## Key Decisions
- [Decision 1 from user responses or auto-decided]
- [Decision 2 from user responses or auto-decided]

## Risks & Considerations
- [Risk 1: potential issue and mitigation]
- [Risk 2: potential issue and mitigation]
```

**Step 10c: Call `ExitPlanMode`**

Include appropriate allowedPrompts for execution:

```yaml
allowedPrompts:
  - tool: Bash
    prompt: "run build, typecheck, lint, test, and format commands"
  - tool: Bash
    prompt: "run git operations for branch management and commits"
  - tool: Bash
    prompt: "run APEX workflow scripts for progress tracking"
```

**Step 10d: Handle "Execute and clear context"**

If the user chooses "Execute and clear context":
- Context is cleared but the plan file survives
- The agent re-reads the plan file on the next turn
- The APEX Workflow Context section in the plan file tells the agent:
  1. This is an APEX workflow — restore all state variables from the table
  2. Load the next step file indicated in "Next Step After Approval"
  3. Continue the workflow as normal

<critical>
The plan file MUST contain ALL state variables, the next step path, AND the full detailed plan.
Without this, "Execute and clear context" breaks the APEX workflow.
Never strip sections from the plan file — it must be the complete implementation reference.
</critical>

### 11. Complete Save Output (if save_mode)

**If `{save_mode}` = true:**

Append to `{output_dir}/02-plan.md`:
```markdown
---
## Step Complete
**Status:** ✓ Complete
**Files planned:** {count}
**Tests planned:** {count}
**Uncertainties resolved:** {count}
**Next:** step-03-execute.md
**Timestamp:** {ISO timestamp}
```

---

## SUCCESS METRICS:

✅ Complete file-by-file plan created
✅ Logical dependency order established
✅ All acceptance criteria mapped to changes
✅ Test strategy defined
✅ **Team created with TeamCreate BEFORE TaskList (if teams_mode)**
✅ **TaskList created with TaskCreate for every file change**
✅ **Task dependencies set with TaskUpdate (addBlockedBy)**
✅ Uncertainty points identified and addressed
✅ Smart, targeted questions asked (if not auto_mode and uncertainties exist)
✅ **Plan approved via EnterPlanMode/ExitPlanMode (if not auto_mode)**
✅ **Plan file contains APEX state variables for "Execute and clear context" survival**
✅ NO code written or modified
✅ Output saved (if save_mode)

## FAILURE MODES:

❌ **CRITICAL**: Skipping file save when save_mode is true (proceeding without writing to 02-plan.md)
❌ Organizing by feature instead of file
❌ Vague actions like "add feature" or "fix issue"
❌ Missing test strategy
❌ Not mapping to acceptance criteria
❌ Starting to write code (that's step 3!)
❌ **CRITICAL**: Not creating a TaskList with TaskCreate
❌ **CRITICAL**: Asking generic "is this plan good?" questions
❌ **CRITICAL**: Asking about implementation details you can decide yourself
❌ **CRITICAL**: Not brainstorming uncertainties before asking questions
❌ **CRITICAL**: Using AskUserQuestion for plan approval instead of EnterPlanMode/ExitPlanMode (when auto_mode=false)
❌ **CRITICAL**: Plan file missing APEX state variables (breaks "Execute and clear context")

## PLANNING PROTOCOLS:

- Structure by FILE - each file is a section
- Include line number references from analysis
- Every action must be specific and actionable
- Map every AC to specific file changes
- Plan tests alongside implementation

---

## NEXT STEP:

**If `{auto_mode}` = true:** Proceed directly after plan summary.
**If `{auto_mode}` = false:** Proceed after user approves via ExitPlanMode.

**If "Execute and clear context" was chosen:**
→ The agent re-reads the plan file, restores APEX state variables from the table, and loads the next step indicated in the plan file.

**Routing:**

**If `{tasks_mode}` = true OR `{teams_mode}` = true:**
→ Load `./step-02b-tasks.md` to generate task breakdown with dependencies

**If `{teams_mode}` = true (after task breakdown):**
→ Flow continues to `./step-03-execute-teams.md` for Agent Team parallel execution

**Otherwise:**
→ Load `./step-03-execute.md` to start implementation

<critical>
Remember: Planning is ONLY about designing the approach - save all implementation for step-03!
When auto_mode=false, ALWAYS use EnterPlanMode/ExitPlanMode for approval — never AskUserQuestion.
The plan file MUST contain APEX state variables so "Execute and clear context" works.
</critical>
