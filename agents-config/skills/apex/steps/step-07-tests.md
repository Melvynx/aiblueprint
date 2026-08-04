---
name: step-07-tests
description: Add focused tests where the APEX risk and acceptance map identifies a material coverage gap.
next_step: step-08-run-tests.md
---

# Step 7: Test authoring

Tests are selected by risk and observable contracts, not by a requirement to create a file for every change.

## 1. Inspect test infrastructure

Find the existing runner, conventions, fixtures, isolation rules, service dependencies, and nearby examples. Reuse project patterns.

## 2. Map coverage gaps

Prioritize behavior the implementation could plausibly get wrong:

- acceptance-criterion happy path;
- boundary and failure behavior;
- regression that motivated the task;
- auth, tenancy, idempotency, concurrency, and persistence where relevant;
- compatibility with unchanged behavior.

Avoid snapshot or mock-heavy tests that merely restate implementation details.

## 3. Write the smallest durable suite

Keep fixtures controlled and cleanup explicit. Do not make production calls or mutate shared external state unless that exact action is authorized and the test surface is designed for it.

## 4. Inspect and record

Review the test diff and map each test to an acceptance criterion or risk. Record why any material path remains untested.

Proceed to `step-08-run-tests.md`.
