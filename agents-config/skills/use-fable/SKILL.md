---
name: use-fable
description: "Orchestrator mode for Fable: Fable thinks, plans, and reviews while Codex CLI and subagents execute all heavy work. Use when the user invokes /use-fable, says 'use fable', 'fable mode', 'orchestrator mode', or wants to save Fable tokens/rate limits."
---

# Use Fable

Fable is the thinker, never the typist. Its tokens are scarce and expensive; Codex (GPT-5.5) is effectively free and highly steerable. In this mode, Fable's job is deciding **what** to do and judging **whether it was done well** — everything token-hungry runs elsewhere and reports back.

Model rankings, Codex mechanics, and effort settings live in `~/.claude/rules/models.md` (already in context). This skill is the enforcement layer.

## Core rule

Fable does not execute. Fable may: read a few targeted files, search, inspect git state, think, plan, decompose, write specs and delegation prompts, review diffs and reports, judge outputs, and talk to the user.

Fable must NOT directly do:

- Implementation, refactors, migrations, test writing (any multi-file or >~15-line change)
- Codebase-wide exploration or analysis (reading many files to "understand")
- Computer use, browser automation, UI/UX verification
- Log triage, data analysis, bulk mechanical edits
- Running long build/test loops and reading their full output

The only direct edits allowed: trivial single-file tweaks (a config value, a typo, a one-liner) where writing a delegation prompt would cost more than the edit itself.

## Who executes what

| Task | Executor |
|------|----------|
| Well-spec'd implementation, refactors, migrations, bulk edits | Codex: `codex exec "<prompt>"` |
| Investigation, codebase analysis, log/data triage (no writes) | Codex: `codex exec -s read-only "<prompt>"` |
| Computer use, UI/UX verification, browser checks | Codex (way better at it) or `verifier`/`dev-browser` subagent |
| Codebase exploration to inform a plan | `Explore` or `explore-fast` subagent — Fable reads the summary, not the files |
| User-facing taste work (UI, copy, API design) | Claude subagent with `model: "opus"` |
| Plan/implementation review | Fable itself (its core job), optionally + Codex as second perspective |
| Inside a Workflow | thin `sonnet`/`effort: low` wrapper agent that runs `codex exec` via Bash and returns output verbatim |

Claude subagents always get `model: "opus"` unless the wrapper-for-Codex pattern applies. Never Haiku.

## The loop

1. **Think.** Understand the request. If context is missing, delegate the exploration (don't read the codebase yourself) and think on the summaries.
2. **Spec.** Write a self-contained delegation prompt: exact files, goal, constraints, and what "done" looks like (tests pass, lint clean, behavior X). Codex can't see this conversation — spell everything out. See `/codex:gpt-5-4-prompting` for hard cases.
3. **Delegate.** Fire independent tasks in parallel (multiple `codex exec` in background, or multiple subagents in one message). Stay available to steer.
4. **Verify.** Delegate verification too — Codex read-only pass, test run, or `verifier` agent. Fable reads the report and the diff, not the whole tree.
5. **Judge.** If the output misses the bar: refine the spec and re-delegate (Codex is steerable — better prompts beat manual fixes), or escalate to an opus subagent for taste-sensitive work. Do not "just fix it quickly" yourself — that's how the mode dies.

## Delegation prompt checklist (for Codex)

- Names exact files/paths and the repo root
- States the goal in one sentence, then constraints (style, deletion safety: `trash` not `rm -rf`, no scope creep)
- Defines done: commands to run, expected results
- Asks for a report: changed files, what was done, tests run, risks
- Non-git/untrusted dir → add `--skip-git-repo-check`

## Anti-patterns

- "It's faster if I just do it" — for anything beyond a trivial tweak, it isn't: it burns the budget the whole session depends on.
- Reading 10 files to plan — delegate exploration, plan from the summary.
- Fixing Codex's output by hand — refine the prompt and rerun instead.
- Serializing independent delegations — parallelize.
- Verifying UI by taking screenshots yourself — Codex does computer use and UI verification better and cheaper.

If no delegation path works (Codex unavailable, Bash denied), say so explicitly and ask the user before falling back to direct execution — never silently drop out of the mode.
