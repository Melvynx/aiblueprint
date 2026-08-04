# Input and Output Schemas

Claude and Codex commonly provide `session_id`, `transcript_path`, `cwd`, `permission_mode`, and `hook_event_name`. Tool events commonly include `tool_name` and `tool_input`; prompt submission commonly includes `prompt`. Cursor payloads and response fields are platform-specific and must be checked against its current docs.

Claude/Codex-style blocking output:

```json
{"decision":"block","reason":"Explain what must change"}
```

Non-blocking output may include `systemMessage` and `suppressOutput`. `PreToolUse` may additionally return `permissionDecision` and `updatedInput`. `Stop` may return `continue: true` and should not block when `stop_hook_active` is true.
