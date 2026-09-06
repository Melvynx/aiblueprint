---
name: audit-skills
description: Audit installed skills for observed usage, explicit-only invocation controls, duplicate discovery, and global-versus-project scope. Use only when the user explicitly invokes `$audit-skills`.
argument-hint: "[audit|fix] [project-root]"
disable-model-invocation: true
---

Proceed only on an explicit `$audit-skills` invocation. Default `audit`; `fix` applies only high-confidence corrections after the ledger exists. Resolve `project-root` from the argument or current repo. Preserve unrelated dirty changes.

```bash
bun ~/.agents/skills/audit-skills/scripts/audit-skills.mjs --project "$PWD" --format markdown
```

Report every inventoried skill with scan coverage and one evidence class: `OBSERVED_USER`, `OBSERVED_MODEL`, `UNOBSERVED`, `EXPLICIT_ONLY`, `INVOCATION_MISMATCH`, `LOCALITY_CANDIDATE`, `NAME_COLLISION`. Cursor ACP stores are opaque. Do not label `UNOBSERVED` as never used without naming the scanned range.

Safe automatic fixes: mirror an existing explicit-only decision across Claude/Codex; add missing explicit-only controls when the skill text already requires direct invocation; repair stale move/rename metadata. Move a skill between scopes only with explicit user direction or a project-specific runtime dependency. Copy the full directory, rewrite self-paths, validate, `trash` the source, then confirm the name is discovered once.

Recommend rather than mutate unobserved skills. Protect incident, security, recovery, and migration skills from usage-only pruning.

Done when every skill has a row, every recommendation cites evidence, and — on `fix` — touched skills validate and Git status distinguishes this run.
