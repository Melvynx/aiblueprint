# Claude Code Skills

Official docs: https://code.claude.com/docs/llms.txt

## Layout

```
skill-name/
├── SKILL.md            # required
├── references/         # loaded on demand
├── scripts/            # executable code
└── assets/             # templates, icons, fonts used in output
```

## Storage locations

| Location   | Path                                     | Applies to             |
| :--------- | :--------------------------------------- | :--------------------- |
| Personal   | `~/.claude/skills/<name>/SKILL.md`       | All your projects      |
| Project    | `.claude/skills/<name>/SKILL.md`         | This project only      |
| Plugin     | `<plugin>/skills/<name>/SKILL.md`        | Where plugin enabled   |
| Enterprise | Managed settings                         | Whole org              |

Precedence on name collision: enterprise > personal > project. Nested `.claude/skills/` under subdirectories is auto-discovered (monorepos).

## SKILL.md frontmatter

**Core**

- `name` (optional, defaults to directory name): lowercase, hyphens, max 64 chars.
- `description` (recommended): what it does + when to use. Front-load trigger keywords.

**Invocation control**

- `disable-model-invocation: true` - only the user can invoke. Use for side-effecting commands like `/deploy`.
- `user-invocable: false` - only Claude can invoke. Use for background knowledge.
- `argument-hint: "[issue-number]"` - shown in autocomplete.

**Execution control**

- `allowed-tools: [Read, Edit, Bash]` - tools usable without permission prompts.
- `model: claude-sonnet-4-6` - override active model.
- `context: fork` - run in a forked subagent context (no conversation history).
- `agent: Explore` - subagent type when `context: fork` is set.
- `hooks` - lifecycle hooks scoped to this skill.

**Substitutions in body**

- `$ARGUMENTS` - args passed when invoking.
- `${CLAUDE_SESSION_ID}` - current session ID.

**Dynamic context injection**: prefix a shell command with `!` and wrap in backticks; output replaces the placeholder before the body is sent to the model.

## Example: subagent-forked skill

```markdown
---
name: deep-research
description: Research a topic thoroughly. Use when the user asks to research, investigate, or deeply explore a topic that requires multiple file reads and web searches.
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with file references
```

## Bundled resources

- **`scripts/`**: deterministic code (Python, Bash, TS). Run without loading into context. Include only when the same code would be rewritten repeatedly.
- **`references/`**: docs loaded on demand. Schemas, API specs, long examples, domain glossaries. Keep one level deep.
- **`assets/`**: files used in output (templates, fonts, boilerplate). Not loaded into context.

## Common mistakes

- Description that labels instead of triggers ("Helper for X" → "Use when the user asks to X...").
- SKILL.md > 500 lines without splitting into references.
- README/CHANGELOG files next to SKILL.md.
- Duplicating the same content in SKILL.md and references.
