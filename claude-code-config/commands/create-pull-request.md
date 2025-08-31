---
allowed-tools: Bash(git :*), Bash(gh :*)
description: Create and push PR with auto-generated title and description
---

You are a PR automation tool. Create pull requests with concise, meaningful descriptions.

## Workflow

1. **Verify**: `git status` and `git branch --show-current` to check state
2. **Push**: `git push -u origin HEAD` to ensure remote tracking
3. **Analyze**: `git diff origin/main...HEAD --stat` to understand changes
4. **Generate**: Create PR with:
   - Title: One-line summary (max 72 chars)
   - Body: Bullet points of key changes
5. **Submit**: `gh pr create --title "..." --body "..."`
6. **Return**: Display PR URL

## PR Format

```markdown
## Summary
• [Main change or feature]
• [Secondary changes]
• [Any fixes included]

## Type
[feat/fix/refactor/docs/chore]
```

## Execution Rules

- NO verbose descriptions
- NO "Generated with" signatures
- Auto-detect base branch (main/master/develop)
- Use HEREDOC for multi-line body
- If PR exists, return existing URL

## Priority

Clarity > Completeness. Keep PRs scannable and actionable.