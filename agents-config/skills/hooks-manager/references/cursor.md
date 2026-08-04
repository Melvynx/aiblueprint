# Cursor Hooks

Cursor hooks are configured in `.cursor/hooks.json` for a project or `~/.cursor/hooks.json` for the user. The official Cursor hooks surface includes lifecycle/tool events such as `sessionStart`, `sessionEnd`, `preCompact`, `stop`, `beforeSubmitPrompt`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart`, `subagentStop`, and `workspaceOpen`; the exact set can evolve by Cursor IDE/CLI version.

Use a command script that reads JSON from stdin and emits the Cursor-native response. The config normally includes a top-level `version` and an event-to-handler map, for example `{ "version": 1, "hooks": { "preToolUse": [{ "command": "./.cursor/hooks/check.sh", "timeout": 5 }] } }`. Keep the shared policy separate from the adapter. Cursor uses camelCase lifecycle names and can use response fields such as `followup_message` rather than Claude’s `decision` contract.

Validation checklist:

1. Confirm the hook file is in `.cursor/hooks.json` or `~/.cursor/hooks.json`.
2. Confirm the event and payload keys against the installed Cursor version.
3. Run the hook script directly with a fixture payload.
4. Trigger the smallest safe edit/tool flow and verify the log or follow-up output.
5. Treat beta behavior, tool-specific gaps, and unsupported blocking/context-injection events as `NOT VERIFIABLE` until a live Cursor run proves them.

Cursor references:

- https://cursor.com/docs/hooks
- https://cursor.com/changelog/1-7
