# Hook Router

Use this routing table before editing a hook:

| Target | Project scope | User scope | Load |
| --- | --- | --- | --- |
| Claude Code | `.claude/settings.json` or `.claude/settings.local.json` | `~/.claude/settings.json` | `claude-code.md` |
| Codex | `.codex/hooks.json` | `~/.codex/hooks.json` | `codex.md` |
| Cursor | `.cursor/hooks.json` | `~/.cursor/hooks.json` | `cursor.md` |

## Shared intent mapping

| Intent | Claude Code | Codex | Cursor |
| --- | --- | --- | --- |
| before a tool | `PreToolUse` | `PreToolUse` | `preToolUse` |
| permission request | `PermissionRequest` | `PermissionRequest` | native permission event if available |
| after a tool | `PostToolUse` | `PostToolUse` | `postToolUse` |
| prompt submitted | `UserPromptSubmit` | `UserPromptSubmit` | `beforeSubmitPrompt` |
| compaction | `PreCompact` / `PostCompact` | `PreCompact` / `PostCompact` | `preCompact` |
| agent/session finished | `Stop`, `SubagentStop`, `SessionEnd` | `Stop`, `SubagentStop`, `SessionEnd` | `stop`, `subagentStop`, `sessionEnd` |

The mapping is semantic, not a copy/paste schema. Read the platform reference and inspect the installed version before writing config. If an event or response field is not supported, use a portable command that logs/observes instead of claiming it can block.

## Portable adapter pattern

Keep policy logic in one executable that accepts JSON and emits a small internal decision. Add thin platform adapters for field extraction and response formatting:

```text
platform hook -> adapter -> shared policy -> adapter response
```

Use platform-native config files and paths. Never make a hook depend on a Claude-only variable such as `$CLAUDE_PROJECT_DIR` without providing a fallback for Codex and Cursor.
