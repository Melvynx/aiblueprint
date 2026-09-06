---
name: update-config
description: Sync existing skills from ~/.claude/skills into this repo and refresh skills/ symlinks. Use when asked to update config, sync skills, or refresh skills from ~/.claude.
---

Sync only skills that already exist in `claude-code-config/skills/`. Skip `~/.claude/skills` symlinks. Exclude `node_modules`, `bun.lockb`, and `.DS_Store`.

1. List `claude-code-config/skills/`.
2. For each name, copy only if `~/.claude/skills/<name>` is a real directory: `trash` the repo copy, then `rsync -a` from `~/.claude/skills/<name>/`.
3. Point `skills/<name>` at `../claude-code-config/skills/<name>`.
4. Run `bun test:run`.
5. Report synced vs skipped.
