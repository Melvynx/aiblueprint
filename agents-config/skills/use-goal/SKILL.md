---
name: use-goal
description: Use when the user asks to create, draft, set, start, or refine a Codex or Claude Code `/goal` objective for persistent multi-turn work.
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

Before writing or creating the Goal, think through the verification strategy. Do a short discovery pass when the evidence surface is not already obvious:

- Inspect repository docs, package scripts, test commands, CI config, benchmark scripts, failing logs, linked issue text, plans, or referenced files.
- Identify which command, artifact, report, screenshot, benchmark, source document, or manual check can prove completion.
- For external libraries, APIs, or current product behavior, use the appropriate docs/research skill before relying on memory.
- Prefer existing project commands and documented workflows over inventing new validation.
- If no reliable verification surface exists, ask one concise question or make the Goal explicitly require creating one.

For broad refactors, deletions, migrations, moving files, or "remove all X" goals, read `references/verification-harnesses.md` before creating the Goal. Default to a measurable harness: establish a baseline count/list first, then make the Goal continue until the validation command exits successfully at the target condition, such as count `0`.

Write the Goal as a compact, well-formatted contract with these fields embedded in natural language:

1. Outcome: what must be true when the work is done.
2. Verification surface: the tests, commands, benchmarks, artifacts, reports, logs, source material, or other concrete evidence that proves it.
3. Constraints: what must not regress or be violated.
4. Boundaries: allowed files, tools, repositories, data, and resources when relevant.
5. Iteration policy: how to choose the next best action after each attempt.
6. Blocked stop condition: when to stop and what to report if no defensible path remains.

For long-running implementation work, also include:

- one objective and one stopping condition
- the files, docs, issue, logs, or plan the agent should inspect first
- the commands or artifacts that prove progress
- checkpoint behavior and a short progress log requirement

Prefer this pattern:

```text
<desired end state>, verified by <specific evidence>, while preserving <constraints>. Use <allowed inputs, tools, or boundaries>. Between iterations, <how to choose and record the next best action>. If blocked or no valid paths remain, stop with <attempted paths, evidence gathered, blocker, and next input needed>.
```

For implementation Goals, include exact command names when known:

```text
<desired end state>, verified by `<test or build command>` and <artifact/manual check>, while preserving <constraints>. First inspect <files/docs/logs>. Work in checkpoints: after each change, run the narrowest relevant verification, record the result, and choose the next smallest defensible step. Stop only when the verification passes, or stop blocked with the failed command output, attempted paths, and the missing input needed.
```

Keep the objective non-empty and at most 4,000 characters. If the needed instructions are longer, create or point to a file and make the Goal refer to that file.

## Create Or Draft

When goal tools are available, use this order:

1. Call the status tool first to check whether a Goal already exists.
2. If the user explicitly asked to create, set, start, or use a new Goal and no Goal exists, call the create tool with the refined objective.
3. Set a token budget only when the user explicitly provided one.
4. If a Goal already exists, do not overwrite, clear, pause, or resume it unless the user explicitly asks for that lifecycle action.

For Codex, this means calling `get_goal` first, then `create_goal` with the refined objective when creation is requested and no active Goal blocks it. Read `references/codex-goal.md` before doing so.

For Claude Code, `/goal <condition>` is a real slash command, but the model cannot launch it unless the harness exposes a slash-command dispatch tool. If no dispatch tool is available, return the exact manual `/goal ...` command, ask the user to paste/run it, and wait for confirmation before continuing Goal-driven work. Do not say Claude Code lacks `/goal`, do not call it Codex-only, and do not substitute a task list or goal file as equivalent unless the user explicitly asks for that fallback. Read `references/claude-code-goal.md` before drafting or instructing a Claude Code Goal.

If the user asks only to draft, rewrite, explain, or refine a Goal, return the final `/goal ...` text instead of activating it.

Ask a clarifying question only when a missing detail would make the Goal unverifiable or unsafe. Prefer one concise question. Otherwise infer conservative defaults from the repository, task, and available evidence.

## Evidence Rules

Completion must be evidence-based. Do not mark a Goal complete because the work seems likely done. First compare the objective to concrete evidence such as changed files, command output, tests, benchmarks, generated artifacts, logs, or source-backed research findings.

If a budget limit is reached, stop substantive work, summarize progress and blockers, and identify the next useful step. Do not treat budget exhaustion as completion.

If blocked, report the attempted paths, evidence gathered, blocker, and exact input or external change that would unlock progress.

If status reports become vague, tighten the Goal instead of adding more one-off instructions. Name the current checkpoint, what was verified, what remains, and what should cause a pause.

Only mark a Goal complete after verifying the stated stopping condition. Only mark it blocked when the same blocking condition has repeated enough that no meaningful progress is possible without user input or an external change.

## References

- `references/codex-goal.md`: Use for Codex Goal mode, `get_goal` / `create_goal`, CLI/app `/goal`, feature setup, and completion/blocking rules.
- `references/claude-code-goal.md`: Use for Claude Code manual `/goal`, evaluator behavior, requirements, status, clear/resume behavior, and non-interactive usage.
- `references/verification-harnesses.md`: Use for measurable refactor, deletion, migration, move, rename, dependency-removal, and "remove all X" Goals.

## Good Examples

```text
/goal Reduce p95 checkout latency below 120 ms, verified by the checkout benchmark, while keeping the correctness suite green. Use only the checkout service, benchmark fixtures, and related tests. Between iterations, record what changed, what the benchmark showed, and the next best experiment to try. If the benchmark cannot run or no valid paths remain, stop with the attempted paths, the evidence gathered, the blocker, and the next input needed.
```

```text
/goal Make the checkout test suite pass on the current branch, verified by the repository's documented test command, while preserving public API behavior. Use the failing tests, adjacent implementation files, and existing test helpers. Between iterations, inspect the latest failure, make the smallest defensible change, and rerun the relevant test surface. If no valid path remains, stop with the failures, changes tried, and the missing decision or dependency.
```

```text
/goal Produce the strongest evidence-backed reproduction report for the provided paper using available materials and local resources. Attempt the headline claims where feasible, verify outputs where possible, and end with a report that separates confirmed findings, approximate reconstructions, blocked claims, and remaining uncertainty.
```
