---
name: step-10-verify
description: Prove required APEX acceptance criteria through the real user, API, provider, artifact, or deployment surface with current evidence.
next_step: step-09-finish.md
---

# Step 10: Runtime proof

Runtime proof is a hard gate when requested by the user, required by project rules, or selected by risk. Tests and code inspection support proof but do not replace a stronger required surface.

## 1. Set proof state

Set `{proof_gate}=NOT_PROVEN`. Record environment, revision, target surface, authentication state, fixture identity, and evidence directory.

Read project verification rules and use the approved local server, browser, simulator, CLI, API, provider, or release workflow. Reuse healthy managed services instead of starting duplicates.

## 2. Build the proof matrix

Create one row per observable contract:

| ID | Acceptance criterion | Starting state | Action | Expected result | Evidence layer | Artifact | Status |
|---|---|---|---|---|---|---|---|

Include the initial state, meaningful transitions, final outcome, and relevant negative, persistence, refresh, permission, or regression paths implied by the request.

Choose evidence that matches the surface:

- visual step: current screenshot;
- CLI/API: raw command or response artifact;
- persistence: reload, relaunch, or authoritative state read-back;
- provider: provider/API read-back, not local configuration alone;
- public artifact/deployment: independently fetch the public surface or artifact;
- authenticated live flow: controlled real interaction and final observable result.

## 3. Use an independent verifier when valuable

A fresh verifier context is useful for material user-facing, high-risk, or disputed flows. Give it the original request, acceptance criteria, verification rules, current revision, and proof matrix. The coordinator inspects every returned artifact before accepting it.

## 4. Exercise the real flow

For each row:

1. Establish the documented starting state.
2. Perform the action through the intended surface.
3. Wait for and inspect the observable result.
4. Check relevant errors, failed requests, crashes, logs, and persistent state.
5. Capture evidence immediately with ordered artifact names.
6. Record timestamp, environment, revision, action, observed result, and artifact path.
7. Mark PASS only when the expected result is directly visible in current evidence.

Do not reuse evidence invalidated by a later code, configuration, environment, or data change.

## 5. Evaluate and continue

Set `{proof_gate}=PASS` only when all required criteria and rows pass, all artifacts exist and are current, and no observed error invalidates the flow.

While the gate is not PASS:

- identify the exact missing proof or failing behavior;
- use the shortest real feedback loop to diagnose it;
- return to planning or execution for in-scope fixes;
- re-run affected validation and independent review;
- reset the verification state and recapture every invalidated row.

There is no arbitrary retry limit while attempts produce meaningful progress. If a genuine external dependency blocks progress after safe alternatives are exhausted, report `BLOCKED — NOT PROVEN` with the exact condition and required input. Never relabel it as completion.

## 6. Present evidence

Show the proof matrix in flow order. Render visual artifacts inline with absolute local paths and link non-visual artifacts. State the exact local/static, provider, public-artifact/deployment, and authenticated-live boundaries proven.

When `{proof_gate}=PASS`:

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase verify --status complete --message "Runtime proof gate passed"
python3 "{skill_dir}/scripts/apex-state.py" checkpoint --root "$PWD" --run-id "{run_id}" --phase verify --message "Current proof artifacts recorded"
```

Then load `step-09-finish.md`.
