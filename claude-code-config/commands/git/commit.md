---
description: Quick commit and push with minimal, clean messages
model: haiku
allowed-tools: Bash(git :*), Bash(npm :*), Bash(pnpm :*)
---

<objective>
Quickly analyze git changes and create a conventional commit message following the commitizen format (e.g., "update(statusline): refresh spend data"). This command prioritizes speed and efficiency for straightforward commits.
</objective>

<context>
Git state: !`git status`
Staged changes: !`git diff --cached --stat`
Unstaged changes: !`git diff --stat`
Recent commits: !`git log --oneline -5`
Current branch: !`git branch --show-current`
</context>

<process>
1. **Analyze changes**: Review git status to determine what needs to be committed
   - If nothing staged but unstaged changes exist: stage all changes with `git add .`
   - If nothing to commit: inform user and exit

2. **Determine commit type and scope**:
   - Types: `feat`, `fix`, `update`, `docs`, `chore`, `refactor`, `test`, `perf`, `revert`
   - Scope: Identify the main area affected (e.g., `statusline`, `auth`, `api`, `ui`, `commands`)
   - Use `update` for refreshing/updating existing features
   - Use `feat` for new features
   - Use `fix` for bug fixes

3. **Generate commit message**:
   - Format: `type(scope): brief description`
   - Keep it under 72 characters
   - Use imperative mood ("add" not "added")
   - Start description with lowercase
   - Be specific but concise
   - Example: `update(statusline): refresh spend data`

4. **Create commit**: Execute `git commit -m "message"` immediately with the generated message

5. **Push changes**: After successful commit, push to remote with `git push`
</process>

<success_criteria>
- Changes properly staged if needed
- Commit message follows format: `type(scope): description`
- Commit created successfully
- Changes pushed to remote
- No errors during git operations
</success_criteria>

<rules>
- **SPEED OVER PERFECTION**: Generate one good commit message and commit immediately
- **NO INTERACTION**: Never use AskUserQuestion - just analyze and commit
- **AUTO-STAGE**: If changes exist but nothing staged, stage everything
- **AUTO-PUSH**: Always push after committing
- **MINIMAL OUTPUT**: Brief confirmation of what was committed
- **IMPERATIVE MOOD**: Use "add", "update", "fix", not past tense
- **LOWERCASE**: Description starts lowercase after colon
</rules>
