# Troubleshooting

1. Run `claude --debug` and confirm the event and matcher were found.
2. Check the config location: `.claude/hooks.json`, `~/.claude/hooks.json`, or the plugin hook file.
3. Validate syntax with `jq . .claude/hooks.json`.
4. Confirm matcher case and regex escaping; `bash` does not match `Bash`.
5. Run command hooks directly with representative JSON on stdin.
6. Check script permissions, dependencies such as `jq`, trusted paths, and timeout values.

If a Stop hook blocks repeatedly, inspect `stop_hook_active` and return an allow/no-decision response when it is true.
