---
description: Systematic implementation using APEX methodology (Analyze-Plan-Execute-eXamine)
---

<objective>
Implement #$ARGUMENTS using the systematic APEX workflow to ensure thorough analysis, detailed planning, clean execution, and proper verification.

This methodology helps developers deliver high-quality features by breaking complex tasks into four distinct phases: Analyze (gather context), Plan (create strategy), Execute (implement), and eXamine (verify).
</objective>

<context>
Current git status: !`git status 2>/dev/null || echo "Not a git repository"`
Current branch: !`git branch --show-current 2>/dev/null || echo "Not a git branch"`
</context>

<process>

## Phase 1: ANALYZE

**Goal**: Find all relevant files and context for implementation

1. **Think deeply** before launching agents - know exactly what to search for
2. Launch **parallel subagents** to gather context:
   - `explore-codebase` agent to search codebase for relevant patterns
   - `websearch` agent to gather online information if needed
   - `explore-docs` agent to search documentation for API usage
3. Find files to use as **examples** or **edit targets**
4. Identify relevant file paths and useful context

**Output clear heading**: `# 1. ANALYZE`

## Phase 2: PLAN

**Goal**: Create detailed implementation strategy

1. Write comprehensive implementation plan including:
   - Core functionality changes
   - Test coverage requirements
   - Lookbook components if needed
   - Documentation updates
2. **STOP and ASK** user if anything remains unclear using `AskUserQuestion` tool
3. Get user approval before proceeding to execution

**Output clear heading**: `# 2. PLAN`

## Phase 3: EXECUTE

**Goal**: Implement following existing patterns

1. Follow existing codebase style:
   - Prefer clear variable/method names over comments
   - Match existing patterns and conventions
2. **CRITICAL RULES**:
   - Stay **STRICTLY IN SCOPE** - change only what's needed
   - NO comments unless absolutely necessary
   - Run autoformatting scripts when done
   - Fix reasonable linter warnings
3. Use parallel execution where possible for speed

**Output clear heading**: `# 3. EXECUTE`

## Phase 4: EXAMINE

**Goal**: Verify changes work correctly

1. **Check package.json** for available scripts (lint, typecheck, test, format, build)
2. Run relevant validation commands:
   - `npm run lint` - Fix any linting issues
   - `npm run typecheck` - Ensure type safety
   - `npm run format` - Format code consistently
3. Run **ONLY tests related to your feature** (stay in scope)
4. For major UX changes:
   - Create test checklist for affected features only
   - Use browser agent to verify specific functionality if needed
5. **If tests fail**: Return to PLAN phase and rethink approach

**Output clear heading**: `# 4. EXAMINE`

</process>

<verification>
Before completing each phase:
- **Analyze**: Confirmed all relevant files and patterns found
- **Plan**: User has approved the implementation strategy
- **Execute**: Code follows existing patterns, stays in scope, no unnecessary comments
- **Examine**: All validation scripts pass, tests related to changes pass
</verification>

<success_criteria>

- All four phases completed in order with clear headings
- Deep thinking applied at each phase transition
- Implementation stays strictly within task boundaries
- Code passes linting, type checking, and relevant tests
- Follows repository standards for code style and patterns
- No scope creep - only changed what was needed
- Correctness prioritized over speed
  </success_criteria>

<execution_rules>
**Critical principles**:

- **Always ULTRA THINK** before acting
- Use parallel execution for speed where possible
- Think deeply at each phase transition
- Never exceed task boundaries
- Test ONLY what you changed
- Priority: Correctness > Completeness > Speed
  </execution_rules>
