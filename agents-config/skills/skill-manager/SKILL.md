---
name: skill-manager
description: Create and edit skills/rules across Claude Code, OpenAI Codex, and Cursor. Use when the user asks to "create a skill", "build a skill", "write a skill", "make a cursor rule", "add a codex skill", "skill manager", or mentions SKILL.md, .cursor/rules, agents/openai.yaml, or multi-agent rule files. Handles frontmatter, file layout, and discovery rules for each platform.
---

# Skill Manager

Authoring guide for skills/rules across three agent platforms. All three share the same idea: a small markdown file with frontmatter, optional references, optional scripts. The discovery rules and frontmatter fields differ.

| Platform     | File                                          | Frontmatter fields                                       | Optional config              |
| :----------- | :-------------------------------------------- | :------------------------------------------------------- | :--------------------------- |
| Claude Code  | `<scope>/skills/<name>/SKILL.md`              | `name`, `description`, plus invocation/execution fields  | -                            |
| Codex        | `<scope>/.agents/skills/<name>/SKILL.md`      | `name`, `description`                                    | `agents/openai.yaml`         |
| Cursor       | `.cursor/rules/<name>.md` or `.mdc`           | `description`, `globs`, `alwaysApply`                    | `AGENTS.md` (no frontmatter) |

Pick the platform first, then read the matching reference file:

- Claude Code → see [references/claude-code.md](references/claude-code.md)
- Codex      → see [references/codex.md](references/codex.md)
- Cursor     → see [references/cursor.md](references/cursor.md)

If unsure which the user wants, ask. Default to Claude Code when working under `~/.claude/` or `.claude/`, Codex when under `~/.agents/` or `.agents/`, Cursor when under `.cursor/`.

## Core principles (all platforms)

### Concise is key

The context window is shared with the system prompt, conversation, other skills' metadata, and the user request. Only add context the agent doesn't already have. Challenge each line: does it justify its tokens?

### Match freedom to fragility

- **High freedom** (prose instructions): multiple valid approaches, decisions depend on context.
- **Medium freedom** (pseudocode, scripts with parameters): preferred pattern exists, some variation OK.
- **Low freedom** (specific scripts, few parameters): fragile, error-prone, must run a fixed sequence.

### Progressive disclosure

Three loading levels:

1. **Metadata** (name + description): always in context. Keep tight.
2. **SKILL.md body**: loaded when the skill triggers. Aim under ~500 lines.
3. **References**: loaded on demand. Move variant-specific detail, schemas, and long examples here.

Keep references one level deep. Reference them by name in SKILL.md so the agent knows when to open them.

### Skill anatomy

```
skill-name/
├── SKILL.md            # required: frontmatter + instructions
├── references/         # optional: docs loaded on demand
├── scripts/            # optional: deterministic code
└── assets/             # optional: templates/icons used in output
```

Do NOT add README, CHANGELOG, INSTALLATION_GUIDE, etc. Only files the agent needs at runtime.

## Authoring workflow

1. **Pin down the use case.** Get 2-3 concrete example prompts that should trigger the skill. Confirm with the user.
2. **List reusable parts.** What scripts, references, or assets recur? Add only those.
3. **Write SKILL.md.** Frontmatter first (description is what triggers it - front-load keywords). Then imperative-form body.
4. **Test the description.** The description has to read like a trigger phrase, not a label. Examples in each reference file.
5. **Iterate after real use.** Note what the agent got wrong; refine the relevant section.

## Writing the description

The `description` field is the single most important line in the file - it's what the model uses to decide to load the skill. Write it as:

- Front-load trigger words ("Use when...", "create a skill", "review a PR").
- State scope and boundaries explicitly.
- Mention concrete file names or commands the user might type.

Bad: `"Helper for skills."`
Good: `"Create and edit skills/rules across Claude Code, OpenAI Codex, and Cursor. Use when the user asks to 'create a skill'..."`

## Where each platform stores skills

See the per-platform reference files. Quick reminders:

- **Claude Code**: `~/.claude/skills/` (personal) or `.claude/skills/` (project). Higher scope wins on name collision.
- **Codex**: `.agents/skills/` walks up from CWD to repo root, then `~/.agents/skills/`, then `/etc/codex/skills`, then system bundled.
- **Cursor**: `.cursor/rules/` (project, version-controlled) or `AGENTS.md` files in project subdirectories.
