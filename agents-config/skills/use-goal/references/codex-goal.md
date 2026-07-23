# Codex Goal Reference

Use this reference when the active agent is OpenAI Codex.

Official references:

- https://developers.openai.com/codex/use-cases/follow-goals
- https://developers.openai.com/codex/app/commands
- https://developers.openai.com/codex/cli/slash-commands

`/goal <objective>` starts Goal mode. `/goal` views the current Goal. `/goal pause`, `/goal resume`, and `/goal clear` manage lifecycle. Objectives must be non-empty and at most 4,000 characters.

When Goal tools are available, call `get_goal` before lifecycle actions and create a new Goal only when the user explicitly asks and no active Goal exists. Do not overwrite an existing Goal without explicit permission. If Goals are unavailable, tell the user to enable `[features] goals = true` or run `codex features enable goals`.

A strong Goal defines one objective and stopping condition, initial files/docs, exact proof commands or artifacts, non-regression constraints, checkpoint behavior, and the evidence to report if blocked.
