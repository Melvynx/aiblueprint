# OpenAI Codex Hooks

Codex implements Claude-style lifecycle hooks behind the `CodexHooks` feature. It discovers hook configuration from its config layers, including user-level `~/.codex/hooks.json` and project-level `.codex/hooks.json`. The current upstream runtime declares these event names: `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `SubagentStart`, `SubagentStop`, and `Stop`.

The config uses Claude-style `hooks` JSON with matcher groups and handlers. Handlers can include command, prompt, or agent declarations in the upstream schema. Keep the policy script portable and adapt field names at the boundary. Validate JSON before starting a session and restart Codex after changing hook configuration when the running session does not reload it.

Matchers are meaningful for `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `SessionStart`, `SessionEnd`, `SubagentStart`, and `SubagentStop`. They are not meaningful for `UserPromptSubmit` and `Stop`.

Operational checks:

1. Confirm the active config layer and project root.
2. Check the installed Codex version and hook schema.
3. Validate `hooks.json` with `jq`.
4. Run the smallest safe lifecycle/tool event and inspect the hook log.
5. Re-test from a normal repository and a git worktree; project hook discovery can differ by version.

Codex uses the same event names as Claude in `hooks.json`, but feature availability and output behavior are versioned. Do not assume Claude-only environment variables or a Claude exit-code path; inspect the installed schema/runtime and write a Codex-native adapter.

Official sources:

- https://github.com/openai/codex/tree/main/codex-rs/hooks
- https://github.com/openai/codex/blob/main/codex-rs/hooks/src/lib.rs
- https://github.com/openai/codex/blob/main/codex-rs/features/src/lib.rs
