---
name: use-delegate
description: "Delegation mode: the host agent (Claude or Codex) plans and reviews while heavy work runs on cheap executors: OpenCode Kimi K3, Codex GPT-5.6 terra/sol. Use when the user invokes /use-delegate, says 'use delegate', 'delegate mode', 'orchestrator mode', or wants to save tokens/rate limits."
---

# Use Delegate

The host agent (Claude Code or Codex, whichever is running this skill) is the thinker, never the typist. Its tokens are scarce; the executors below are cheap and steerable. The host decides **what** to do and judges **whether it was done well**: everything token-hungry runs elsewhere and reports back.

## Core rule

The host does not execute. It may: read a few targeted files, search, inspect git state, think, plan, decompose, write specs and delegation prompts, review diffs and reports, judge outputs, and talk to the user.

The host must NOT directly do:

- Implementation, refactors, migrations, test writing (any multi-file or >~15-line change)
- Codebase-wide exploration or analysis (reading many files to "understand")
- Computer use, browser automation, UI/UX verification
- Log triage, data analysis, bulk mechanical edits
- Running long build/test loops and reading their full output

The only direct edits allowed: trivial single-file tweaks (a config value, a typo, a one-liner) where writing a delegation prompt would cost more than the edit itself.

## Executors

| Executor | Command | Use for |
|---|---|---|
| OpenCode · Kimi K3 | `opencode run "<prompt>" -m kimi-for-coding/k3` | Default general executor: implementation, refactors, tests, bulk edits |
| Codex · GPT-5.6 terra (high) | `codex exec -m gpt-5.6-terra "<prompt>"` | Low-stakes tasks: mechanical edits, scripts, quick investigations, log triage |
| Codex · GPT-5.6 sol (high) | `codex exec "<prompt>"` (config default = sol + high) | Compute-heavy tasks: hard bugs, migrations, architecture-sensitive changes, computer use / UI verification |
| Host-native subagents | Claude `Agent` tool / Codex collab threads | Exploration summaries the host plans from; taste-sensitive work (UI, copy, API design) |

Read-only investigation: `codex exec -s read-only`, `opencode run --agent plan` (built-in read-only agent).

Model rankings move fast: current DeepSWE scores, API pricing, and the refresh protocol live in `references/models.md`. Check its `Last verified` date before planning a big batch; if older than 14 days, delegate a refresh first (DeepSWE leaderboard + pricing pages), never guess rankings from memory.

## Invocation mechanics

Both CLIs: always end the command with `< /dev/null` and run in background (codex hangs forever on open stdin: full codex mechanics in `~/.claude/rules/launch-codex.md`).

**Codex** (background):

```bash
codex exec -C <repo-root> -m gpt-5.6-terra \
  --output-last-message <scratchpad>/codex-<task>.md \
  "<self-contained prompt>" < /dev/null
```

Effort override: `-c model_reasoning_effort=high`. Non-git dir: `--skip-git-repo-check`.

**OpenCode** (background):

```bash
opencode run "<self-contained prompt>" \
  -m kimi-for-coding/k3 --title "<task>" \
  > <scratchpad>/oc-<task>.log 2>&1 < /dev/null
```

- Final answer = tail of the log; `--format json` for machine-readable events.
- Steer or continue a session: `opencode run -s <sessionID> "<follow-up>"`.
- Standalone specialized agent: `--agent <name>`: the `~/.config/opencode/agent/` roster (worker, explore-fast, verifier, snipper, code-reviewer…) runs standalone with any `-m` model.
- Permissions are pre-allowed in the user config (build agent allows all); no interactive prompt will block a non-interactive run.

## Batch / multi-process

- **Parallel processes** (verified): launch N independent `opencode run` / `codex exec` in background; each opencode run spins up its own server + session, results stay isolated.
- **Shared server** for large batches: `opencode serve --port <p>` once, then N × `opencode run --attach http://localhost:<p> --dir <workdir> ...`: one server, many sessions, less startup overhead. Kill the serve process when done.
- **In-executor subagents**: Kimi in opencode spawns its own task-tool subagents; codex spawns collab threads (config caps 6). Prefer one executor process per independent task over one giant prompt.

## The loop

1. **Think.** Understand the request. Missing context → delegate the exploration, think on the summaries.
2. **Spec.** Write a self-contained delegation prompt: exact files, goal, constraints, and what "done" looks like (tests pass, lint clean, behavior X). The executor can't see this conversation: spell everything out.
3. **Delegate.** Fire independent tasks in parallel in background. Stay available to steer.
4. **Verify.** Delegate verification too: read-only pass, test run, or `verifier` agent. The host reads the report and the diff, not the whole tree.
5. **Judge.** Output misses the bar → refine the spec and re-delegate (better prompts beat manual fixes). Escalate terra → Kimi K3 → sol → host-native only when the cheaper tier keeps failing.

## Delegation prompt checklist

- Names exact files/paths and the repo root
- States the goal in one sentence, then constraints (style, deletion safety: `trash` not `rm -rf`, no scope creep)
- Defines done: commands to run, expected results
- Asks for a report: changed files, what was done, tests run, risks

## Anti-patterns

- "It's faster if I just do it": beyond a trivial tweak it isn't, and it burns the budget the whole session depends on.
- Reading 10 files to plan: delegate exploration, plan from the summary.
- Fixing an executor's output by hand: refine the prompt and rerun.
- Serializing independent delegations: parallelize.
- Escalating everything to sol or the host: terra and Kimi K3 handle most well-spec'd work.

If no delegation path works (CLIs unavailable, Bash denied), say so explicitly and ask the user before falling back to direct execution: never silently drop out of the mode.
