---
name: step-02-plan
description: Build a revisable APEX task graph with dependencies, scope, side effects, validation, evidence, and re-plan triggers.
---

# Step 2: Plan

Create a plan detailed enough to execute and compact enough to revise.

## 1. Select the smallest coherent approach

Follow existing repository patterns unless evidence supports a deliberate change. Prefer additive, reversible, and scope-preserving changes. Identify rollback or recovery for high-risk mutations.

Ask the user only when multiple valid choices materially change product behavior, scope, authority, or irreversible outcomes. Otherwise record the selected assumption.

## 2. Build the task graph

Create one task per independently verifiable unit, not automatically one per file. Every task must include:

```yaml
id: stable-task-id
objective: measurable outcome
dependencies: []
read_set: []
write_set: []
side_effects: []
owner: coordinator | delegated-role
inputs: []
expected_outputs: []
validation: []
evidence_required: []
stop_condition: explicit completion or blocker condition
status: pending
```

Mark exclusive resources such as shared databases, generated files, local servers, devices, provider accounts, and Git index operations. Two mutating tasks may run concurrently only when their writes and exclusive resources do not conflict and the harness can coordinate them safely.

## 3. Map acceptance and risk

Every acceptance criterion must map to one or more tasks and a final evidence source. Add specialist review or runtime/provider proof where risk requires it.

## 4. Define re-plan triggers

At minimum:

- repository state or scope changes;
- dependency output changes an interface;
- a task touches outside its declared boundary;
- a required capability, credential, service, or command is unavailable;
- validation fails for an unexpected reason;
- evidence contradicts an assumption;
- two tasks contend for the same resource.

When triggered, record the observation, decision, affected tasks, and invalidated evidence. Update the graph before continuing.

## 5. Choose orchestration

- Keep tightly coupled or critical-path work with the coordinator.
- Delegate self-contained sidecars that can progress without blocking the next local action.
- Use parallelism only for genuinely independent work.
- Give every worker a bounded packet and no authority to expand the graph or accept its own evidence.
- Choose model and reasoning effort from task difficulty, cost, and local policy; do not encode transient model names in the plan.

Resolve and record `{execution_step}` before creating expanded task packets:

- `{orchestration_policy}=direct` → `step-03-execute.md`.
- `{orchestration_policy}=prefer-parallel` → `step-03-execute-teams.md` only when capability and conflict checks permit; otherwise `step-03-execute.md` with the reason recorded.
- `{orchestration_policy}=auto` → select one of those two steps from the graph, budget, and capability preflight.

## 6. Persist and present

Write the graph to `{run_dir}/tasks.json` through the run-state script or as a validated JSON artifact. Present a concise plan with scope, dependency order, validation, proof, risk, and any assumptions.

The user's implementation request is approval for normal in-scope edits. Ask again only for a newly discovered material choice or action class outside that scope.

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase plan --status complete --message "Revisable task graph recorded"
python3 "{skill_dir}/scripts/apex-state.py" checkpoint --root "$PWD" --run-id "{run_id}" --phase plan --message "Ready to execute"
```

## Completion

- If `{expanded_tasks}=on`, load `step-02b-tasks.md`.
- If `{expanded_tasks}=off`, do not create expanded task packets.
- If `{expanded_tasks}=auto`, create them only when complexity, delegation, or resume value justifies them.
- After any expanded task packets are complete, load the persisted `{execution_step}` exactly. Without expanded packets, load it directly from this step.
