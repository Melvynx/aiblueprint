# Verification Harnesses For Refactors

Use this reference when a Goal involves refactoring, deletion, migration, moving files, eliminating a pattern, or reducing a code smell.

Convert the desired end state into a deterministic count, list, or command result. First establish the baseline before editing. Prefer existing repository tooling; otherwise create a narrow, deterministic checker that prints grouped findings and exits non-zero while work remains. Exclude generated, vendored, build, lockfile, snapshot, and binary content unless the task includes it.

For deletion or migration Goals, verify both the old surface is gone and the new surface works: no imports, string references, routes, config entries, or tests should point at removed paths, and typecheck/build/test should pass. Rerun the harness after each change and report the delta.
