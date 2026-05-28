---
title: Dynamic scripts
description: Script command groups loaded from the target Claude scripts package at runtime.
order: 7
---

# Dynamic scripts

Dynamic commands are registered from the target Claude folder's `scripts/package.json` at startup. Use `--list` to see the actions available on the current machine.

## `aiblueprint agents auto-rename [action]`

Run auto-rename scripts from the resolved Claude scripts folder.

Examples:

```bash
aiblueprint agents auto-rename --list
aiblueprint agents auto-rename <action>
```

## `aiblueprint agents validator [action]`

Run validator scripts from the resolved Claude scripts folder.

Examples:

```bash
aiblueprint agents validator --list
aiblueprint agents validator <action>
```

## `aiblueprint agents statusline [action]`

Run statusline utility scripts from the resolved Claude scripts folder.

Examples:

```bash
aiblueprint agents statusline --list
aiblueprint agents statusline <action>
```
