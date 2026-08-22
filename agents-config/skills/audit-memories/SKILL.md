---
name: audit-memories
description: Manual-only audit and cleanup of agent-facing Markdown inside the current project. Run only from an explicit `$audit-memories` or `/audit-memories` user command; never select it implicitly.
argument-hint: "[audit|clean]"
disable-model-invocation: true
user-invocable: true
---

# Audit Project Memories

Treat agent instructions, rules, skills, plans, task traces, and outputs inside the current project as its agent memory. Compare them with current project truth, then remove noise without destroying durable guidance.

## Invocation guard

Proceed only when the user explicitly invokes `$audit-memories` or `/audit-memories`. An OpenCode command may satisfy this guard by explicitly stating that the user invoked `/audit-memories` before injecting this file.

Supported actions:

- `$audit-memories audit`: exhaustive read-only audit. This is the default action when only `$audit-memories` is supplied.
- `$audit-memories clean`: run or refresh the exhaustive audit, then apply justified local cleanup.
- `/audit-memories audit` and `/audit-memories clean`: equivalent manual commands in clients that use slash-command syntax.

Do not read or modify `~/.codex/memories`. Do not classify product documentation, public docs, README files, changelogs, or general project plans. They may be read only as truth evidence when an agent document references them.

## Hard boundaries

- Resolve the project root from the current working directory. Never silently switch to another checkout.
- Read the nearest applicable `AGENTS.md`, `CLAUDE.md`, and repository rules before auditing.
- Preserve unrelated dirty-tree changes. Record `git status --short` before and after.
- Never inspect secret values. Compare environment-variable names through examples, schemas, and code only.
- Never use `rm -rf`. Use `trash` for approved file removal.
- Use `apply_patch` for textual edits. Use formatters only for mechanical normalization.
- Do not infer deployed truth from local code. Label provider/runtime claims `NOT VERIFIED` unless the audit explicitly checks the live system.
- Do not delete instruction files, security guidance, migration procedures, incident runbooks, or destructive-operation safeguards merely because they are old or rarely linked.

## Action: audit

### 1. Inventory every agent-facing Markdown file

Run:

```bash
python3 ~/.agents/skills/audit-memories/scripts/inventory_project_markdown.py \
  --root "$PWD" \
  --format json
```

Include only:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and equivalent agent entrypoints;
- `.agents/**/*.md`, `.claude/**/*.md`, and `.cursor/**/*.{md,mdc}`;
- `.github/copilot-instructions.md` and `.github/instructions/**/*.md`;
- project skill files under `skills/**/SKILL.md` or `.agents/skills/**`.

This intentionally includes agent-generated plans, task traces, and output folders because they are prime cleanup candidates. Exclude public/local documentation such as `content/docs`, normal README files, product specs, and application changelogs from classification.

The byte-level ledger must show `visited == eligible`. It is not a semantic audit by itself.

### 2. Build the project truth map

Inspect current primary evidence before classifying documents:

1. repository instructions and package/workspace manifests;
2. source tree, routes, exported APIs, schemas, migrations, and configuration;
3. tests and CI workflows;
4. current Git history only when a document makes a historical claim;
5. live provider/runtime state only when explicitly requested and safely accessible.

Start with `rg --files`, `package.json` or equivalent manifests, key configs, and the files referenced by Markdown. Follow repository instructions about required reading. Use targeted searches rather than loading the entire source tree blindly.

Truth priority:

```text
explicit current user instruction
> current code/config/schema
> current tests and CI contracts
> verified provider/runtime read-back
> Markdown claims
> historical memory
```

### 3. Review files one by one

Read every eligible agent-facing Markdown file. Sampling is not completion.

For more than 30 files, split the exact manifest into disjoint batches of 10–20. Use parallel subagents when available. Give each worker the shared truth map plus exact Markdown paths and read-only boundaries. Require one result row per path; verify that batch union equals the manifest with no duplicates.

For each file, record:

- purpose and intended audience;
- whether referenced paths, commands, APIs, routes, names, versions, statuses, and architecture match current evidence;
- overlap with other Markdown files;
- broken local links and missing referenced files;
- historical value and operational risk;
- evidence paths and line numbers;
- verdict: `KEEP`, `UPDATE`, `MERGE`, `ARCHIVE`, `DELETE`, or `VERIFY`.

For important claims, use:

- `VERIFIED`: directly supported by current local evidence;
- `CONTRADICTED`: current evidence disproves it;
- `NOT VERIFIED`: needs external/runtime evidence;
- `HISTORICAL`: intentionally describes an old state;
- `OPINION`: product/design intent, not a factual implementation claim.

Load [cleanup-rubric.md](references/cleanup-rubric.md) before classification.

### 4. Produce the audit report

Return:

- project root and Git status boundary;
- files eligible, byte-visited, semantically reviewed, skipped, and failed;
- current lines/bytes and projected post-clean totals;
- verdict counts and defensible removal percentage;
- one concise row per agent-facing Markdown file;
- contradiction table with exact document and truth-source lines;
- duplicate/merge clusters and canonical destination;
- broken local links;
- protected documents and why they must survive;
- claims marked `NOT VERIFIED`.

Do not create another report Markdown inside the project unless the user explicitly asks for a durable report.

## Action: clean

Run the complete audit first unless a still-current exhaustive audit exists for the same Git tree. Recheck hashes and `git status`; refresh changed files.

Apply verdicts as follows:

- `KEEP`: no change.
- `UPDATE`: make the smallest accurate edit and preserve useful history.
- `MERGE`: move unique knowledge into the declared canonical file, update inbound links, then `trash` the redundant file.
- `ARCHIVE`: use only when historical value is real and the repository already has an archive convention.
- `DELETE`: `trash` only after proving the file is redundant, contradicted without historical value, generated noise, or obsolete execution residue.
- `VERIFY`: leave unchanged unless the required evidence is obtained.

Before modifying any file, obey repository-specific read requirements. If the worktree is dirty, never overwrite overlapping user changes; downgrade that action to `BLOCKED` and continue with disjoint files.

After edits:

1. rerun the inventory and local-link checks;
2. search for references to removed or renamed files;
3. run proportionate repository validation through its required supervisor;
4. inspect the final diff and confirm no non-Markdown behavior changed unintentionally;
5. report exact files updated, merged, archived, trashed, blocked, and untouched.

Do not commit or push unless explicitly requested.

## Completion criteria

Complete `audit` only when every eligible Markdown file has one semantic verdict and evidence.

Complete `clean` only when:

- the exhaustive ledger still matches the current tree;
- every applied deletion has a proven canonical replacement or explicit no-value rationale;
- links and references are repaired;
- protected operational knowledge remains accessible;
- validation results and blockers are reported separately;
- the final dirty tree contains no accidental out-of-scope edits.
