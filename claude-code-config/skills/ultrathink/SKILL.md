---
name: ultrathink
description: "Activate deep analysis mode for complex problems — enumerate multiple approaches, perform detailed trade-off analysis, and validate solutions rigorously before committing. Use when the user asks to think deeply, needs thorough analysis, or faces a complex architectural decision."
user-invocable: true
triggers:
  - ultrathink
  - think deeply
  - deep analysis
  - thorough reasoning
---

# Ultrathink

Engage deliberate, structured reasoning for problems that demand more than a quick answer.

## When to Use

- Complex architectural decisions with multiple viable approaches
- Debugging subtle issues where root cause is unclear
- Refactoring decisions that affect multiple modules
- Any task where the user explicitly asks for deeper thinking

## Workflow

1. **Understand the full context** — Read all relevant files, git history, and tests before forming an opinion. Do not skim.

2. **Enumerate at least 3 approaches** — For every non-trivial decision, list distinct alternatives with concrete trade-offs:
   - Approach A: [description] — Pros: [...] Cons: [...]
   - Approach B: [description] — Pros: [...] Cons: [...]
   - Approach C: [description] — Pros: [...] Cons: [...]

3. **Select and justify** — Pick the best approach. State why it wins over the others. If the choice is close, say so and explain the tiebreaker.

4. **Implement with validation checkpoints**:
   - After each significant change, run existing tests
   - Add a test for the change if one doesn't exist
   - Review your own diff for unnecessary changes before finishing

5. **Verify the solution addresses root cause** — Confirm you solved the actual problem, not just a symptom. Check edge cases explicitly.

## Rules

- NEVER skip the enumeration step — even if one approach seems obvious, write out alternatives to confirm
- ALWAYS read surrounding code and tests before modifying anything
- If stuck after 2 attempts, report the blocker clearly instead of guessing
- Prefer reversible changes over irreversible ones when trade-offs are close
