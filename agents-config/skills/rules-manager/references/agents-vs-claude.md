# AGENTS.md vs CLAUDE.md - When to use which

Both files serve the same purpose: telling AI agents how to work in your project. They differ in audience and convention.

## Quick decision

| You are setting up rules for... | Use |
|---------------------------------|-----|
| Multiple AI agents (Claude, Codex, Cursor, etc.) | `AGENTS.md` + `.agents/rules/` |
| Claude Code only | `CLAUDE.md` + `.claude/rules/` |
| Both, on the same project | Both files; symlink or duplicate carefully |

`AGENTS.md` has emerged as a cross-tool convention. `CLAUDE.md` is Claude-specific. Use the broader one if uncertain.

## Structural parity

Both follow the same two-tier pattern:

```
AGENTS.md                   <->  CLAUDE.md
.agents/rules/<name>.md     <->  .claude/rules/<name>.md
```

The index-pattern is identical: the root file lists every modular file, with a one-line description and a link.

## Key differences

### Path conventions
- AGENTS.md: rules live in `.agents/rules/`
- CLAUDE.md: rules live in `.claude/rules/`

### Path-scoped rules
- `.claude/rules/` supports YAML frontmatter `paths:` for glob-scoped rules (loads only when relevant files are touched)
- `.agents/rules/` does not have a defined path-scoping spec across all tools - keep rules globally relevant or document scoping in plain text

### Discovery
- Claude Code auto-loads `CLAUDE.md` and recurses through subtrees
- AGENTS.md loading depends on the agent. Be explicit in the file about how rules are organized so any agent can navigate.

## Recommended pattern when supporting both

Pick one as the source of truth and reference from the other:

**Option A** - AGENTS.md is canonical:
```markdown
# CLAUDE.md
See [AGENTS.md](AGENTS.md) for project rules and the rule index.
```

**Option B** - Symlink (cleanest if the tool follows symlinks):
```bash
ln -s AGENTS.md CLAUDE.md
ln -s .agents/rules .claude/rules
```

**Option C** - Duplicate both files, accept drift risk. Run `/rules-manager optimize` periodically to catch divergence.

## Migration

Going from CLAUDE.md to AGENTS.md:
1. Rename `CLAUDE.md` -> `AGENTS.md`
2. Rename `.claude/rules/` -> `.agents/rules/`
3. Update every link in the index
4. Drop `paths:` frontmatter from rule files (or document scoping inline) if your other agents do not support it

Going from AGENTS.md to CLAUDE.md: do the reverse.
