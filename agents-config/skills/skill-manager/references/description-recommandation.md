# Description

Load this when writing or refining a `description` field.

Official docs: Codex https://developers.openai.com/codex/skills · Claude https://docs.anthropic.com/en/docs/claude-code/skills · Cursor https://cursor.com/docs/skills

## Rules

- 50–300 characters.
- First clause useful alone; skill lists may truncate.
- What it does + when to use it. Third person. No `I can` / `You can`.
- No XML, tables, long examples, or body-level steps.
- Trigger-first: nouns, verbs, file names, and commands the user would type.

## Shape

```yaml
description: <Primary capability>. Use when <trigger phrases, files, commands, or task context>.
```

Good: `Create or edit Claude, Codex, and Cursor skills/rules. Use for SKILL.md, .cursor/rules, AGENTS.md, frontmatter, references, scripts, and discovery rules.`

Good: `Review GitHub pull request feedback and implement requested changes. Use when the user asks to address PR comments, review threads, or requested changes.`

Bad: `Helps with skills.` / `I can help you write better skill descriptions.` / a catalog of every adjacent task.

Then run `bun ~/.agents/skills/skill-manager/scripts/inspect-description.ts` on the skill root.
