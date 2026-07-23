---
name: use-goal
description: Use when the user asks to create, draft, set, start, or refine a Codex or Claude Code /goal objective for persistent multi-turn work.
---

# Use Goal

Create or draft a Codex or Claude Code Goal that follows the official `/goal` contract: one persistent objective with evidence-based completion criteria.

## When To Use

Use this skill when the user explicitly asks to:

- create, set, start, or use a Goal
- turn a task into a strong `/goal`
- make Codex or Claude Code continue until an outcome is actually done
- define success criteria for longer debugging, optimization, migration, refactor, benchmark, flaky-test, or research work

Do not introduce a Goal for a one-off edit, short explanation, simple code review, or single answer unless the user explicitly asks for Goal mode.
Do not use a Goal for a loose backlog or unrelated task list. A good Goal is bigger than one prompt but smaller than an open-ended project.

## Pick The Platform

Before drafting or creating a Goal, identify the active platform from the runtime and available tools:

- **Codex**: use `references/codex-goal.md`.
- **Claude Code**: use `references/claude-code-goal.md`.
- **Unknown platform**: draft a plain `/goal ...` command and state that the user should run it in the target agent.

If Goal tools are available in Codex, use them rather than only printing a slash command. If the runtime only exposes slash commands, return the exact `/goal ...` command unless the harness can dispatch it directly.

## Goal Shape

Before writing or creating the Goal, think through the verification strategy. Inspect repository docs, package scripts, tests, CI config, benchmark scripts, failing logs, linked issue text, plans, or referenced files when the evidence surface is not obvious.

Identify which command, artifact, report, screenshot, benchmark, source document, or manual check can prove completion. Prefer existing project commands and documented workflows over invented validation. If no reliable verification surface exists, ask one concise question or make the Goal explicitly require creating one.

Write one compact objective with the outcome, verification surface, constraints, boundaries, iteration policy, and blocked stop condition. For long-running implementation work, include the files to inspect first, exact proof commands, checkpoint behavior, and a short progress log requirement.

Prefer this pattern:

```text
<desired end state>, verified by <specific evidence>, while preserving <constraints>. Use <allowed inputs, tools, or boundaries>. Between iterations, <how to choose and record the next best action>. If blocked or no valid paths remain, stop with <attempted paths, evidence gathered, blocker, and next input needed>.
```

## Create Or Draft

When goal tools are available, check the current Goal first. Create a new one only when the user explicitly asks for it and no active Goal blocks it. Do not overwrite, clear, pause, or resume an existing Goal unless explicitly requested.

If the user asks only to draft, rewrite, explain, or refine a Goal, return the final `/goal ...` text instead of activating it.

## Evidence Rules

Completion must be evidence-based. Do not mark a Goal complete because the work seems likely done, because a budget is exhausted, or because no more work is planned. Only mark it complete after verifying the stated stopping condition. If blocked, report the attempted paths, evidence gathered, blocker, and exact input or external change needed.

## References

- `references/codex-goal.md`: Codex Goal mode, tools, lifecycle, and completion rules.
- `references/claude-code-goal.md`: Claude Code `/goal` command, evaluator, and manual activation.
- `references/verification-harnesses.md`: measurable validation for refactors, deletions, migrations, and moves.
