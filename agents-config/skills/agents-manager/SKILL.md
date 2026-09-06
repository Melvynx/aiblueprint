---
name: agents-manager
description: Create, edit, debug, and orchestrate Claude Code agents and Task-tool workflows. Use when writing agent files, configuring tools or models, or debugging multi-agent runs.
disable-model-invocation: true
user-invocable: true
---

Create or edit an agent only when the work is autonomous, non-interactive, and returns one final report. Keep requirements, options, and confirmations in the main chat. Agents cannot use `AskUserQuestion` or wait on the user.

Project agents live in `.claude/agents/` and override `~/.claude/agents/`. Name is unique kebab-case. Description states when to invoke it. `tools` is a comma list or omitted to inherit all. `model` is `sonnet`, `opus`, `haiku`, or `inherit`.

Write the body as XML (`<role>`, `<constraints>`, `<workflow>`, `<output_format>`) with no markdown headings. Restrict tools to least privilege. Add `Skill` when the agent must call `$find-docs` or `$exa-search`; add `Bash` when those skills need local CLIs. Never put secrets in external queries.

- Create or rewrite a prompt: [writing-agent-prompts.md](references/writing-agent-prompts.md), then [agents.md](references/agents.md) for file format, tools, models, and Task invocation.
- Edit config, tools, model, or Task / `run_in_background` / `resume`: [agents.md](references/agents.md).
- Debug a failing or looping agent: [debugging-agents.md](references/debugging-agents.md).
- Multi-agent coordination: [orchestration-patterns.md](references/orchestration-patterns.md).
- Recovery, retries, communication: [error-handling-and-recovery.md](references/error-handling-and-recovery.md).
- Long-running context: [context-management.md](references/context-management.md).
- Eval before trusting a new agent: [evaluation-and-testing.md](references/evaluation-and-testing.md).

Prefer `/agents` to create or delete; otherwise edit the markdown file directly.

Stop when the agent has valid frontmatter, an XML body, least-privilege tools, a trigger-ready description, and a model that matches the task. Test on a representative task before claiming it works.
