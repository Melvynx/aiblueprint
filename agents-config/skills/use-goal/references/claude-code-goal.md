# Claude Code Goal Reference

Use this reference when the active agent is Claude Code.

Official reference: https://code.claude.com/docs/en/goal

Claude Code uses `/goal` to set a completion condition for the current session. `/goal <condition>` starts Goal mode, `/goal` shows its state, and `/goal clear` removes it. Only one Goal can be active per session.

The condition must describe one measurable end state and the proof Claude must surface in the transcript. Include constraints, the files or logs to inspect first, checkpoint reporting, and a bounded blocked stop clause when useful. Goal conditions can be up to 4,000 characters.

If the harness cannot dispatch slash commands, output the exact `/goal ...` command and ask the user to paste it manually. Do not replace it with a task list or call `/goal` Claude-only.

Prefer:

```text
/goal <desired end state>, verified by <proof surfaced in the transcript>, while preserving <constraints>. First inspect <files/docs/logs>. After each turn, report the checkpoint, command result, remaining gap, and next smallest step. Stop when the proof is present, or after <bound> with attempted paths, evidence, blocker, and needed input.
```
