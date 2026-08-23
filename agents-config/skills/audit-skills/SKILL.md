---
name: audit-skills
description: Audit installed skills for observed usage, explicit-only invocation controls, duplicate discovery, and global-versus-project scope. Use only when the user explicitly invokes `$audit-skills`.
argument-hint: "[audit|fix] [project-root]"
disable-model-invocation: true
---

# Audit Skills

Audit skill discovery cost and placement from current files plus observable Codex and Claude session evidence. Treat missing telemetry as uncertainty, not proof that a skill has never been useful.

## Invocation guard

Proceed only when the current user message explicitly invokes `$audit-skills`.

- `$audit-skills audit [project-root]`: produce a read-only audit. This is the default.
- `$audit-skills fix [project-root]`: audit first, then apply only high-confidence corrections.

Resolve `project-root` from the argument or current repository. Preserve unrelated dirty changes and record Git status for every modified repository.

## Audit

Run the deterministic inventory as a bounded job:

```bash
bun ~/.agents/skills/audit-skills/scripts/audit-skills.mjs \
  --project "$PWD" \
  --format markdown
```

The script inventories global `~/.agents/skills` and `<project>/.agents/skills`, then scans observable Codex and Claude histories for:

- explicit user references such as `$skill-name` or `/skill-name`;
- Claude `Skill` tool calls;
- agent reads of a matching `SKILL.md`;
- working directories associated with observed use;
- Claude `disable-model-invocation` and Codex `policy.allow_implicit_invocation` controls;
- name collisions and hardcoded project-root references.

Report these evidence classes separately:

- `OBSERVED_USER`: explicitly named by a user in scanned history;
- `OBSERVED_MODEL`: loaded or invoked by an agent in scanned history;
- `UNOBSERVED`: no matching evidence in scanned sources;
- `EXPLICIT_ONLY`: protected for both Claude and Codex;
- `INVOCATION_MISMATCH`: protected on only one platform;
- `LOCALITY_CANDIDATE`: global skill with a project-specific runtime dependency or at least two observed uses confined to one project;
- `NAME_COLLISION`: same skill name discovered globally and locally.

Include scan coverage and limitations. Cursor ACP stores are opaque blobs and are not counted unless a reliable parser becomes available. Never label `UNOBSERVED` as “never used” without naming the scanned time range and sources.

## Fix

Apply changes only after the audit ledger exists.

Safe automatic corrections:

1. Mirror an existing explicit-only decision across platforms: add `disable-model-invocation: true` when Codex already blocks implicit invocation, or add `policy.allow_implicit_invocation: false` when Claude already blocks it.
2. Mark a skill explicit-only when its own instructions already require direct user invocation but one or both platform controls are missing.
3. Repair metadata made stale by a move or rename.

Require explicit user direction or a project-specific runtime dependency before moving a skill between scopes. Multiple uses confined to one project justify review, not automatic relocation; a single observed use is insufficient evidence.

When moving a skill:

1. copy the complete directory, including scripts, references, assets, and `agents/openai.yaml`;
2. rewrite absolute self-paths and dependencies to their new canonical locations;
3. validate the destination before removing the source;
4. use `trash` for source removal;
5. search all skill roots and plugin/profile metadata for stale references;
6. confirm the name is discovered exactly once in the intended scope.

For unobserved skills, recommend rather than mutate unless their own text clearly establishes user-only intent. Rarely used incident, security, recovery, and migration skills remain protected from usage-only pruning.

## Completion criteria

Complete an audit only when every inventoried skill has a row, scan coverage is reported, and every recommendation cites static or usage evidence.

Complete a fix only when touched skills validate, moved dependencies resolve, unintended duplicate discovery is absent, and final Git status distinguishes pre-existing changes from this run.
