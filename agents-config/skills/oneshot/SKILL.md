---
name: oneshot
description: Implement one focused code change quickly with minimal exploration and targeted validation. Use for small bug fixes, single feature edits, config updates, or explicit "$oneshot" requests.
argument-hint: <feature-description>
---

# OneShot

Use this for one narrow implementation task. Optimize for the shortest reliable path to a working, verified change.

## Workflow

### 1. Scope

- Identify the exact target and likely files with `rg` / `rg --files`.
- Read only the files needed to edit safely, usually 2-5 plus nearby examples.
- Look up docs only when API, version, or current behavior may be stale.

### 2. Implement

- Edit as soon as the existing pattern is clear.
- Keep the diff minimal and local to the request.
- Do not refactor, rename, redesign, rewrite docs, or clean adjacent code unless required.
- Prefer existing helpers, conventions, and package scripts.

### 3. Validate

- Run the smallest meaningful checks: targeted tests, touched-package lint/typecheck, and formatter when expected.
- If a check fails, fix only failures caused by this change and rerun.
- Run broader checks only for shared/high-risk code or when the user asks.

## Stop Rules

- Do not expand into adjacent improvements.
- Ask only when a missing decision blocks safe implementation.
- If blocked after two concrete attempts, report the blocker, evidence, and the next exact option.

## Final Response

Report changed files, validation commands/results, and any skipped checks with reason.
