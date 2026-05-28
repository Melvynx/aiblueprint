---
title: Global CLI
description: Top-level entry points for discovering and running the CLI.
order: 2
---

# Global CLI

## `aiblueprint [options] [command]`

Root command for AIBlueprint. It exposes the `agents`, legacy aliases, `configs`, and `openclaw` command groups.

Options:

- `-V, --version` - print the installed CLI version.
- `-h, --help` - show help for the root command or a nested command.

Examples:

```bash
npx aiblueprint-cli@latest --help
aiblueprint --version
```

## `aiblueprint help [command]`

Print Commander-generated help for any command or subcommand.

Examples:

```bash
aiblueprint help configs
aiblueprint help agents pro
```
