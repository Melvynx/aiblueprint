---
name: step-00b-branch
description: Verify and setup git branch for APEX workflow
returns_to: step-00-init.md
---

# Step 0b: Branch Setup

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER commit directly to main/master when branch_mode enabled
- 🛑 NEVER skip branch verification
- ✅ ALWAYS check current branch first
- ✅ ALWAYS store {branch_name} before returning
- 📋 YOU ARE A BRANCH MANAGER, not an implementer
- 💬 FOCUS on branch setup only
- 🚫 FORBIDDEN to start any implementation work

## CONTEXT BOUNDARIES:

- Variables available: `{task_id}`, `{auto_mode}`, `{pr_mode}`
- This sub-step sets: `{branch_name}`
- Return to step-00-init.md after completion

## YOUR TASK:

Verify the current git branch and create a feature branch if on main/master.

---

## EXECUTION SEQUENCE:

### 1. Check Current Branch

```bash
git branch --show-current
```

Store result as `{current_branch}`

### 2. Evaluate Branch Status

**If `{current_branch}` is `main` or `master`:**
→ Go to step 3 (Create Branch)

**If `{current_branch}` is NOT main/master:**
→ Store `{branch_name}` = `{current_branch}`
→ Display: "✓ Already on branch: {branch_name}"
→ Return to step-00-init.md

### 3. Create Feature Branch

**If `{auto_mode}` = true:**
→ Auto-create branch: `feat/{task_id}`

**If `{auto_mode}` = false:**
Use AskUserQuestion:
```yaml
questions:
  - header: "Branch"
    question: "You're on {current_branch}. Create a new branch for this task?"
    options:
      - label: "Create feat/{task_id} (Recommended)"
        description: "Create new feature branch and switch to it"
      - label: "Custom branch name"
        description: "I'll specify a custom branch name"
      - label: "Stay on {current_branch}"
        description: "Continue without creating a branch (not recommended for PRs)"
    multiSelect: false
```

### 4. Execute Branch Creation

**If user chose "Create feat/{task_id}" or auto_mode:**
```bash
git checkout -b feat/{task_id}
```
→ `{branch_name}` = `feat/{task_id}`

**If user chose "Custom branch name":**
→ Ask for branch name
```bash
git checkout -b {custom_name}
```
→ `{branch_name}` = `{custom_name}`

**If user chose "Stay on {current_branch}":**
→ `{branch_name}` = `{current_branch}`
→ Display warning if `{pr_mode}` = true:
  "⚠️ Warning: Creating PR from {current_branch} directly"

### 5. Confirm and Return

Display:
```
✓ Branch: {branch_name}
{if new branch created: "Created and switched to new branch"}
```

→ Return to step-00-init.md with `{branch_name}` set

---

## SUCCESS METRICS:

✅ Current branch verified
✅ Feature branch created if on main/master (unless user declined)
✅ `{branch_name}` variable set
✅ User warned if staying on main with PR mode

## FAILURE MODES:

❌ Starting implementation before returning
❌ Not setting `{branch_name}` variable
❌ Creating branch without user consent (when not auto_mode)
❌ **CRITICAL**: Using plain text prompts instead of AskUserQuestion

---

## RETURN:

After branch setup complete, return to `./step-00-init.md` to continue initialization.

<critical>
Remember: This sub-step ONLY handles branch setup. Return immediately after setting {branch_name}.
</critical>
