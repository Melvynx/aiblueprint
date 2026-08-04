---
name: skill-manager
description: Create, edit, audit, or prune Claude, Codex, and Cursor skills/rules. Use for SKILL.md, .cursor/rules, AGENTS.md, prompts, frontmatter, references, scripts, discovery, and predictable skill design.
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
- Description quality → see [references/description-recommandation.md](references/description-recommandation.md)
- Skill-writing vocabulary → see [references/skill-writing-glossary.md](references/skill-writing-glossary.md)

If unsure which the user wants, ask. Default to Claude Code when working under `~/.claude/` or `.claude/`, Codex when under `~/.agents/` or `.agents/`, Cursor when under `.cursor/`.

## Core principles (all platforms)

### Optimize for predictability

A skill should make the agent follow the same process on repeated runs, even when the outputs differ. Treat predictability as the root quality; token cost and maintainability improve when the process is explicit and lean.

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

### Design the information hierarchy

Put ordered actions in steps and definitions or rules in reference sections. End important steps with a checkable completion criterion; vague criteria invite premature completion. Inline what every execution branch needs and move branch-specific material behind a context pointer whose wording says when to load it.

Split a skill only when the split earns its cost:

- **By invocation:** a distinct leading word must trigger the new skill independently.
- **By sequence:** hiding later steps prevents the agent from rushing the current step.

Every model-invoked skill spends context load through its description. Every user-only skill spends human cognitive load because the user must remember it. When user-only skills become hard to remember, add one router instead of making every skill model-invoked.

### Use leading words

A leading word is a compact pretrained concept such as `tight loop`, `tracer bullet`, or `handoff`. Reuse the same term in the description and body so it anchors both invocation and execution. Prefer one strong term over repeated prose that restates the same behavior.

### Prune aggressively

Keep each meaning in one authoritative place. Audit every sentence with the no-op test: would removing it change agent behavior? Delete no-ops instead of polishing them. Watch for:

- **Duplication:** the same rule appears in several places.
- **Sediment:** stale instructions remain because removal feels risky.
- **Sprawl:** every line may be relevant, but the active path carries too much context.
- **Negation:** naming forbidden behavior makes it more available; state the positive target and reserve prohibitions for hard guardrails.
- **Negative space:** omitted decisions silently fall back to model priors; decide whether each omission is intentional.
- **Premature completion:** sharpen the completion criterion before splitting the sequence.

### Online research routing

When a skill or agent needs online research, name the exact research skill to use instead of relying on vague web-search language:

- Use `~/.agents/skills/find-docs/SKILL.md` for current technical documentation, API references, config options, SDKs, CLIs, cloud services, and code examples.
- Use `~/.agents/skills/exa-search/SKILL.md` for broader online research, recent information, source discovery, similar pages, URL extraction, or cited web answers.
- Mention default harness tools for local code, file, git, shell, and browser inspection.
- Keep built-in `WebSearch` and `WebFetch` as fallback tools unless the user explicitly asks for them.
- For restricted agents, include `Skill` and `Bash` in the tool list when these skills need to run local CLIs.
- Never put secrets, tokens, credentials, personal data, or proprietary code in external queries.

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

The `description` field is the single most important line in the file - it's what the model uses to decide to load the skill. This is a hard rule: descriptions must be between 50 and 300 characters.

Write it as:

- Front-load trigger words ("Use when...", "create a skill", "review a PR").
- State scope and boundaries explicitly.
- Mention concrete file names or commands the user might type.
- Keep it short enough to stay under 300 characters, while still specific enough to trigger reliably.

Bad: `"Helper for skills."`
Good: `"Create and edit skills/rules across Claude Code, OpenAI Codex, and Cursor. Use when the user asks to 'create a skill'..."`

To validate skill descriptions, frontmatter fields, `agents/openai.yaml`, and skill directory shape, run:

```bash
bun scripts/inspect-description.ts
```

By default, this checks `~/.agents/skills` only and follows symlinked skill directories inside that root. Pass one or more roots to inspect a different set. Passing a `.cursor/rules` directory validates Cursor rule frontmatter too:

```bash
bun scripts/inspect-description.ts .agents/skills
```

For researched guidance and examples, see [references/description-recommandation.md](references/description-recommandation.md).

## Where each platform stores skills

**Canonical personal skills:** `~/.agents/skills/` is the single source of truth (git repo `Melvynx/agents-config`). It is an official user-level root for both Cursor and Codex, so they read it directly. Write new personal skills only under `~/.agents/skills/<name>/`.

### Codex profile activity icons

Codex's Profile activity view does not resolve standalone skill icons from `agents/openai.yaml`. It resolves known built-in skill icons or the logo of a matching installed plugin. After creating, renaming, or changing the icon metadata of a personal skill, sync the identity-only personal plugin wrappers:

```bash
bun ~/.agents/scripts/sync-codex-profile-icons.ts --install
bun ~/.agents/scripts/audit-codex-profile-icons.ts
```

The wrappers intentionally contain no executable skills, so they provide `logo` / `logoDark` metadata without duplicating skill discovery. Keep `~/plugins` linked to `~/.agents/plugins/plugins`; the sync script creates the link when absent.

Per the official Cursor docs ([cursor.com/docs/skills](https://cursor.com/docs/skills)), user-level roots are `~/.agents/skills/` and `~/.cursor/skills/`, plus compat dirs `~/.claude/skills/` and `~/.codex/skills/`. `~/.cursor/skills-cursor/` is NOT a documented path; do not use it.

Because `~/.agents/skills/` is read directly, the only symlinks needed are the compat dirs for agents that do not read `~/.agents/skills/` themselves:

```bash
~/.claude/skills -> ~/.agents/skills   # Claude Code reads ~/.claude/skills
~/.codex/skills  -> ~/.agents/skills   # Codex compat (optional; Codex also reads ~/.agents/skills)
```

Do NOT symlink `~/.cursor/skills` or `~/.cursor/skills-cursor` to `~/.agents/skills/`; that makes Cursor scan the same skills two or three times. To repair the compat symlinks if missing:

```bash
ln -s ~/.agents/skills ~/.claude/skills
```

See the per-platform reference files. Quick reminders:

- **Cursor**: reads `~/.agents/skills/` and `~/.cursor/skills/` (user-level), `.agents/skills/` and `.cursor/skills/` (project). Use `~/.agents/skills/` as the single root; skip the `~/.cursor/skills*` symlinks.
- **Claude Code**: `~/.claude/skills/` (symlink → `~/.agents/skills/`) or `.claude/skills/` (project). Higher scope wins on name collision.
- **Codex**: `.agents/skills/` walks up from CWD to repo root, then `~/.agents/skills/`, then `/etc/codex/skills`, then system bundled.
