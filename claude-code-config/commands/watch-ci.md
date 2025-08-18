---
allowed-tools: mcp__wait-timer__wait, Bash(gh :*), Bash(git :*), Read, LS, Grep, Task
description: Watch CI pipeline after commit and auto-fix errors intelligently.
---

After a commit is pushed:

1. Wait 30 seconds for GitHub Actions to start
2. Find the latest GitHub Actions run for current branch
3. Watch the run until completion
4. If the run fails:
   - Download and analyze log artifacts
   - Identify common CI errors (vector dimensions, Inngest auth, database issues, TypeScript errors)
   - Auto-correct the errors found
   - Commit the fixes and push
   - Recursively restart this process until CI passes
5. Clean up downloaded artifacts
6. Report final CI status

## Commands

- `gh run watch <run-id>` : to watch the run
