---
name: step-02b-tasks
description: Expand the APEX task graph into durable task packets for complex or delegated execution.
---

# Step 2b: Expanded task packets

Use only when the task is complex, resumable, delegated, or explicitly requests expanded task artifacts.

For each node in `{run_dir}/tasks.json`, create `{run_dir}/tasks/<id>.md` containing:

- objective and non-goals;
- verified context and relevant paths;
- dependencies and dependency artifacts;
- allowed read and write boundaries;
- side effects and exclusive resources;
- implementation guidance without hidden scope expansion;
- validation commands and evidence contract;
- stop condition and escalation path.

Keep one owner per write boundary at a time. Dependent tasks consume explicit artifacts or committed interface decisions, not assumptions about another worker's unfinished state.

Validate that the graph has no missing IDs, circular dependencies, orphaned acceptance criteria, or overlapping mutating ownership.

Record completion and load the exact `{execution_step}` persisted by `step-02-plan.md`. If it is missing or no longer compatible with current capabilities, return to planning and record a re-plan event instead of guessing.
