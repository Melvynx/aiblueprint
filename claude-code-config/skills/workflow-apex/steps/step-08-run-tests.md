---
name: step-08-run-tests
description: Run tests in a loop - fix issues until all pass
prev_step: steps/step-07-tests.md
next_step: steps/step-05-examine.md
---

# Step 8: Run Tests (Fix Loop)

## MANDATORY EXECUTION RULES (READ FIRST):

- 🛑 NEVER give up after first failure
- 🛑 NEVER start services without permission (unless auto_mode)
- 🛑 NEVER infinite loop on same failure (max 3 attempts)
- ✅ ALWAYS loop until all tests pass
- ✅ ALWAYS ask user when stuck (unless auto_mode)
- ✅ ALWAYS clean up background processes
- 📋 YOU ARE A TEST RUNNER, fixing until green
- 💬 FOCUS on "Run → Fail → Fix → Repeat until green"
- 🚫 FORBIDDEN to ignore configuration errors

## EXECUTION PROTOCOLS:

- 🎯 Check requirements before running
- 💾 Log each test run (if save_mode)
- 📖 Analyze failures before fixing
- 🚫 FORBIDDEN to proceed with failing tests (without explicit skip)

## CONTEXT BOUNDARIES:

- Tests were created in step-07
- Tests may require services (DB, server)
- Failures may be code bugs or test bugs
- Loop until all green or user decides to skip

## YOUR TASK:

Run tests, fix any failures, and loop until ALL tests pass.

---

<available_state>
From previous steps:

| Variable | Description |
|----------|-------------|
| `{task_description}` | What was implemented |
| `{task_id}` | Kebab-case identifier |
| `{auto_mode}` | Auto-start servers, auto-retry |
| `{examine_mode}` | Auto-proceed to review after |
| `{save_mode}` | Save outputs to files |
| `{output_dir}` | Path to output (if save_mode) |
| Tests created | From step-07 |
| Test command | Discovered in step-07 |
</available_state>

---

## EXECUTION SEQUENCE:

### 1. Initialize Save Output (if save_mode)

**If `{save_mode}` = true:**

```bash
bash {skill_dir}/scripts/update-progress.sh "{task_id}" "08" "run-tests" "in_progress"
```

Append logs to `{output_dir}/08-run-tests.md` as you work.

### 2. Check Requirements

**Identify required services:**
```bash
cat package.json | grep -A 10 '"scripts"'
```

Common: Database, dev server, Redis

**Check if running:**
```bash
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Server running"
```

### 3. Handle Missing Services

**If `{auto_mode}` = true:**
→ Start services automatically:
```bash
pnpm run dev &
sleep 5
```

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Services"
    question: "Tests require services that aren't running. How proceed?"
    options:
      - label: "I'll start manually"
        description: "Give me a moment to start them"
      - label: "Start automatically"
        description: "Try to start services automatically"
      - label: "Skip tests needing services"
        description: "Only run tests that don't need services"
      - label: "Skip test step"
        description: "Continue without running tests"
    multiSelect: false
```

### 4. Run Test Loop

**CRITICAL: Loop until all pass**

```
max_attempts = 10
attempt = 0

WHILE attempt < max_attempts:
    attempt += 1

    1. Run tests
    2. If all pass → EXIT (success)
    3. If failure:
       a. Analyze failure
       b. Determine: code bug or test bug?
       c. Fix the issue
       d. CONTINUE LOOP
    4. If same failure 3x → ASK USER
```

**Run tests:**
```bash
pnpm run test 2>&1
```

**Log each run:**
```
**Run #{attempt}:**
- Total: 5, Passed: 3, Failed: 2
- Fixing: {description}
```

### 5. Handle Failures

For each failing test:

```
**Analyzing:**
Test: "creates user with valid data"
File: src/auth/register.test.ts:25
Error: Expected 201, got 500
Stack: TypeError: Cannot read 'email' of undefined

**Diagnosis:** Code bug - null handling
**Fix:** Add null check in handler
```

**Fix location:**
| Error Type | Fix |
|------------|-----|
| Assertion failed | Usually code bug |
| TypeError in code | Code bug |
| TypeError in test | Test bug |
| Timeout | async/await issue |
| Import error | Missing dep |

### 6. Handle Stuck (3x same failure)

**If `{auto_mode}` = true:**
→ Try different approach once, then continue

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Stuck"
    question: "Test keeps failing. How proceed?"
    options:
      - label: "I'll debug manually"
        description: "Let me investigate"
      - label: "Skip this test"
        description: "Mark as skip, continue others"
      - label: "Delete test"
        description: "Remove this test entirely"
      - label: "Keep trying"
        description: "Try more approaches"
    multiSelect: false
```

### 7. Handle Config Errors

| Error | Solution |
|-------|----------|
| Cannot find module | Check imports, pnpm install |
| Connection refused | DB/server not running |
| Timeout | Increase timeout, check async |

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Config"
    question: "Configuration issue detected. How proceed?"
    options:
      - label: "I'll fix manually"
        description: "Let me handle config"
      - label: "Try automatic fix"
        description: "Attempt suggested fix"
      - label: "Skip tests"
        description: "Continue without tests"
    multiSelect: false
```

### 8. Success - All Passing

```
**✓ All Tests Passing**

**Results:**
- Total: {count}
- Passed: {count}
- Failed: 0

**Attempts:** {count}

**Tests:**
- src/auth/register.test.ts - 3 tests
- src/utils/validation.test.ts - 2 tests
```

### 9. Complete Save Output (if save_mode)

**If `{save_mode}` = true:**

Append to `{output_dir}/08-run-tests.md`:
```markdown
---
## Step Complete
**Status:** ✓ Complete
**Tests passed:** {count}
**Attempts:** {count}
**Next:** {next step}
**Timestamp:** {ISO timestamp}
```

### 10. Determine Next Step

**If `{examine_mode}` = true:**
→ Load step-05-examine.md

**If `{auto_mode}` = false:**

```yaml
questions:
  - header: "Next"
    question: "All tests passing. What next?"
    options:
      - label: "Run adversarial review"
        description: "Deep review for security/logic"
      - label: "Complete workflow"
        description: "Finalize and show summary"
    multiSelect: false
```

**Else:**
→ Complete workflow

---

## SUCCESS METRICS:

✅ All tests passing
✅ No stuck failures without user decision
✅ Config issues resolved
✅ Services cleaned up
✅ Clear summary

## FAILURE MODES:

❌ Giving up after first failure
❌ Infinite loop on same failure
❌ Starting services without permission
❌ Not cleaning up background processes
❌ Ignoring config errors
❌ **CRITICAL**: Not using AskUserQuestion when stuck

## RUN PROTOCOLS:

- Loop until green
- Analyze before fixing
- Ask user when stuck (3x)
- Clean up services
- Clear summary at end

---

## NEXT STEP:

Based on flags (check in order):
- **If examine_mode:** Load `./step-05-examine.md`
- **If pr_mode:** Load `./step-09-finish.md` to create pull request
- **Otherwise:** Workflow complete - show summary

<critical>
Remember: Loop until ALL tests pass - don't give up after first failure!
</critical>
