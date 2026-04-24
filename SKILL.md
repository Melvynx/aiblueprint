---
name: aiblueprint-cli
description: "Set up and configure AIBlueprint CLI for enhanced agent workflows — installs security hooks, custom commands, statusline, and shell shortcuts. Use when the user asks to set up aiblueprint, configure agent tools, install CLI hooks, or run the aiblueprint setup command."
user-invocable: true
triggers:
  - aiblueprint
  - setup cli
  - install hooks
  - configure agent
---

# AIBlueprint CLI Setup

Run the AIBlueprint CLI to configure agent workflows with security hooks, custom commands, statusline, and shell shortcuts.

## When to Use

Use when setting up a new development environment with AIBlueprint, adding security hooks, configuring the statusline, or installing custom commands for agent-assisted workflows.

## Instructions

1. **Run setup** (interactive by default):
   ```bash
   npx aiblueprint-cli@latest claude-code setup
   ```
   Or skip prompts with `--skip` for all features, or `--folder <path>` for a custom install location.

2. **Verify installation**: Check that `~/.claude/` contains the expected config files (hooks, commands, agents, statusline scripts).

3. **Test statusline** (if enabled):
   ```bash
   npx aiblueprint-cli@latest claude-code statusline --list
   ```

4. **Run tests** to confirm nothing broke:
   ```bash
   bun test:run
   ```

## Rules

- NEVER run `setup` with `--skip` unless the user explicitly asks for non-interactive mode
- ALWAYS verify the target folder exists before running setup
- If the user has existing `~/.claude/` config, warn before overwriting
