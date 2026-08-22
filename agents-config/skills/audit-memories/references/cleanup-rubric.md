# Project agent-memory cleanup rubric

Inventory is not semantic review. Classify every eligible agent instruction, rule, skill, command, task trace, plan, and output against current project evidence. Public documentation and normal README files are evidence sources, not cleanup targets.

## Evidence checks

Verify claims with the closest primary source:

| Markdown claim | Primary local evidence |
| --- | --- |
| Commands and scripts | package/workspace manifest and executable scripts |
| Paths and filenames | current filesystem and imports |
| Routes and APIs | route files, handlers, schemas, generated API contracts |
| Data model | schema and migrations |
| Architecture | source imports, boundaries, configuration, tests |
| Environment variables | example files, validators, and code references; never secret values |
| Feature status | current implementation and tests |
| Deployment/runtime status | live provider read-back, otherwise `NOT VERIFIED` |
| Historical decision | Git history, ADR, migration, or dated plan context |

## Score

Score each agent-memory document:

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Current utility | none | occasional | useful | operationally critical |
| Accuracy | contradicted | mostly stale | mixed | verified/current |
| Uniqueness | exact duplicate | mostly repeated | partly unique | canonical |
| Discoverability | orphaned | weakly linked | findable | canonical entry point |
| Historical value | none | weak | useful | required audit trail |

Penalties:

- −3 for dangerous commands or guidance contradicted by current code.
- −2 for pretending an old plan/status is current.
- −2 for a redundant file whose unique content fits in the canonical document.
- −1 for broken links, stale paths, temporary identifiers, or execution narration.

Interpretation:

- 11–15: `KEEP`, with small corrections if needed.
- 7–10: `UPDATE` or `MERGE`.
- 4–6: `ARCHIVE` only when history matters; otherwise `DELETE`.
- 0–3: `DELETE`.
- External truth required: `VERIFY`, regardless of score.

The score informs judgment; it never overrides a safety boundary.

## Keep

- Root agent onboarding and instruction documentation that still matches the project.
- Current architecture, API, schema, development, and operational guidance.
- AGENTS/CLAUDE/rules/skills that encode active agent behavior.
- Security, billing, sending, migration, recovery, and production runbooks.
- ADRs and completed plans that explain a still-relevant non-obvious constraint.
- Product intent clearly labeled as intent rather than implementation truth.

## Update

- A canonical agent document with stale commands, paths, names, or architecture.
- A useful runbook with drifted implementation details.
- A plan that should be labeled completed, superseded, or historical.
- A document mixing verified local facts with unverified production claims.

## Merge

- Multiple entry points explaining the same workflow.
- A temporary analysis whose unique conclusion belongs in README, architecture, ADR, or runbook.
- Repeated command lists that should derive from one canonical source.

Before merging, list every unique fact from the source and its destination. Update inbound links before trashing the source.

## Archive

Archive only if the repository already has a discoverable archive convention and the document retains real historical or compliance value. Archiving junk is not cleanup.

## Delete

- Empty, generated, accidental, or abandoned Markdown residue.
- Fully superseded implementation plans with no unique decision history.
- Point-in-time reports, pasted logs, temporary TODO dumps, or completed execution checklists with no reusable lesson.
- Exact duplicates and near-duplicates after preserving unique content.
- Documents describing removed code as current and offering no useful historical context.
- Unreferenced analyses whose conclusions are already canonical elsewhere.

## Protected deletion questions

Before `DELETE`, answer all of these with evidence:

1. Is every unique fact obsolete, duplicated, or valueless?
2. Could deletion hide a security, billing, migration, recovery, sending, or production constraint?
3. Are inbound links and references known?
4. Is there a canonical replacement when readers still need the topic?
5. Does Git preserve recoverability, and will `trash` be used locally?

If any answer is unclear, choose `UPDATE`, `MERGE`, or `VERIFY`.

## Required result row

```text
path | lines | purpose | truth status | overlap | verdict | evidence | reason
```

Never mark the audit complete with sampled rows or project-level guesses.
