---
allowed-tools: Bash(gh :*), Bash(git :*)
argument-hint: <issue-number|issue-url|file-path>
description: Execute GitHub issues or task files with full EPCT workflow and PR creation
---

<objective>
Execute #$ARGUMENTS using adaptive APEX workflow (Analyze → Plan → Execute → eXamine) with automatic PR creation.

This command handles any task input: GitHub issues, file paths, or direct descriptions. It adapts complexity based on task size - lightweight for bug fixes, comprehensive for features. Optimized for CI/automated environments.
</objective>

<context>
Current branch: !`git branch --show-current`
Git status: !`git status --short`
Recent commits: !`git log --oneline -5 2>/dev/null || echo "No commits yet"`
</context>

<process>

## 0. INITIALIZE

**Parse input and setup environment:**

1. **Detect input type** from #$ARGUMENTS:
   - **Issue number** (e.g., `123`): Fetch with `gh issue view 123`
   - **Issue URL** (e.g., `https://github.com/.../issues/123`): Extract number, fetch with `gh issue view`
   - **File path** (e.g., `tasks/feature.md`): Read file content
   - **Direct description**: Use as-is

2. **For GitHub issues**:
   - Add processing label: `gh issue edit <number> --add-label "in-progress"`
   - Extract: title, description, labels, comments

3. **Assess task complexity** (determines workflow depth):
   - **Simple** (typo, config change, small fix): Skip to Execute phase
   - **Medium** (bug fix, small feature): Light exploration + execute
   - **Complex** (new feature, refactor): Full APEX workflow

4. **Setup branch**:
   - If on `main`/`master`: Create branch `git checkout -b feat/<task-slug>`
   - If on feature branch with uncommitted changes: Ask to continue or stash
   - If on feature branch with commits: Ask to continue or create new branch

## 1. ANALYZE (skip for simple tasks)

**Goal**: Gather context efficiently

- Launch **parallel** `explore-codebase` agents for:
  - Related files and patterns
  - Similar implementations to use as examples
  - Test file locations
- Use `explore-docs` agent if external library knowledge needed
- Use `websearch` agent only if truly necessary

**Output**: Mental map of files to modify and patterns to follow

## 2. PLAN (skip for simple tasks)

**Goal**: Define implementation strategy

1. Create concise implementation plan:
   - Files to modify/create
   - Key changes per file
   - Test approach

2. **For GitHub issues**: Post plan as comment

   ```
   gh issue comment <number> --body "## Implementation Plan

   - [ ] Change 1
   - [ ] Change 2
   - [ ] Tests

   Starting implementation..."
   ```

3. **If ambiguity exists**: Ask user ONE focused question, then proceed

## 3. EXECUTE

**Goal**: Implement changes following codebase patterns

1. **Create TodoWrite** with specific tasks (1 per file change)

2. **For each change**:
   - Read target file first
   - Match existing code style exactly
   - Use clear names over comments
   - Stay strictly in scope

3. **Code quality rules**:
   - NO comments unless truly necessary
   - NO refactoring beyond task scope
   - NO extra features
   - Run formatters after changes

## 4. EXAMINE

**Goal**: Validate implementation

1. **Check package.json** for available scripts

2. **Run validation** (in order, stop on failure):

   ```bash
   npm run format 2>/dev/null || true
   npm run lint
   npm run typecheck
   ```

3. **Run relevant tests only**:
   - Find test file for modified code
   - Run: `npm test -- --testPathPattern="<pattern>"` or equivalent
   - Don't run full suite unless necessary

4. **If validation fails**:
   - Fix errors immediately
   - Re-run validation
   - If stuck after 2 attempts: report blocker to user

## 5. FINALIZE (always execute)

**Goal**: Create PR and update tracking

1. **Stage and commit**:

   ```bash
   git add -A
   git commit -m "<type>(<scope>): <description>

   <body if needed>

   Closes #<issue-number>"
   ```

   Commit types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

2. **Push and create PR**:

   ```bash
   git push -u origin HEAD
   gh pr create --fill --body "## Summary
   <what was done>

   ## Changes
   - <change 1>
   - <change 2>

   ## Test Plan
   - [x] Lint passes
   - [x] Types pass
   - [x] Relevant tests pass

   Closes #<issue-number>"
   ```

3. **Update GitHub issue** (if applicable):

   ```bash
   gh issue comment <number> --body "✅ Implementation complete

   **PR**: <pr-url>
   **Changes**: <brief summary>

   Ready for review."
   ```

4. **Return PR URL** to user

</process>

<adaptive_behavior>
**Task size detection heuristics:**

| Signal             | Likely Simple                   | Likely Complex                         |
| ------------------ | ------------------------------- | -------------------------------------- |
| Keywords           | "typo", "rename", "update text" | "implement", "add feature", "refactor" |
| Scope              | Single file mentioned           | Multiple components                    |
| Issue labels       | `bug`, `docs`, `chore`          | `feature`, `enhancement`               |
| Description length | < 100 chars                     | > 500 chars                            |

**Workflow adaptation:**

- Simple: Initialize → Execute → Examine → Finalize
- Medium: Initialize → Light Analyze → Execute → Examine → Finalize
- Complex: Full workflow with all phases
  </adaptive_behavior>

<error_handling>
**Common blockers and responses:**

- **Lint/type errors**: Fix immediately, max 3 attempts
- **Test failures**: Debug, fix, document if unfixable
- **Merge conflicts**: Report to user, don't auto-resolve
- **Missing context**: Use explore agents, ask user if still unclear
- **CI blocked**: Wait and retry once, then report

**If blocked**: Report clearly what's blocking and what's needed
</error_handling>

<success_criteria>

- Task requirements fully addressed
- Code passes lint, typecheck, relevant tests
- PR created with clear description
- GitHub issue updated (if applicable)
- PR URL returned to user
  </success_criteria>

<execution_rules>

- **ULTRA THINK** at phase transitions
- **Parallel execution** for speed (agents, independent commands)
- **Stay in scope** - implement exactly what's requested
- **Always create PR** - even for small fixes
- **Priority**: Correctness > Completeness > Speed
- **Automated-friendly**: Minimize user prompts, proceed with sensible defaults
  </execution_rules>
