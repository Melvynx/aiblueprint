# Hook Documentation Sources

This reference records the first-party sources used to maintain the platform references. Re-check them when a platform version changes.

## Claude Code

- [Hooks reference](https://code.claude.com/docs/en/hooks): configuration scopes, matcher behavior, events, handler types, input/output, exit codes, HTTP/MCP hooks, `/hooks`, and debugging.
- [Hooks guide](https://code.claude.com/docs/en/hooks-guide): practical setup, stdin/stdout behavior, and common workflows.

## OpenAI Codex

- [Codex hook runtime](https://github.com/openai/codex/tree/main/codex-rs/hooks): upstream hook implementation and schema modules.
- [Hook event declarations](https://github.com/openai/codex/blob/main/codex-rs/hooks/src/lib.rs): current event names and matcher-capable event list.
- [Codex feature flags](https://github.com/openai/codex/blob/main/codex-rs/features/src/lib.rs): the `CodexHooks` feature declaration.
- [Codex configuration](https://github.com/openai/codex/blob/main/docs/config.md): managed-hook policy controls.

## Cursor

- [Cursor hooks](https://cursor.com/docs/hooks): native hook configuration and current platform behavior.
- [Cursor Hooks beta announcement](https://cursor.com/changelog/1-7): hooks for auditing, blocking commands, and extending the Agent loop.
- [Cursor hook catalog](https://cursor.com/marketplace/hooks/pretooluse): first-party marketplace visibility for supported hook events.

## Router policy

The router treats event names and response fields as platform contracts. Shared logic can be reused, but every adapter must be validated against the target agent's current docs, installed version, and one safe live event.
