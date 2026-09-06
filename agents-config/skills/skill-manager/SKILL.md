---
name: skill-manager
description: Create, edit, audit, or prune Claude, Codex, and Cursor skills/rules. Use for SKILL.md, .cursor/rules, AGENTS.md, frontmatter, references, scripts, and skill discovery.
---

Write skills the way `$analyze`, `$plan`, `$implement`, `$code-review`, and `$verify` are written.

## Target

- One job. Imperative. Every line changes behavior.
- Body under ~40 lines unless the job is genuinely multi-branch.
- Description 50–300 chars: capability first, then `Use when` + trigger words.
- No README, changelog, or theory. No restating model defaults.
- References only for platform or schema detail the body cannot hold. Name the file and when to open it.
- User-only workflows: `disable-model-invocation: true`.

## Write

1. Confirm 2–3 trigger prompts with the user.
2. Pick the platform. Default from the path: `.claude` → Claude, `.agents` → Codex, `.cursor` → Cursor. Ask if unclear.
3. Write frontmatter, then the body: inspect → act → return → stop.
4. Run `bun ~/.agents/skills/skill-manager/scripts/inspect-description.ts` on the skill root.

Personal skills live in `~/.agents/skills/<name>/`. Platform layout and frontmatter: [claude-code.md](references/claude-code.md), [codex.md](references/codex.md), [cursor.md](references/cursor.md). Description rules: [description-recommandation.md](references/description-recommandation.md).

## Audit

For each line: would removing it change behavior? Delete no-ops, duplicates, and stale rules. State the positive target; keep prohibitions only as hard guardrails.

Online research: `$find-docs` for current technical docs; `$exa-search` for broader web research.

After creating or renaming a personal skill icon, run `bun ~/.agents/scripts/sync-codex-profile-icons.ts --install`. Compat: `~/.claude/skills` and `~/.codex/skills` symlink to `~/.agents/skills`. Do not symlink `~/.cursor/skills`.
