---
name: audit-memories
description: Audit and clean agent-facing Markdown in the current project. Use when the user invokes $audit-memories or /audit-memories to audit or clean AGENTS.md, rules, skills, plans, or task traces.
argument-hint: "[audit|clean]"
disable-model-invocation: true
user-invocable: true
---

Proceed only on an explicit `$audit-memories` or `/audit-memories`. An OpenCode command that states the user invoked `/audit-memories` satisfies this guard. Default action is `audit`. `clean` audits first, then applies justified local cleanup.

Resolve the project root from `$PWD`. Do not switch checkouts. Do not read or modify `~/.codex/memories`. Classify only agent-facing Markdown: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.agents/**/*.md`, `.claude/**/*.md`, `.cursor/**/*.{md,mdc}`, `.github/copilot-instructions.md`, `.github/instructions/**/*.md`, `skills/**/SKILL.md`, `.agents/skills/**`. Product docs, READMEs, changelogs, and public specs are truth evidence only.

Read the nearest `AGENTS.md`, `CLAUDE.md`, and repository rules first. Record `git status --short` before and after. Never inspect secret values. Never use `rm -rf`; `trash` approved removals. Use `apply_patch` for text. Label provider/runtime claims `NOT VERIFIED` unless this run checks the live system. Do not delete instruction, security, migration, incident, or destructive-safeguard files because they are old.

## Audit

Run:

```bash
python3 ~/.agents/skills/audit-memories/scripts/inventory_project_markdown.py --root "$PWD" --format json
```

The byte ledger must show `visited == eligible`. Then read every eligible file. Over 30 files: disjoint batches of 10–20, one row per path, union equals the manifest.

Load [cleanup-rubric.md](references/cleanup-rubric.md) before classifying. Verdict each file `KEEP`, `UPDATE`, `MERGE`, `ARCHIVE`, `DELETE`, or `VERIFY`. Mark important claims `VERIFIED`, `CONTRADICTED`, `NOT VERIFIED`, `HISTORICAL`, or `OPINION`.

Return the root, git boundary, counts, projected totals, one row per file, contradictions with line evidence, merge clusters, broken links, protected files, and `NOT VERIFIED` claims. Do not write a report file unless asked.

## Clean

Reuse a still-current exhaustive audit for this Git tree; otherwise re-audit. Recheck hashes and `git status`. Apply verdicts: `KEEP` unchanged; `UPDATE` smallest accurate edit; `MERGE` unique knowledge into the canonical file, fix inbound links, then `trash`; `ARCHIVE` only with an existing archive convention; `DELETE` via `trash` only after a proven replacement or no-value rationale; `VERIFY` unchanged until evidence exists.

If the worktree is dirty, skip overlapping user changes (`BLOCKED`) and continue on disjoint files. After edits: rerun inventory and link checks, search for removed or renamed paths, run proportionate repo validation, confirm the diff is Markdown-only. Do not commit or push unless asked.

Stop `audit` when every eligible file has one evidenced verdict. Stop `clean` when the ledger matches the tree, every deletion has a proven rationale, links are repaired, protected knowledge remains, validation and blockers are reported separately, and the dirty tree has no out-of-scope edits.
