---
name: step-00b-interactive
description: Interactively configure APEX workflow flags
returns_to: step-00-init.md
---

# Step 0b: Interactive Configuration

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER skip the interactive menu
- 🛑 NEVER assume user preferences
- ✅ ALWAYS use AskUserQuestion for flag selection
- ✅ ALWAYS update all flag variables before returning
- 📋 YOU ARE A CONFIGURATOR, not an implementer
- 💬 FOCUS on flag configuration only
- 🚫 FORBIDDEN to start any workflow steps

## CONTEXT BOUNDARIES:

- Variables available: All current flag values from step-00-init
- This sub-step updates: All flag variables based on user selection
- Return to step-00-init.md after completion

## YOUR TASK:

Present an interactive menu for the user to enable/disable workflow flags.

---

## EXECUTION SEQUENCE:

### 1. Display Current Configuration

Show current flag values:
```
**Current APEX Configuration:**

| Flag | Status | Description |
|------|--------|-------------|
| Auto (`-a`) | {auto_mode ? "✓ ON" : "✗ OFF"} | Skip confirmations |
| Examine (`-x`) | {examine_mode ? "✓ ON" : "✗ OFF"} | Adversarial review |
| Save (`-s`) | {save_mode ? "✓ ON" : "✗ OFF"} | Save outputs to files |
| Test (`-t`) | {test_mode ? "✓ ON" : "✗ OFF"} | Include test steps |
| Verify (`-v`) | {verify_mode ? "✓ ON" : "✗ OFF"} | Launch & verify feature |
| Economy (`-e`) | {economy_mode ? "✓ ON" : "✗ OFF"} | No subagents |
| Branch (`-b`) | {branch_mode ? "✓ ON" : "✗ OFF"} | Verify/create branch |
| PR (`-pr`) | {pr_mode ? "✓ ON" : "✗ OFF"} | Create pull request |
| Teams (`-m`) | {teams_mode ? "✓ ON" : "✗ OFF"} | Agent Teams parallel execution |
```

### 2. Ask for Flag Changes

Use AskUserQuestion with multiSelect:
```yaml
questions:
  - header: "Configure"
    question: "Select flags to TOGGLE (currently shown flags will flip their state):"
    options:
      - label: "Auto mode"
        description: "{auto_mode ? 'Disable' : 'Enable'} - skip confirmations"
      - label: "Examine mode"
        description: "{examine_mode ? 'Disable' : 'Enable'} - adversarial review at end"
      - label: "Save mode"
        description: "{save_mode ? 'Disable' : 'Enable'} - save outputs to .claude/output/"
      - label: "Test mode"
        description: "{test_mode ? 'Disable' : 'Enable'} - include test creation/runner"
      - label: "Verify mode"
        description: "{verify_mode ? 'Disable' : 'Enable'} - launch app and verify feature works"
    multiSelect: true
```

### 3. Ask for Additional Flags

Use AskUserQuestion with multiSelect:
```yaml
questions:
  - header: "More"
    question: "Select additional flags to TOGGLE:"
    options:
      - label: "Economy mode"
        description: "{economy_mode ? 'Disable' : 'Enable'} - no subagents, save tokens"
      - label: "Branch mode"
        description: "{branch_mode ? 'Disable' : 'Enable'} - verify/create git branch"
      - label: "PR mode"
        description: "{pr_mode ? 'Disable' : 'Enable'} - create pull request at end"
      - label: "Teams mode"
        description: "{teams_mode ? 'Disable' : 'Enable'} - Agent Teams parallel execution"
      - label: "Done - keep current"
        description: "No more changes, proceed with workflow"
    multiSelect: true
```

### 4. Apply Changes

For each selected flag, toggle its value:
```
IF "Auto mode" selected → {auto_mode} = !{auto_mode}
IF "Examine mode" selected → {examine_mode} = !{examine_mode}
IF "Save mode" selected → {save_mode} = !{save_mode}
IF "Test mode" selected → {test_mode} = !{test_mode}
IF "Verify mode" selected → {verify_mode} = !{verify_mode}
IF "Economy mode" selected → {economy_mode} = !{economy_mode}
IF "Branch mode" selected → {branch_mode} = !{branch_mode}
IF "PR mode" selected → {pr_mode} = !{pr_mode}
IF "Teams mode" selected → {teams_mode} = !{teams_mode}
```

**Special rules:**

If Teams mode enabled, auto-enable tasks mode (teams requires task breakdown):
```
IF {teams_mode} = true → {tasks_mode} = true
```

If PR mode enabled, auto-enable branch mode:
```
IF {pr_mode} = true → {branch_mode} = true
```

### 5. Show Final Configuration

Display updated configuration:
```
**Updated APEX Configuration:**

| Flag | Status |
|------|--------|
| Auto | {auto_mode ? "✓ ON" : "✗ OFF"} |
| Examine | {examine_mode ? "✓ ON" : "✗ OFF"} |
| Save | {save_mode ? "✓ ON" : "✗ OFF"} |
| Test | {test_mode ? "✓ ON" : "✗ OFF"} |
| Verify | {verify_mode ? "✓ ON" : "✗ OFF"} |
| Economy | {economy_mode ? "✓ ON" : "✗ OFF"} |
| Branch | {branch_mode ? "✓ ON" : "✗ OFF"} |
| PR | {pr_mode ? "✓ ON" : "✗ OFF"} |
| Teams | {teams_mode ? "✓ ON" : "✗ OFF"} |
```

### 6. Return

→ Return to step-00-init.md with all flags updated

---

## SUCCESS METRICS:

✅ Current configuration displayed
✅ User able to toggle any flag
✅ All selected flags properly toggled
✅ PR mode auto-enables branch mode
✅ Final configuration shown

## FAILURE MODES:

❌ Not showing current flag states
❌ Forgetting to toggle selected flags
❌ Not enabling branch_mode when pr_mode selected
❌ Starting workflow instead of returning
❌ **CRITICAL**: Using plain text prompts instead of AskUserQuestion

---

## RETURN:

After configuration complete, return to `./step-00-init.md` to continue initialization.

<critical>
Remember: This sub-step ONLY handles flag configuration. Return immediately after updating flags.
</critical>
