---
name: apex
description: Structured implementation using the APEX method (Analyze → Plan → Execute → eXamine). Use when implementing a feature or fixing a bug that benefits from a clear, deliberate workflow instead of jumping straight to code.
argument-hint: "[-x] <task-description>"
---

# APEX

Implement `$ARGUMENTS` with a deliberate, four-phase workflow. Think before each phase.

Add `-x` to the request for an extra adversarial review pass after validation.

## A — Analyze

Gather just enough context to act with confidence:

- Use `Glob`/`Grep` to find the files and patterns you'll touch
- Read the closest existing example and follow its conventions
- Restate the task as 2-4 concrete acceptance criteria
- Note open questions; ask only if a wrong assumption would be costly

## P — Plan

Write a short, file-by-file plan before editing:

- List each file to create or change and what changes in it
- Pick the simplest approach that satisfies the criteria
- Order the steps so the code stays runnable along the way

## E — Execute

Implement the plan:

- Match the surrounding code's naming, structure, and idioms
- Stay strictly in scope — no "while I'm here" refactors
- Comments only where intent is genuinely non-obvious
- Run the formatter if the project has one

## X — eXamine

Validate, then optionally review:

1. **Validate**: run `lint`, `typecheck`, and relevant tests. Fix only what you broke; re-run until clean.
2. **Review** (only if `-x`): re-read the diff as a skeptic — check for bugs, security holes, missed edge cases, and overcomplication. Fix what you find.

## Output

```
## APEX complete

**Task:** {what was implemented}
**Criteria:** {✓ per acceptance criterion}
**Files changed:** {list}
**Validation:** ✓ lint ✓ typecheck ✓ tests
```

## Rules

- One step at a time — finish each phase before the next
- Stay in scope; ship the smallest change that meets the criteria
- If blocked after 2 attempts, report the blocker and stop
