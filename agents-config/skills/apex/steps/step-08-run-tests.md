---
name: step-08-run-tests
description: Run focused APEX tests in a causal fix loop and stop or re-plan when attempts stop making progress.
next_step: step-04-validate.md
---

# Step 8: Test loop

## 1. Prepare the environment

Follow project rules for services, ports, fixtures, devices, credentials, and cleanup. Reuse healthy managed services when required by local instructions. Do not launch unmanaged persistent processes.

## 2. Run narrow to broad

Start with the new or affected tests, then expand to the relevant suite. Capture command, environment, revision, exit status, and decisive output.

## 3. Diagnose causally

For every failure, classify whether it is introduced, pre-existing, unrelated, unavailable, or test-design error. Change code or tests only when evidence supports the cause.

## 4. Bound unproductive retries

Continue while each attempt produces new evidence or measurable progress. If two consecutive rounds reproduce the same blocker without new information, stop repeating the command, record the blocker, and re-plan or request the precise missing input.

## 5. Clean up and return

Clean up task-owned fixtures and processes. Return to `step-04-validate.md` so the integrated ledger reflects the latest code and tests.
