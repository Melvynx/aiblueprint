---
name: step-00b-economy
description: Apply a low-budget APEX policy without weakening safety, scope control, or minimum evidence.
---

# Low-budget policy

`-e` sets `{budget_policy}` to `low`.

- Keep analysis narrow: inspect the most relevant files and commands first.
- Prefer the main agent for tightly coupled work.
- Use at most one subagent at a time, and only when separate context avoids greater cost or provides independent review.
- Prefer targeted checks before broad suites; run broader checks when risk or project rules require them.
- Summarize large outputs into artifacts and keep only decisive evidence in context.
- Use the harness-selected model unless a cheaper role-specific route is available and adequate.
- Stop expanding exploration after the task contract is supported by sufficient evidence.

Low budget never relaxes authority, secret handling, destructive-action boundaries, introduced-regression handling, or required proof.

Set `{budget_policy}=low` and `{budget_applied}=true`, then return to `step-00-init.md`.
