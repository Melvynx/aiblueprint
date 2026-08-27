---
name: hooks-manager
description: Create, edit, configure, and debug hooks for Claude Code, Codex, and Cursor. Use for lifecycle events, command validation, routing shared hooks, notifications, automation, or platform-specific hook configuration.
disable-model-invocation: true
---

# Hooks Manager

Configure Claude Code, Codex, and Cursor hooks as event-driven commands or prompts. Use hooks for validation, logging, formatting, notifications, context injection, and bounded completion checks. Treat platform syntax and capabilities as distinct; do not copy a Claude configuration into Codex or Cursor without adapting it.

## Quick workflow

1. Identify the target platform and load `references/router.md`.
2. Load the platform reference: `claude-code.md`, `codex.md`, or `cursor.md`.
3. Identify the scope and file path for that platform.
4. Select a supported lifecycle event and adapt the shared payload/decision contract.
5. Choose a command hook for deterministic shell logic, or a prompt hook when natural-language reasoning is required and the platform supports it.
6. Validate the native config and run the platform-specific smoke check.

## Claude-shaped example

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

## Shared router

When the user asks for a hook that should work across agents, define one portable script with a small adapter per platform. Keep platform-specific event names, input fields, output decisions, exit codes, timeouts, and config paths in the references rather than pretending the formats are identical. Report unsupported features explicitly.

## References

- `references/router.md`: select a platform, map shared lifecycle intent, and avoid unsupported assumptions.
- `references/claude-code.md`: Claude settings, events, handlers, and `/hooks` verification.
- `references/codex.md`: Codex config layers, `hooks.json`, trust, and restart/worktree caveats.
- `references/cursor.md`: Cursor `.cursor/hooks.json`, hook scripts, and native response mapping.
- `references/research-sources.md`: first-party documentation sources and refresh policy.
- `references/hook-types.md`: shared event concepts, input/output, and blocking behavior.
- `references/command-vs-prompt.md`: choose command versus prompt hooks.
- `references/matchers.md`: regex and MCP matcher patterns.
- `references/input-output-schemas.md`: event schemas and response fields.
- `references/examples.md`: notifications, logging, formatting, tests, and safety examples.
- `references/troubleshooting.md`: debug, JSON, matcher, permission, and timeout checks.
