---
name: hooks-manager
description: Create, edit, configure, and debug Claude Code hooks. Use when working with hooks, event listeners, command validation, automated workflows, notifications, or hook events such as PreToolUse, PostToolUse, Stop, SessionStart, and UserPromptSubmit.
---

# Hooks Manager

Configure Claude Code hooks as event-driven commands or prompts. Use hooks for validation, logging, formatting, notifications, context injection, and bounded completion checks.

## Quick workflow

1. Identify the scope: project `.claude/hooks.json` or user `~/.claude/hooks.json`.
2. Select the event (`PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`, `PreCompact`, or `Notification`).
3. Choose a command hook for deterministic shell logic, or a prompt hook when natural-language reasoning is required.
4. Add a regex matcher for the tools that should trigger it.
5. Validate the JSON with `jq` and test with `claude --debug`.

## Hook shape

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "./.claude/hooks/check.sh", "timeout": 30000 }
        ]
      }
    ]
  }
}
```

Command hooks receive JSON on stdin and may return JSON on stdout. Prompt hooks receive `#$ARGUMENTS` and should return a structured decision. Blocking hooks use `{"decision":"block","reason":"..."}`; non-blocking hooks may return a `systemMessage`.

## Safety requirements

- Check `stop_hook_active` in `Stop` and `SubagentStop` hooks to prevent recursive blocking.
- Set reasonable timeouts, especially for external commands.
- Use `$CLAUDE_PROJECT_DIR` or another trusted absolute path for scripts.
- Validate hook JSON with `jq` before relying on it.
- Keep blocking rules selective so normal work is not accidentally interrupted.
- Ensure referenced scripts are executable.

## References

- `references/hook-types.md`: events, input/output, and blocking behavior.
- `references/command-vs-prompt.md`: choose command versus prompt hooks.
- `references/matchers.md`: regex and MCP matcher patterns.
- `references/input-output-schemas.md`: event schemas and response fields.
- `references/examples.md`: notifications, logging, formatting, tests, and safety examples.
- `references/troubleshooting.md`: debug, JSON, matcher, permission, and timeout checks.
