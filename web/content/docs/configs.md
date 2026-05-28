---
title: Configs
description: Save, load, list, undo, and manually back up configuration snapshots.
order: 6
---

# Saved configurations

## `aiblueprint configs [options] [command]`

Command group for named configuration snapshots and automatic backups.

Example:

```bash
aiblueprint configs --help
```

## `aiblueprint configs save <name>`

Save the current `.claude`, `.codex`, and `.agents` folders as a named config.

Options:

- `--force` - overwrite an existing saved config.

Examples:

```bash
aiblueprint configs save daily-driver
aiblueprint configs save daily-driver --force
```

## `aiblueprint configs load <name>`

Load a named config and back up the current folders first.

Example:

```bash
aiblueprint configs load daily-driver
```

## `aiblueprint configs undo`

Undo the most recent config load by restoring its automatic backup.

Example:

```bash
aiblueprint configs undo
```

## `aiblueprint configs list`

List saved named configs.

Example:

```bash
aiblueprint configs list
```

## `aiblueprint configs backups [command]`

Command group for automatic and manual backup snapshots.

Example:

```bash
aiblueprint configs backups --help
```

## `aiblueprint configs backups list`

List automatic backups with reasons.

Example:

```bash
aiblueprint configs backups list
```

## `aiblueprint configs backups load <name>`

Load a backup snapshot and back up the current folders first.

Example:

```bash
aiblueprint configs backups load 2026-05-28-setup
```

## `aiblueprint configs backups create [reason]`

Create a manual backup of the current config folders.

Example:

```bash
aiblueprint configs backups create "before testing new skills"
```
