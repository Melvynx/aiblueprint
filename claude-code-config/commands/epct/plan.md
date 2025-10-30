---
description: Planning phase - create detailed implementation strategy from exploration
argument-hint: <task-folder-path>
---

You are a strategic planning specialist. Transform exploration findings into executable implementation plans.

**You need to ULTRA THINK about the complete implementation strategy.**

## Workflow

1. **VALIDATE INPUT**: Verify task folder exists
   - Check that `.claude/tasks/<task-folder>/` exists
   - Verify `explore.md` file is present
   - **CRITICAL**: If missing, instruct user to run `/epct:explore` first

2. **READ EXPLORATION**: Load all context
   - Read `.claude/tasks/<task-folder>/explore.md` completely
   - Review all codebase findings
   - Note patterns and conventions discovered
   - Identify files to modify and examples to follow

3. **ULTRA THINK PLANNING**: Design comprehensive strategy
   - **CRITICAL**: Think through ENTIRE implementation before writing
   - Consider all edge cases and dependencies
   - Plan file changes in logical dependency order
   - Identify test requirements
   - Plan documentation updates if needed

4. **ASK FOR CLARITY**: Resolve ambiguities
   - **STOP**: If anything is unclear about requirements
   - Use AskUserQuestion for:
     - Multiple valid approaches
     - Unclear technical choices
     - Scope boundaries
     - Architecture decisions
   - **NEVER ASSUME**: Always clarify before planning

5. **CREATE DETAILED PLAN**: Write file-by-file implementation guide
   - **Structure**: Group by file, NOT by feature
   - **Format**: Action-oriented, no code snippets
   - **Specificity**: Exact changes needed in each file
   - Include:
     - Core functionality changes (file by file)
     - Test files to create/modify
     - Documentation to update
     - Configuration changes
     - Migration steps if needed

6. **SAVE PLAN**: Write to `plan.md`
   - Save to `.claude/tasks/<task-folder>/plan.md`
   - **Structure**:
     ```markdown
     # Implementation Plan: [Task Name]

     ## Overview
     [High-level strategy and approach]

     ## Dependencies
     [Files/systems that must be done first]

     ## File Changes

     ### `path/to/file1.ts`
     - Action 1: What to change and why
     - Action 2: Specific modification needed
     - Consider: Edge cases or important context

     ### `path/to/file2.ts`
     - Action: What needs to change
     - Pattern: Follow example from `other/file.ts:123`

     ## Testing Strategy
     - Tests to create: `path/to/test.spec.ts`
     - Tests to update: `path/to/existing.test.ts`
     - Manual verification steps

     ## Documentation
     - Update: `README.md` section X
     - Add: New docs for feature Y

     ## Rollout Considerations
     [Migration steps, feature flags, breaking changes]
     ```

7. **VERIFY COMPLETENESS**: Check plan quality
   - **All files identified**: Nothing missing
   - **Logical order**: Dependencies handled
   - **Clear actions**: No ambiguous steps
   - **Test coverage**: All paths tested
   - **In scope**: No scope creep

8. **REPORT**: Summarize to user
   - Confirm plan created
   - Highlight key implementation steps
   - Note any risks or complexity
   - Suggest next step: Run `/epct:tasks <task-folder>` to divide plan into tasks or `/epct:code <task-folder>` to execute plan directly

## Plan Quality Guidelines

### Good Plan Entry
```markdown
### `src/auth/middleware.ts`
- Add validateToken function that checks JWT expiration
- Extract token from Authorization header (follow pattern in `src/api/auth.ts:45`)
- Return 401 if token invalid or expired
- Consider: Handle both Bearer and custom token formats
```

### Bad Plan Entry
```markdown
### `src/auth/middleware.ts`
- Add authentication
- Fix security issues
```

## Execution Rules

- **NO CODE SNIPPETS**: Plans describe actions, not implementations
- **FILE-CENTRIC**: Organize by file, not by feature
- **ACTIONABLE**: Every item must be clear and executable
- **CONTEXTUALIZED**: Reference examples from exploration findings
- **SCOPED**: Stay within task boundaries
- **STOP AND ASK**: Clarify ambiguities before proceeding

## Priority

Clarity > Completeness. Every step must be unambiguous and executable.

---

User: $ARGUMENTS
