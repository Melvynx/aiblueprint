---
name: step-03-execute-teams
description: Coordinate bounded APEX subagents using the capabilities available in the current harness.
next_step: step-04-validate.md
---

# Step 3: Coordinated execution

Use when the plan contains multiple independent units and the current harness exposes a suitable subagent lifecycle.

## Coordinator responsibilities

The coordinator owns:

- the task graph and all re-planning;
- assignment and write-boundary exclusivity;
- dependency and resource scheduling;
- inspection of returned diffs and artifacts;
- integration, conflict resolution, evidence acceptance, and completion.

Workers own only their assigned packet. They do not approve plan changes or finish the APEX run.

## 1. Capability preflight

Discover the actual spawn, message, status, wait, and shutdown operations available. Use their documented schemas. If coordinated agents are unavailable, return to `step-03-execute.md` without degrading the task contract.

## 2. Schedule from the graph

Choose concurrency from:

- dependency readiness;
- overlapping read/write boundaries;
- shared generated files and Git index access;
- exclusive services, devices, ports, accounts, or fixtures;
- expected context-transfer and integration cost;
- current budget policy.

Task count alone is not a sizing signal. Prefer a small number of high-value workers. Run mutating assignments sequentially whenever the harness cannot guarantee safe coordination of disjoint boundaries in the shared checkout.

## 3. Send bounded packets

Each worker receives:

```markdown
Objective:
Non-goals:
Dependencies and artifacts:
Allowed paths:
Forbidden scope:
Relevant project rules:
Expected output:
Validation and evidence:
Stop condition:
```

Use a role appropriate to the unit when the harness provides one. Let local policy or the harness select the model unless the task has an evidence-backed need for a different route.

## 4. Keep local progress moving

After dispatching non-blocking sidecars, continue useful non-overlapping critical-path work. Wait only when a returned result is required for the next action. Do not duplicate delegated investigations or edits.

## 5. Inspect every return

For each result:

1. Verify the reported files against the declared boundary.
2. Inspect the actual diff and repository state.
3. Re-run or validate decisive evidence.
4. Reject noise, unrelated changes, and unsupported claims.
5. Record completion, rework, or a re-plan event.

If a worker crosses scope, preserve user work, isolate the relevant diff logically, and reassign or repair only after understanding the overlap.

## 6. Finish coordination

Close workers when their task and any follow-up are complete. The coordinator then performs one integrated diff review and proceeds to `step-04-validate.md`.
