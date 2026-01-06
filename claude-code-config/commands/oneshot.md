---
description: Ultra-fast feature implementation - Explore then Code then Test
argument-hint: <feature-description>
---

<objective>
Implement #$ARGUMENTS at maximum speed using the OneShot methodology.

This workflow prioritizes rapid delivery through surgical exploration, immediate implementation, and focused validation. Speed over completeness - ship fast, iterate later.
</objective>

<process>
1. **EXPLORE** (5-10 min max):
   - Launch 1-2 parallel subagents maximum to find relevant files
   - Use `explore-codebase` for codebase search
   - Use `explore-docs` ONLY if library-specific knowledge needed
   - Find files to use as examples or edit targets
   - Be surgical - know exactly what to search for
   - NO PLANNING PHASE - gather context and move to coding

2. **CODE** (implement immediately):
   - Start coding as soon as basic context available
   - Follow existing codebase patterns and style
   - Prefer clear variable/method names over comments
   - Stay STRICTLY in scope - change only what's needed
   - NO comments unless absolutely necessary
   - NO refactoring beyond feature requirements
   - Run autoformatting scripts when done
   - Fix reasonable linter warnings as you go

3. **TEST** (validate quality):
   - Check package.json for available scripts (lint, typecheck, format)
   - Run: `npm run lint && npm run typecheck` (or equivalent)
   - If checks fail: fix errors immediately and re-run
   - Stay in scope - don't run full test suite unless requested
   - For major changes only: run relevant tests with `npm test -- <pattern>`
     </process>

<rules>
**Critical constraints:**
- SPEED IS PRIORITY: Move fast, break nothing
- NO PLANNING: Trust exploration and code directly
- PARALLEL AGENTS: Max 2 agents during explore phase
- MINIMAL TESTS: Lint + typecheck only (unless user requests more)
- STAY FOCUSED: Implement exactly what's requested, nothing more
- ULTRA THINK: Always engage deep reasoning for optimal solutions
- If stuck or uncertain: ask user immediately instead of over-exploring
</rules>

<success_criteria>

- Feature implemented following existing codebase patterns
- Code passes linting and type checking
- Implementation stays strictly within requested scope
- No unnecessary comments or refactoring
- Autoformatting applied where available
  </success_criteria>
