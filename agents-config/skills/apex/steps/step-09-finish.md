---
name: step-09-finish
description: Complete an APEX run with scope review, proof-boundary reporting, and only the delivery actions authorized by the user.
---

# Step 9: Handoff

Do not edit implementation code here. Return to the relevant phase if the completion audit finds a defect.

## 1. Audit completion

Confirm:

- every acceptance criterion has current evidence at the required level;
- all introduced failures are resolved;
- review requirements and confirmed findings are closed;
- current Git diff matches the intended task scope;
- unrelated staged, unstaged, deleted, and untracked paths remain untouched;
- run state lists every unavailable check, blocker, and residual risk honestly.

Do not call a blocked, unverified, or partially validated task complete.

## 2. Report proof boundaries

Separate claims explicitly:

| Layer | Example evidence | Claim boundary |
|---|---|---|
| Local/static | Diff, typecheck, lint, tests, local runtime | What the inspected local state proves |
| Provider | Authoritative provider/API read-back | What provider configuration or state proves |
| Public artifact/deployment | Re-downloaded artifact, public URL, deployment revision | What an unauthenticated external consumer can obtain |
| Authenticated live | Controlled signed-in flow, send/receipt, persistent read-back | What was observed through the real protected surface |

Use `NOT RUN`, `UNAVAILABLE`, `NOT PROVEN`, or `BLOCKED` where appropriate. Do not let a stronger-sounding summary erase those boundaries.

## 3. Perform only requested delivery actions

Implementation permission does not by itself request a commit, push, pull request, merge, deploy, release, provider mutation, or external message.

When a delivery action is in scope:

1. Review the exact paths and diff that belong to the task.
2. Stage only those paths unless the user explicitly requested the entire reviewed tree.
3. Scan the staged diff for secrets and scope drift.
4. Commit using the repository convention.
5. Push only the intended branch.
6. Create or update the requested pull request with actual validation and proof boundaries.
7. Read back the remote branch, pull request, deployment, provider state, or public artifact needed to support the delivery claim.

Never force push, merge, release, deploy, or communicate externally without the corresponding authority.

## 4. Close run state

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase handoff --status complete --message "Completion audit and authorized handoff finished"
python3 "{skill_dir}/scripts/apex-state.py" checkpoint --root "$PWD" --run-id "{run_id}" --phase handoff --message "APEX run complete"
```

Present the outcome, changed files, validation ledger, review disposition, proof boundaries, delivery read-back, and any remaining local changes.
