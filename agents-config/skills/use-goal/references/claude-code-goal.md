# Claude Code Goal Reference

Use this reference when the active agent is Claude Code.

Official reference:

- https://code.claude.com/docs/en/goal

## Manual Activation

Claude Code has `/goal`, but the model cannot launch it unless the harness exposes a slash-command dispatch tool. If no dispatch tool is available, output the exact `/goal ...` command, ask the user to paste/run it manually, and wait for confirmation before continuing Goal-driven work.

Do not say Claude Code lacks `/goal`. Do not call `/goal` Codex-only. Do not replace `/goal` with a task list, TODO list, or goal file and describe it as equivalent. Those can be supporting artifacts only when the user asks for them or when they are useful after the manual `/goal` command has been provided.

If the user asks to continue without manually pasting the command, continue normal work only after acknowledging that no Claude Code Goal is active.

## Command Surface

Claude Code uses `/goal` to set a completion condition for the current session.

- `/goal <condition>` sets the Goal and immediately starts a turn using the condition as the directive.
- `/goal` with no argument shows the current state, evaluated turns, token spend, and latest evaluator reason.
- `/goal clear` removes the active Goal before it is met.
- `stop`, `off`, `reset`, `none`, and `cancel` are aliases for `clear`.
- `/clear` starts a new conversation and removes any active Goal.
- `claude -p "/goal <condition>"` can run a Goal non-interactively until the condition is met or the process is interrupted.

Only one Goal can be active per Claude Code session. Setting a new `/goal <condition>` replaces the active Goal. Do not overwrite an existing Goal unless the user explicitly asks to replace it.

If an active Goal existed when a Claude Code session ended, it is restored on `--resume` or `--continue`; the condition carries over, but the timer, turn count, and token-spend baseline reset.

## Requirements

Claude Code `/goal` requires Claude Code v2.1.139 or later.

It only runs in trusted workspaces because it uses the hooks system. It is unavailable when hooks are disabled through `disableAllHooks` or restricted through `allowManagedHooksOnly`; Claude Code should explain that condition when the command fails.

## Evaluator Behavior

Claude Code evaluates the Goal after each turn with a separate small fast model. A "no" result starts another turn and passes the evaluator reason as guidance. A "yes" result clears the Goal and records the achieved condition in the transcript.

The evaluator does not call tools, read files, or run commands independently. It judges only the condition and what Claude has surfaced in the conversation so far. Therefore the Goal must require Claude to put the proof in the transcript.

Good Claude Code Goal conditions include:

- one measurable end state, such as a passing test, clean build, target count, or empty queue
- a stated check, such as a command exiting `0`, a generated report, or a reviewed artifact
- constraints that matter, such as files not to modify or behavior not to regress
- a bounded stop clause when useful, such as "or stop after 20 turns with the remaining blocker"

Goal conditions can be up to 4,000 characters. If the instructions are longer, put details in a file and make the Goal point to that file.

## Claude Code Draft Pattern

Prefer this pattern:

```text
/goal <desired end state>, verified by <proof Claude must surface in the transcript>, while preserving <constraints>. First inspect <files/docs/logs>. After each turn, report the current checkpoint, command/artifact result, remaining gap, and next smallest step. Stop when the proof is in the transcript, or after <bound> with attempted paths, evidence, blocker, and needed input.
```

For test or build work:

```text
/goal <desired end state>, verified by `<test/build command>` exiting 0 with the relevant output included in the transcript, while preserving <constraints>. First inspect <files/logs>. After each turn, rerun the narrowest relevant check and summarize the result. Stop only when the command output proves success, or stop after <bound> with the failing output, attempted fixes, and missing input.
```
