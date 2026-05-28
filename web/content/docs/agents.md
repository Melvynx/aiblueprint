---
title: Agents
description: Install and maintain shared AI coding configuration.
order: 3
---

# Agents configuration

## `aiblueprint agents [options] [command]`

Primary command group for AI coding configuration. Use this for Claude Code, Codex, and `.agents` setup.

Options:

- `-f, --folder <path>` - root folder containing `.claude`, `.codex`, and `.agents`.
- `--claudeCodeFolder <path>` - override the Claude Code folder.
- `--codexFolder <path>` - override the Codex folder.
- `--agentsFolder <path>` - override the shared agents folder.
- `-s, --skip` - skip interactive prompts where supported.

Examples:

```bash
aiblueprint agents --help
aiblueprint agents --folder ./sandbox setup --skip
```

## `aiblueprint agents setup`

Install AIBlueprint defaults: shell shortcuts, statusline scripts, agents, skills, and Codex integration.

Examples:

```bash
npx aiblueprint-cli@latest agents setup
npx aiblueprint-cli@latest agents --skip setup
```

## `aiblueprint agents setup-terminal`

Set up a terminal environment with Oh My ZSH, plugins, and the AIBlueprint terminal theme.

Examples:

```bash
aiblueprint agents setup-terminal
aiblueprint agents --skip setup-terminal
```

## `aiblueprint agents symlink`

Create symlinks between supported AI coding tool configuration folders.

Examples:

```bash
aiblueprint agents symlink
aiblueprint agents --claudeCodeFolder ~/.claude --codexFolder ~/.codex symlink
```

## `aiblueprint agents unify`

Centralize skills and agents into `.agents`, then link tool-specific folders back to the shared location.

Examples:

```bash
aiblueprint agents unify
aiblueprint agents --folder ./agent-home unify
```

## `aiblueprint agents backup [command]`

Command group for interactive AI coding configuration backups.

Example:

```bash
aiblueprint agents backup --help
```

## `aiblueprint agents backup load`

Restore an older AI coding configuration backup through an interactive selector.

Example:

```bash
aiblueprint agents backup load
```
