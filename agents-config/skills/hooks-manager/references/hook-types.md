# Hook Types and Events

| Event | Fires | Can block? |
| --- | --- | --- |
| `PreToolUse` | Before a tool runs | Yes |
| `PostToolUse` | After a tool completes | No |
| `UserPromptSubmit` | When the user submits a prompt | Yes |
| `Stop` / `SubagentStop` | Before an agent stops | Yes |
| `SessionStart` / `SessionEnd` | At session boundaries | No |
| `PreCompact` | Before context compaction | Yes |
| `Notification` | When Claude needs input | No |

Blocking responses should include `decision: "block"` and a useful `reason`. Stop hooks must honor `stop_hook_active` to avoid infinite loops.
