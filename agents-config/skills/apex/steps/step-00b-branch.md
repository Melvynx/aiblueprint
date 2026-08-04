---
name: step-00b-branch
description: Create or validate a scoped Git branch when branch delivery is requested.
---

# Branch policy

Run only when branch creation is requested or project rules require it.

1. Read current branch, revision, upstream, and dirty paths.
2. Preserve all unrelated local changes.
3. If the existing branch is suitable, reuse it.
4. If a new branch is required and authorized, follow the repository naming convention; otherwise create a non-conflicting `apex/<task-slug>` branch from the current intended revision.
5. Record the branch name and base revision in run state.

Branch creation does not authorize commits, pushes, pull requests, merges, or releases. Those remain handoff actions.

Set `{branch_applied}=true` and return to `step-00-init.md` for the next policy route.
