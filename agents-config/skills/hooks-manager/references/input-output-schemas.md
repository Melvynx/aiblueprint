# Input and Output Schemas

Common hook input includes `session_id`, `transcript_path`, `cwd`, `permission_mode`, and `hook_event_name`. Tool events also include `tool_name` and `tool_input`; prompt submission includes `prompt`.

Blocking output:

```json
{"decision":"block","reason":"Explain what must change"}
```

Non-blocking output may include `systemMessage` and `suppressOutput`. `PreToolUse` may additionally return `permissionDecision` and `updatedInput`. `Stop` may return `continue: true` and should not block when `stop_hook_active` is true.
