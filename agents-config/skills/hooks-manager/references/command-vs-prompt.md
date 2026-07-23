# Command vs Prompt Hooks

Use command hooks for deterministic, fast work: file checks, regex validation, formatters, linters, logs, and notifications. They receive JSON through stdin and may emit JSON through stdout.

Use prompt hooks when the decision requires semantic or natural-language reasoning. They are slower and consume model/API budget. Include `#$ARGUMENTS` and specify the exact JSON response shape.

```json
{
  "type": "prompt",
  "prompt": "Evaluate this change: #$ARGUMENTS\nReturn {\"decision\":\"approve\" or \"block\",\"reason\":\"...\"}"
}
```
