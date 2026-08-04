---
name: step-00b-interactive
description: Configure APEX intent policies interactively when the user requests the menu.
---

# Interactive policy configuration

Show the current policy values, then ask only about policies the user wants to change:

- interaction: `standard` or `low`;
- review: `risk-based` or `adversarial`;
- artifacts: `minimal` or `verbose`;
- test authoring: `risk-based`, `on`, or `off`;
- proof: `risk-based` or `runtime`;
- budget: `low` or `standard`;
- orchestration: `auto`, `prefer-parallel`, or `direct`;
- delivery: branch and pull-request requests.

Explain that implementation autonomy does not silently authorize unrelated Git, deployment, provider, or communication actions.

Apply the selected policies, set `{interactive_applied}=true`, and return to `step-00-init.md` for the remaining policy routes.
