---
name: step-05-examine
description: Select independent APEX reviewers by change risk and domain, then validate and deduplicate their findings.
---

# Step 5: eXamine

Independent review is mandatory for material, high-risk, or explicitly adversarial work. Review depth follows the diff, not a fixed agent count.

## 1. Build the review packet

Capture:

- original task and acceptance criteria;
- intended paths and actual diff;
- relevant architecture and project rules;
- validation ledger and known baseline failures;
- unresolved risks, assumptions, and proof requirements.

Review the actual uncommitted task diff, not automatically `HEAD~1`.

## 2. Select review lenses

Use only lenses relevant to the change:

| Lens | Trigger examples |
|---|---|
| Correctness and edge cases | State transitions, concurrency, parsing, error handling |
| Security and authority | Auth, tenant boundaries, secrets, input boundaries, external actions |
| Data and migration safety | Schema changes, backfills, idempotency, rollback |
| Domain specialist | Payments, email, mobile, framework, provider, performance |
| Maintainability | Cross-cutting changes, new abstractions, large or structurally risky diffs |
| Evidence and acceptance | Runtime/provider/public claims or complex proof matrix |

Use a fresh independent context for each genuinely distinct lens. Combine closely related lenses when separation would only duplicate context. For low-risk changes, one focused independent reviewer may be enough. For high-risk changes, use multiple non-overlapping specialists.

Reviewers are read-only unless explicitly assigned a later resolution task.

## 3. Require high-signal findings

Every finding must contain:

- stable ID, severity, and confidence;
- exact file and line or artifact reference;
- concrete failure scenario or violated contract;
- evidence that the issue is introduced or exposed by the intended diff;
- smallest safe remediation direction.

Reject style preference, speculative breakage without a path, duplicated findings, and issues wholly outside scope.

## 4. Validate findings

The coordinator independently inspects each reported issue and classifies it:

- `CONFIRMED`;
- `NOISE`;
- `PREEXISTING`;
- `OUT_OF_SCOPE`;
- `UNCERTAIN` with the exact missing evidence.

Only confirmed findings block completion automatically. High-severity uncertain findings require targeted investigation before disposition.

## 5. Record review ledger

Store reviewer lens, evidence, classification, disposition, and any invalidated validation or proof artifacts.

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase examine --status complete --message "Independent findings validated and deduplicated"
```

## Routing

- If confirmed findings exist, load `step-06-resolve.md`.
- If test coverage must change, load `step-07-tests.md`.
- If runtime proof is required, load `step-10-verify.md`.
- Otherwise load `step-09-finish.md`.
