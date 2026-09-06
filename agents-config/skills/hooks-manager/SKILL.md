---
name: hooks-manager
description: Create, edit, configure, and debug hooks for Claude Code, Codex, and Cursor. Use for lifecycle events, command validation, routing shared hooks, notifications, automation, or platform-specific hook configuration.
disable-model-invocation: true
---

Configure Claude Code, Codex, and Cursor hooks as event-driven commands or prompts. Treat platform syntax as distinct.

1. Identify the platform and load [router.md](references/router.md).
2. Load the platform file: [claude-code.md](references/claude-code.md), [codex.md](references/codex.md), or [cursor.md](references/cursor.md).
3. Pick the scope, file path, lifecycle event, and a command hook (deterministic) or prompt hook (reasoning, if supported).
4. Validate the native config and run the platform smoke check.

Across agents, keep one portable script plus a small adapter per platform. Report unsupported features.

Load as needed: [hook-types.md](references/hook-types.md), [command-vs-prompt.md](references/command-vs-prompt.md), [matchers.md](references/matchers.md), [input-output-schemas.md](references/input-output-schemas.md), [examples.md](references/examples.md), [troubleshooting.md](references/troubleshooting.md).

Check `stop_hook_active` on Stop/SubagentStop. Use trusted absolute paths, timeouts, and `jq` validation. Keep blocking rules selective.
