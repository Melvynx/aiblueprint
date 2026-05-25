# Sample Rule Files

Concrete examples of well-formed `.agents/rules/*.md` files. Copy and adapt.

---

## Example 1: `.agents/rules/changelog.md`

```markdown
# Changelog Rule

How and when to update CHANGELOG.md.

## When this applies
- Before opening any PR that changes user-facing behavior
- After merging a release branch

## Rules
- **ALWAYS** append entries under `## Unreleased` at the top of CHANGELOG.md
- Use the format: `- [type] description (#PR)` where type is `feat | fix | chore | docs | breaking`
- **NEVER** edit historical entries below `## Unreleased`
- On release, rename `## Unreleased` to `## vX.Y.Z - YYYY-MM-DD`

## Example
```
## Unreleased
- [feat] Add dark mode toggle (#142)
- [fix] Crash on empty search input (#145)
```
```

---

## Example 2: `.agents/rules/testing.md`

```markdown
# Testing Rule

Test conventions for this project.

## When this applies
- Writing new code
- Fixing bugs (write a failing test first)

## Rules
- **NEVER** merge a behavior change without a passing test
- Tests live next to the source: `src/foo.ts` -> `src/foo.test.ts`
- Use Vitest. Run with `pnpm test`
- Mock external APIs at the network layer (msw), not at the function level
- Coverage gate: 80% for new files, no regression on existing files
```

---

## Example 3: `.agents/rules/deployment.md`

```markdown
# Deployment Rule

Pre-deploy checklist and rollback policy.

## When this applies
- Promoting a build to production
- Tagging a release

## Rules
- **CRITICAL**: Run `pnpm build && pnpm test` locally before tagging
- Tags follow semver: `v1.2.3` (no `v1.2.3-final-final`)
- Migrations must be backward-compatible for one release cycle
- **NEVER** deploy on Friday after 3pm or weekends without sign-off

## Rollback
- `pnpm deploy:rollback <previous-tag>` reverts in under 2 minutes
- Always announce in #deploys before and after
```

---

## Example 4: `.agents/rules/git-workflow.md`

```markdown
# Git Workflow Rule

Branching, commits, and PR conventions.

## When this applies
- Every code change

## Rules
- Branch from `main`. Name: `<type>/<short-description>` (e.g. `feat/dark-mode`)
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- **NEVER** force-push to `main` or shared branches
- PRs need 1 approval + green CI before merge
- Squash merge by default. Merge commit only for release branches.
```

---

## Index entries in AGENTS.md

After creating any of the above, AGENTS.md must include a matching bullet:

```markdown
## Rules

The detailed rules live in `.agents/rules/`. Read the relevant file before acting:

- **Changelog** - [.agents/rules/changelog.md](.agents/rules/changelog.md) - When/how to update CHANGELOG.md
- **Testing** - [.agents/rules/testing.md](.agents/rules/testing.md) - Test conventions and coverage gates
- **Deployment** - [.agents/rules/deployment.md](.agents/rules/deployment.md) - Pre-deploy checklist and rollback
- **Git workflow** - [.agents/rules/git-workflow.md](.agents/rules/git-workflow.md) - Branching, commits, PRs
```

The bullet does three things at once:
1. Tells the agent the rule exists
2. Gives it a one-line summary so it knows when to load it
3. Provides the exact path to read
