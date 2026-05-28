---
title: OpenClaw
description: Install and update OpenClaw Pro configuration from the AIBlueprint CLI.
order: 8
---

# OpenClaw

## `aiblueprint openclaw [options] [command]`

Command group for OpenClaw configuration commands.

Options:

- `-f, --folder <path>` - specify a custom OpenClaw folder path.

Examples:

```bash
aiblueprint openclaw --help
aiblueprint openclaw --folder ./openclaw-home pro status
```

## `aiblueprint openclaw pro [command]`

Command group for OpenClaw Pro activation and setup.

Example:

```bash
aiblueprint openclaw pro --help
```

## `aiblueprint openclaw pro activate [token]`

Validate an OpenClaw Pro access token and save the GitHub token used for downloads.

Prefer the prompt-based flow so the token does not land in shell history:

```bash
aiblueprint openclaw pro activate
```

## `aiblueprint openclaw pro status`

Check whether an OpenClaw Pro token is saved.

Example:

```bash
aiblueprint openclaw pro status
```

## `aiblueprint openclaw pro setup`

Install OpenClaw Pro skills, identity files, workspace instructions, and a `claude-run` helper when possible.

Example:

```bash
aiblueprint openclaw pro setup
```

## `aiblueprint openclaw pro update`

Refresh OpenClaw Pro configuration using the saved token.

Example:

```bash
aiblueprint openclaw pro update
```
