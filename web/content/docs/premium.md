---
title: Premium
description: Activate and maintain premium AIBlueprint configuration bundles.
order: 5
---

# AIBlueprint Premium

## `aiblueprint agents pro [command]`

Command group for premium token and install workflows.

Example:

```bash
aiblueprint agents pro --help
```

## `aiblueprint agents pro activate [token]`

Validate a premium access token and store the GitHub token needed for premium config downloads.

Prefer the prompt-based flow so the token does not land in shell history:

```bash
aiblueprint agents pro activate
```

## `aiblueprint agents pro status`

Check whether a premium token is saved on the current machine.

Example:

```bash
aiblueprint agents pro status
```

## `aiblueprint agents pro setup`

Install premium agents, skills, statusline assets, shell shortcuts, and settings after activation.

Examples:

```bash
aiblueprint agents pro setup
aiblueprint agents --folder ./agent-home pro setup
```

## `aiblueprint agents pro update`

Refresh premium configurations from the premium source using the saved token.

Example:

```bash
aiblueprint agents pro update
```

## `aiblueprint agents pro sync`

Analyze premium configuration changes and choose what to import.

Example:

```bash
aiblueprint agents pro sync
```
