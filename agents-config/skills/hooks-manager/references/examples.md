# Hook Examples

Log Bash commands:

```json
{"type":"command","command":"jq -r '.tool_input.command' >> ~/.claude/bash-log.txt"}
```

Format files after edits:

```json
{"type":"command","command":"prettier --write \"$CLAUDE_PROJECT_DIR\"","timeout":10000}
```

Block destructive commands with a `PreToolUse` prompt hook, or run a test-checking command on `Stop`. Keep examples scoped to the project and validate the resulting JSON with `jq`.
