# Description Recommendations

Use this when writing or refining the `description` field for Claude Code skills, OpenAI Codex skills, or Cursor intelligent rules.

## Sources

- OpenAI Codex Agent Skills: https://developers.openai.com/codex/skills
- Anthropic Agent Skills best practices: https://console.anthropic.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic Agent Skills overview: https://console.anthropic.com/docs/en/agents-and-tools/agent-skills/overview
- Claude Code skills docs: https://docs.anthropic.com/en/docs/claude-code/skills
- Cursor rules docs: https://cursor.com/help/customization/rules

## Hard Rules

- Keep every description between 50 and 300 characters.
- Make the first clause useful on its own; skill lists may shorten descriptions.
- Include both what the skill does and when it should be used.
- Use third person. Do not write "I can..." or "You can...".
- Do not include XML tags, markdown tables, long examples, or implementation steps.
- Do not duplicate the full SKILL.md body. The description is only discovery metadata.

## What Good Descriptions Do

A good description helps the model decide whether to load the skill before it has read the skill body. It should answer three questions:

1. What capability does this skill provide?
2. Which user requests, file names, commands, or domain terms should trigger it?
3. What boundary keeps it from triggering on adjacent but wrong tasks?

Prefer concrete nouns, verbs, and file names over generic labels. Use terms a user would actually type: `SKILL.md`, `.cursor/rules`, `commit message`, `invoice`, `wrangler`, `Netlify deploy`, `DOCX`, `.xlsx`.

## Recommended Shape

Use one or two compact sentences:

```yaml
description: <Primary capability>. Use when <trigger phrases, file types, commands, or task context>.
```

For reference-only skills:

```yaml
description: <Domain conventions or reference material>. Use when working on <specific files, modules, APIs, or workflows>.
```

For side-effecting workflows, be narrower:

```yaml
description: Prepare and verify production deploys. Use only when the user explicitly asks to deploy, release, publish, or check deployment status.
```

## Examples

Good:

```yaml
description: Create or edit Claude, Codex, and Cursor skills/rules. Use for SKILL.md, .cursor/rules, AGENTS.md, frontmatter, references, scripts, and discovery rules.
```

Good:

```yaml
description: Review GitHub pull request feedback and implement requested changes. Use when the user asks to address PR comments, review threads, or requested changes.
```

Too vague:

```yaml
description: Helps with skills.
```

Too broad:

```yaml
description: Manage all developer workflow tasks, docs, rules, automation, repository work, deployment, testing, and issue handling.
```

Wrong point of view:

```yaml
description: I can help you write better skill descriptions.
```

## Checklist

- [ ] 50-300 characters.
- [ ] First words contain the primary trigger.
- [ ] Mentions the key files, commands, domains, or user phrases.
- [ ] Says when to use it, not only what it is.
- [ ] Specific enough to avoid accidental invocation.
- [ ] No body-level instructions, setup steps, or long examples.

Run the local inspector after editing:

```bash
bun scripts/inspect-description.ts
```
