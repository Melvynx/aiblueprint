---
title: AIBlueprint CLI
description: Command reference for installing, sharing, backing up, and updating AI coding configuration.
order: 1
---

# AIBlueprint CLI command reference

AIBlueprint CLI configures AI coding environments across Claude Code, Codex, the shared `.agents` folder, and OpenClaw.

## Quick start

Run the default setup:

```bash
npx aiblueprint-cli@latest agents setup
```

Install all default features without prompts:

```bash
npx aiblueprint-cli@latest agents --skip setup
```

## Documentation pages

- [Global CLI](/global-cli) - root command, version, and help.
- [Agents](/agents) - setup, terminal setup, symlink, unify, and backup.
- [Legacy aliases](/legacy-aliases) - `ai-coding` and `claude-code`.
- [Premium](/premium) - AIBlueprint Premium activation, setup, update, and sync.
- [Configs](/configs) - named configs and backups.
- [Dynamic scripts](/dynamic-scripts) - runtime script command groups.
- [OpenClaw](/openclaw) - OpenClaw Pro commands.

## Folder targeting

Configuration commands default to `$HOME`, which resolves to:

```txt
~/.claude
~/.codex
~/.agents
```

Use `--folder`, `--claudeCodeFolder`, `--codexFolder`, or `--agentsFolder` to target a sandbox or non-standard setup.
