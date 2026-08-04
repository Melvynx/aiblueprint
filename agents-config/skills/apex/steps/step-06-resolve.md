---
name: step-06-resolve
description: Resolve confirmed APEX findings, preserve finding provenance, and re-run invalidated validation and proof.
next_step: step-04-validate.md
---

# Step 6: Resolve findings

Resolve confirmed findings in severity and dependency order.

## 1. Select disposition

- Fix confirmed in-scope findings.
- Leave noise unchanged and record why.
- Do not silently absorb pre-existing or out-of-scope issues.
- Investigate high-impact uncertain findings until they become confirmed, rejected, or concretely blocked.
- Ask before accepting an unresolved critical/high risk when that choice belongs to the user.

## 2. Update the graph

Create or revise task nodes for fixes. Record which acceptance criteria, validation entries, reviewer dispositions, and proof artifacts become stale.

## 3. Apply fixes

Use the standard execution protocol: bounded edit, immediate diff inspection, shortest feedback loop, and scope check. A reviewer does not become the sole judge of its own remediation.

## 4. Re-validate

Return to `step-04-validate.md` for every affected command and then re-run the relevant independent review lens. If runtime proof artifacts were invalidated, recapture them through `step-10-verify.md`.

Record fixed, rejected, deferred, and blocked finding IDs with evidence.

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase resolve --status complete --message "Confirmed findings resolved or explicitly dispositioned"
```

Completion requires no unresolved confirmed blocker and current validation after the latest fix.
