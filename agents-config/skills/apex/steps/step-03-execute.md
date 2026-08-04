---
name: step-03-execute
description: Execute the next APEX task units adaptively with bounded attempts, scope checks, checkpoints, and re-planning.
next_step: step-04-validate.md
---

# Step 3: Execute

Implement the task graph, not a stale narrative plan.

## 1. Re-read current state

Before each task unit:

- confirm dependencies are complete;
- compare repository state with the last checkpoint;
- inspect overlapping local changes;
- confirm the unit's write boundary, side effects, validation, and evidence;
- re-plan if an assumption or boundary is stale.

## 2. Choose local or delegated execution

Keep the unit local when it is on the immediate critical path, tightly coupled to current context, small, or likely to need rapid iteration. Delegate when it is self-contained and a separate context materially helps.

Delegated packets must include the task contract, exact boundaries, relevant project rules, dependencies, expected output, validation, and stop condition. A worker may report a newly discovered need but may not silently widen scope.

## 3. Record the attempt

Every attempt has a stable task ID and incrementing attempt number. Record its starting revision, owner, intended paths, and status before mutation.

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase execute --task-id "{unit_id}" --status in_progress --message "Attempt started"
```

## 4. Implement in a tight loop

1. Make the smallest coherent edit.
2. Inspect the changed diff immediately.
3. Run the shortest relevant feedback command.
4. Fix introduced failures within scope.
5. Repeat until the task's evidence contract is met or a re-plan trigger fires.

Do not opportunistically refactor unrelated code. Preserve user changes even when they complicate the implementation.

## 5. Close or re-plan

A task is complete only when its declared output exists, its write boundary is respected, relevant validation has a classified result, and required evidence is recorded.

If blocked, record the concrete condition, attempted alternatives, and exact input or authority needed. Continue with other independent unblocked units when useful.

After completion:

```bash
python3 "{skill_dir}/scripts/apex-state.py" event --root "$PWD" --run-id "{run_id}" --phase execute --task-id "{unit_id}" --status complete --message "Task output and evidence recorded"
python3 "{skill_dir}/scripts/apex-state.py" checkpoint --root "$PWD" --run-id "{run_id}" --phase execute --message "Task checkpoint"
```

## Completion

Proceed to `step-04-validate.md` when all required graph nodes are complete or explicitly blocked with no remaining meaningful in-scope work.
