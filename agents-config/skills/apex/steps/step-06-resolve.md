---
name: step-06-resolve
description: Resolve findings - interactively address review issues
prev_step: steps/step-05-examine.md
next_step: COMPLETE
---

# Step 6: Resolve Findings

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER auto-fix Noise or Uncertain findings
- 🛑 NEVER skip validation after fixes
- ✅ ALWAYS present resolution options to user (unless auto_mode)
- ✅ ALWAYS validate after applying fixes
- ✅ ALWAYS provide clear completion summary
- 📋 YOU ARE A RESOLVER, addressing identified issues
- 💬 FOCUS on "How do we fix these issues?"
- 🚫 FORBIDDEN to proceed with failing validation

## EXECUTION PROTOCOLS:

- 🎯 Present resolution options first
- 💾 Log each fix applied (if save_mode)
- 📖 Validate after all fixes
- 🚫 FORBIDDEN to skip post-fix validation

## CONTEXT BOUNDARIES:

- Findings from step-05 are classified
- Some are Real, some Noise, some Uncertain
- User may want different resolution strategies
- Must validate after any changes
- **If `{teams_mode}` = true:** Agent team is still alive. Do NOT shutdown teammates - that happens in step-09-finish only.

## YOUR TASK:

Address adversarial review findings interactively - fix real issues, dismiss noise, discuss uncertain items.

---

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{task_description}` | What was implemented |
| `{task_id}` | Kebab-case identifier |
| `{auto_mode}` | Auto-fix Real findings |
| `{save_mode}` | Save outputs to files |
| `{output_dir}` | Path to output (if save_mode) |
| Findings table | IDs, severity, validity |
| Finding todos | For tracking |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "06" "resolve" "in_progress"
```

Append logs to `{output_dir}/06-resolve.md` as you work.

### 2. Present Resolution Options

**If `{auto_mode}` = true:**
→ Auto-fix all "Real" findings, skip Noise/Uncertain

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Resolution"
    question: "How would you like to handle these findings?"
    options:
      - label: "Auto-fix Real issues (Recommended)"
        description: "Fix 'Real' findings, skip noise/uncertain"
      - label: "Walk through each finding"
        description: "Decide on each finding individually"
      - label: "Fix only critical"
        description: "Only fix CRITICAL/BLOCKING issues"
      - label: "Skip all"
        description: "Acknowledge but don't change"
    multiSelect: false
```

### 3. Apply Fixes Based on Choice

**Auto-fix Real:**
1. Filter to Real findings only
2. For each: Read file → Apply fix → Verify
3. Log each fix

**Walk through each:**
For each finding in severity order:

```yaml
questions:
  - header: "F1"
    question: "How should we handle this finding?"
    options:
      - label: "Fix now (Recommended)"
        description: "Apply the suggested fix"
      - label: "Skip"
        description: "Acknowledge but don't fix"
      - label: "Discuss"
        description: "Need more context"
      - label: "Mark as noise"
        description: "Not a real issue"
    multiSelect: false
```

**Fix only critical:**
1. Filter to CRITICAL/BLOCKING only
2. Auto-fix those, skip others

**Skip all:**
1. Acknowledge findings
2. If Critical/High exist, confirm:

```yaml
questions:
  - header: "Confirm"
    question: "You have unresolved Critical/High findings. Proceed anyway?"
    options:
      - label: "Go back and fix"
        description: "Return to resolution options"
      - label: "Proceed anyway"
        description: "Accept risks, continue"
      - label: "Fix only critical"
        description: "Just fix critical issues"
    multiSelect: false
```

### 4. Post-Resolution Validation

After any fixes:

```bash
pnpm run typecheck && pnpm run lint
```

Both MUST pass.

### 5. Resolution Summary

```
**Resolution Complete**

**Fixed:** {count}
- F1: Parameterized SQL query in auth.ts:42
- F2: Added null check in handler.ts:78

**Skipped:** {count}
- F3: Complex function (uncertain)

**Validation:** ✓ Passed
```

### 6. Complete Save Output (if save_mode)

**If `{save_mode}` = true:**

Append to `{output_dir}/06-resolve.md`:
```markdown
---
## Step Complete
**Status:** ✓ Complete
**Findings fixed:** {count}
**Findings skipped:** {count}
**Validation:** ✓ Passed
**Timestamp:** {ISO timestamp}
```

### 7. Completion Summary

```
**APEX Workflow Complete**

**Task:** {task_description}

**Implementation:**
- Files modified: {count}
- All checks passing: ✓

**Review:**
- Findings identified: {total}
- Findings resolved: {fixed}
- Findings skipped: {skipped}

**Next Steps:**
- [ ] Commit changes
- [ ] Run full test suite
- [ ] Deploy when ready
```

---

## SUCCESS METRICS:

✅ User chose resolution approach
✅ All chosen fixes applied correctly
✅ Validation passes after fixes
✅ Clear summary of resolved/skipped
✅ User understands next steps

## FAILURE MODES:

❌ Auto-fixing Noise or Uncertain findings
❌ Not validating after fixes
❌ No clear completion summary
❌ Proceeding with failing validation
❌ **CRITICAL**: Not using AskUserQuestion for decisions

## RESOLUTION PROTOCOLS:

- Only auto-fix Real findings
- Validate after EVERY fix round
- Clear summary at the end
- User controls final decision

---

## NEXT STEP:

Based on flags:
- **If verify_mode:** Load `./step-10-verify.md` to verify feature
- **If pr_mode:** Load `./step-09-finish.md` to create pull request
- **Otherwise:** Workflow complete - show summary

<critical>
Remember: Always validate after fixes - never proceed with failing checks!
</critical>
