# Verification Harnesses For Refactors

Use this reference when a Goal involves refactoring, deletion, migration, moving files, eliminating a pattern, or reducing a code smell. The core tactic is to create a small measurable harness before the main work, then make the Goal continue until the harness reaches the target.

## Principle

For broad changes, do not rely only on subjective review. Convert the desired end state into a number, list, or deterministic command result.

Examples:

- Remove all explicit TypeScript `any` -> count explicit `any` occurrences and require `0`.
- Delete dead files -> scan imports/references and require no references to removed paths.
- Move a module -> scan imports and require all imports use the new path.
- Rename an API -> count old symbol references and require `0`, then run tests/typecheck.
- Remove a dependency -> scan package manifests and lockfiles, then run install/typecheck/test.
- Split a large file -> check file size or exported symbol boundaries, then run typecheck/test.

The harness should make progress visible after every iteration.

## Harness Rules

1. First establish the baseline count or failure list before editing.
2. Prefer existing repo tooling: tests, lint rules, typecheck, dependency analyzers, codemods, static analyzers.
3. If no existing command measures the target, create a narrow validation script.
4. Make the script deterministic and fast enough to run repeatedly.
5. Exclude generated, vendored, build output, lockfiles, snapshots, and irrelevant binary assets unless the task explicitly includes them.
6. Print actionable output: total count, grouped files, and the top remaining offenders.
7. Exit with code `0` only when the target condition is met. Exit non-zero while work remains.
8. Keep the harness scoped to the Goal. Remove temporary harnesses before completion unless they are useful project validation and the user or repo conventions support keeping them.

## Goal Pattern

Use this shape for count-based refactor Goals:

```text
<desired refactor>, verified by `<validation command>` returning success with <target count/list condition>, while preserving <tests/typecheck/public behavior>. First establish the baseline with `<validation command>` and inspect the highest-signal offenders. Work in checkpoints: after each batch, rerun `<validation command>`, record the count/list delta, run the narrowest relevant tests, and continue until the validation command exits 0. If the target cannot be reached safely, stop with the remaining offenders, attempted paths, failing output, and the decision needed.
```

Example:

```text
Remove all explicit TypeScript `any` from the codebase, verified by `node scripts/check-explicit-any.mjs` exiting 0 with count 0, while keeping `pnpm typecheck` and relevant tests green. First run the checker to record the baseline and prioritize files with the most occurrences. Work in checkpoints: after each batch, rerun the checker, record the remaining count, and run the narrowest relevant typecheck/tests. Continue until the checker exits 0. If some `any` cannot be removed safely, stop with the remaining locations, attempted replacements, compiler/test output, and the type information needed.
```

## Script Patterns

Use structured parsers when reasonable. For TypeScript, prefer the TypeScript compiler API, `ts-morph`, ESLint, or an existing lint rule over raw text search when false positives matter.

For a quick bootstrap harness, a text scanner is acceptable if the Goal explicitly treats it as an approximate first pass and follows up with typecheck/lint.

Example quick scanner:

```js
#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules", "dist", "build", ".next", "coverage"]);
const extensions = new Set([".ts", ".tsx"]);
const matches = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (!ignoredDirs.has(entry)) walk(path);
      continue;
    }
    if (![...extensions].some((ext) => path.endsWith(ext))) continue;
    const text = readFileSync(path, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (/\bany\b/.test(line)) matches.push(`${path.replace(`${root}/`, "")}:${index + 1}: ${line.trim()}`);
    });
  }
}

walk(root);

console.log(`explicit_any_count=${matches.length}`);
for (const match of matches.slice(0, 50)) console.log(match);
if (matches.length > 50) console.log(`...and ${matches.length - 50} more`);
process.exit(matches.length === 0 ? 0 : 1);
```

## Refactor Targets

For deletion Goals, verify both absence and behavior:

- target files or symbols are gone
- no imports, string references, routes, config entries, docs links, or tests point to them
- typecheck/build/test still passes

For moving Goals, verify all call sites:

- old import path count is `0`
- new import path exists where expected
- public exports remain compatible unless changing them is part of the Goal
- typecheck/build/test still passes

For migration Goals, verify old surface removal and new surface behavior:

- old package/API/pattern count reaches `0` or the explicitly allowed exception list
- new package/API/pattern is used consistently
- tests/typecheck/build pass
- manual or browser verification is included when behavior is visual or interactive
