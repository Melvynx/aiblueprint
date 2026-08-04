# Shared Hook Concepts

These are semantic concepts, not a universal schema. Use the platform references for the exact event spelling and blocking contract.

| Event | Fires | Can block? |
| --- | --- | --- |
| `PreToolUse` | Before a tool runs | Yes |
| `PostToolUse` | After a tool completes | No |
| `UserPromptSubmit` | When the user submits a prompt | Yes |
| `Stop` / `SubagentStop` | Before an agent stops | Yes |
| `SessionStart` / `SessionEnd` | At session boundaries | No |
| `PreCompact` | Before context compaction | Yes |
| `Notification` / native notification event | When the agent needs input | Usually no |

Blocking responses must use the target platform's contract. Claude/Codex commonly use `decision` and `reason`; Cursor may use a native follow-up or approval field. Stop hooks must honor the target platform's loop-prevention field, such as Claude's `stop_hook_active`.
