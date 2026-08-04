# Codex Goal Reference

Use this reference when the active agent is OpenAI Codex, including the Codex app, IDE extension, or CLI.

Official references:

- https://developers.openai.com/codex/use-cases/follow-goals
- https://developers.openai.com/codex/app/commands
- https://developers.openai.com/codex/cli/slash-commands

## Command Surface

`/goal <objective>` starts Goal mode. `/goal` views the current Goal. `/goal pause`, `/goal resume`, and `/goal clear` manage lifecycle.

Goal objectives must be non-empty and at most 4,000 characters. For longer instructions, create or point to a file and make the Goal refer to that file.

If `/goal` is missing, tell the user to enable Goals with:

```toml
[features]
goals = true
```

They can also run:

```bash
codex features enable goals
```

## Tool Contract

When Codex Goal tools are available, use the tools instead of printing a slash command for activation:

1. Call `get_goal` before any lifecycle action.
2. If the user asked to create, set, start, activate, or use a new Goal and no active Goal exists, call `create_goal` with the refined objective.
3. Pass `token_budget` only when the user explicitly provided a budget.
4. If a Goal already exists, do not overwrite, clear, pause, resume, mark complete, or mark blocked unless the user explicitly asked for that lifecycle action or the active Goal's stated status condition is actually met.

Use slash-command text only when the user asks for a draft, the tool surface is unavailable, or the target is a separate Codex session.

## Codex Goal Shape

A strong Codex Goal should define:

- one objective and one stopping condition
- the files, docs, issue, logs, or plan Codex should inspect first
- the commands, artifacts, screenshots, benchmarks, reports, or manual checks that prove progress
- constraints that must not regress
- checkpoint behavior and compact progress logging
- the exact blocked stop condition and what evidence to report

Prefer this pattern:

```text
<desired end state>, verified by <specific evidence>, while preserving <constraints>. Use <allowed inputs, tools, or boundaries>. Between iterations, <how to choose and record the next best action>. If blocked or no valid paths remain, stop with <attempted paths, evidence gathered, blocker, and next input needed>.
```

For implementation Goals, include exact commands when known:

```text
<desired end state>, verified by `<test or build command>` and <artifact/manual check>, while preserving <constraints>. First inspect <files/docs/logs>. Work in checkpoints: after each change, run the narrowest relevant verification, record the result, and choose the next smallest defensible step. Stop only when the verification passes, or stop blocked with the failed command output, attempted paths, and the missing input needed.
```

## Completion And Blocking

Completion must be evidence-based. Compare the active Goal to concrete evidence in the thread: changed files, command output, tests, benchmarks, generated artifacts, logs, screenshots, or source-backed research findings.

Do not mark a Goal complete because the work seems likely done, because a budget is exhausted, or because no more work is planned. Only mark it complete after verifying the stated stopping condition.

Only mark a Goal blocked when the stated blocker has repeated enough that no meaningful progress is possible without user input or an external change. Report the attempted paths, gathered evidence, exact blocker, and input needed.
