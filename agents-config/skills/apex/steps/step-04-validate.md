---
name: step-04-validate
description: Integrate the APEX diff and classify relevant validation without confusing regressions, baseline noise, or unavailable checks.
---

# Step 4: Integrate and validate

Validation is evidence collection, not a ritual command list.

## 1. Review the integrated scope

Inspect current Git status, staged and unstaged diffs, untracked files, generated artifacts, and the task graph. Confirm:

- every intended change maps to an acceptance criterion;
- no unrelated user change was absorbed or overwritten;
- no task exceeded its write boundary without a recorded re-plan;
- dependencies and generated outputs are consistent;
- formatting did not create unrelated churn.

## 2. Discover relevant checks

Read project instructions, package scripts, CI configuration, and nearby tests. Select checks from the changed surface and risk:

- syntax, formatting, lint, and types;
- targeted unit, integration, contract, or end-to-end tests;
- build, packaging, schema, migration, or generated-code validation;
- runtime, provider, or public-artifact checks when required.

Do not invent a command because another ecosystem commonly uses it.

## 3. Establish baseline when needed

When a broad check fails and causality is unclear, compare against the pre-task revision or use targeted diagnostics that preserve user changes. Classify each result:

| Status | Meaning |
|---|---|
| PASS | Check ran and passed on the current intended state |
| FAIL_INTRODUCED | Current APEX changes caused the failure |
| FAIL_PREEXISTING | Failure is reproduced outside the intended change or predates it |
| FAIL_UNRELATED | Failure belongs to unrelated local changes or an out-of-scope area |
| UNAVAILABLE | Required service, dependency, credential, command, or environment is absent |
| NOT_RUN | Check was intentionally omitted with a concrete reason |

Never turn `UNAVAILABLE`, `NOT_RUN`, or an unproven baseline inference into PASS.

## 4. Resolve introduced failures

Fix `FAIL_INTRODUCED` within scope and re-run every invalidated check. Do not repair pre-existing or unrelated failures unless the user expands scope.

If a failure exposes a flawed plan or interface, record a re-plan event and return to execution.

## 5. Record validation ledger

For each check, record command/tool, environment, timestamp, revision, exit status, concise result, classification, and artifact path when useful.

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase validate --status complete --message "Validation ledger classified"
python3 "{skill_dir}/scripts/apex-state.py" checkpoint --root "$PWD" --run-id "{run_id}" --phase validate --message "Integrated validation checkpoint"
```

## Routing

- If `{test_authoring}=on`, load `step-07-tests.md` when new tests remain to be authored.
- If `{test_authoring}=off`, do not author new tests; report material coverage gaps precisely.
- If `{test_authoring}=risk-based`, load `step-07-tests.md` only for an evidence-backed material gap.
- Load `step-05-examine.md` for adversarial or risk-required review.
- Load `step-10-verify.md` when runtime proof is required and review requirements are already satisfied.
- Otherwise continue to `step-09-finish.md`.
