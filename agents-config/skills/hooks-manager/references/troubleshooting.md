# Troubleshooting

1. Run the target agent's debug/diagnostic mode and confirm the event and matcher were found (`claude --debug` for Claude Code).
2. Check the platform reference for the config location: Claude settings, `.codex/hooks.json`, `~/.codex/hooks.json`, `.cursor/hooks.json`, or `~/.cursor/hooks.json`.
3. Validate the target JSON file with `jq`.
4. Confirm matcher case and regex escaping; `bash` does not match `Bash`.
5. Run command hooks directly with representative JSON on stdin.
6. Check script permissions, dependencies such as `jq`, trusted paths, and timeout values.

If a Stop hook blocks repeatedly, inspect `stop_hook_active` and return an allow/no-decision response when it is true.
