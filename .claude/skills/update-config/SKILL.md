# Update Config

Sync skills from `~/.claude/skills/` into this repo's `claude-code-config/skills/` and update `skills/` symlinks.

## Trigger

Use when asked to "update config", "sync skills", or "refresh skills from ~/.claude".

## Rules

- **ONLY sync skills that already exist in `claude-code-config/skills/`** - never add new skills from `~/.claude/skills/`
- Skip symlinks in `~/.claude/skills/` (those point to external repos like openclaw)
- Exclude `node_modules`, `bun.lockb`, `.DS_Store` when copying
- Always update the symlink in `skills/` to point to `../claude-code-config/skills/<name>`
- Run `bun test:run` after syncing to verify nothing broke

## Workflow

1. **List current repo skills**:
   ```bash
   ls claude-code-config/skills/
   ```

2. **For each skill in `claude-code-config/skills/`**, check if it exists as a non-symlink directory in `~/.claude/skills/`:
   ```bash
   # Check it's a real directory, not a symlink
   [ -d "$HOME/.claude/skills/<name>" ] && [ ! -L "$HOME/.claude/skills/<name>" ]
   ```

3. **Sync content** for matching skills:
   ```bash
   trash claude-code-config/skills/<name>
   rsync -a --exclude='node_modules' --exclude='bun.lockb' --exclude='.DS_Store' \
     ~/.claude/skills/<name>/ claude-code-config/skills/<name>/
   ```

4. **Update symlink** in `skills/`:
   ```bash
   rm skills/<name> 2>/dev/null  # remove old symlink if exists
   ln -s ../claude-code-config/skills/<name> skills/<name>
   ```

5. **Verify**: Run `bun test:run`

6. **Report**: List which skills were synced and which were skipped (not found in `~/.claude/skills/`)
