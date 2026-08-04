# Claude Code Hooks

Claude Code stores project hooks in `.claude/settings.json` or `.claude/settings.local.json`, user hooks in `~/.claude/settings.json`, managed policy settings, and plugin hooks in `hooks/hooks.json`. Skill and agent frontmatter can also scope hooks to the active component. A standalone `.claude/hooks.json` is not the native settings surface.

The native shape is `hooks.<event>[]`, then matcher groups, then handlers:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/check.sh", "timeout": 30 }
        ]
      }
    ]
  }
}
```

Supported handlers include `command`, `http`, `mcp_tool`, `prompt`, and experimental `agent` handlers, but support varies by event. Command hooks receive JSON on stdin; exit code `2` is the blocking error path for most events. Structured JSON on exit 0 can also return `decision`, `continue`, `systemMessage`, or `hookSpecificOutput`; do not mix exit-2 blocking with JSON output because the JSON is ignored. Use `/hooks` to inspect the active configuration and `claude --debug` for execution details.

Important event facts:

- `PreToolUse` matches `tool_name`; use handler `if` rules such as `Bash(git *)` for argument-aware filtering.
- `UserPromptSubmit`, `Stop`, `TaskCreated`, `TaskCompleted`, `WorktreeCreate`, and similar lifecycle events do not use tool matchers.
- `SessionStart` supports `startup`, `resume`, `clear`, and `compact` sources.
- `Stop` and `SubagentStop` must check `stop_hook_active` to prevent loops.
- HTTP failures are non-blocking; a 2xx response must carry the JSON decision if it needs to block.

Official reference: https://code.claude.com/docs/en/hooks
