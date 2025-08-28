---
description: Watch CI pipeline after a commit and auto-fix errors
---

When this command runs, follow the workflow below:

1. Wait 30 seconds for GitHub Actions to start
2. Find the latest GitHub Actions run for the current branch
3. Watch the run until completion
4. If the run fails:

- Inspect the run logs
- Identify CI errors
- Download any artifact files
- Think carefully and plan an update
- Update the code
- Commit the fixes and push them
- Return to step `1` to verify that CI is now passing

5. If the run succeeds:

- Clean up downloaded artifacts
- Report the final CI results
- Report all modifications you made to achieve this success

## Commands

- Wait: `wait 30`
- Watch GitHub Actions run: `gh run watch <run-id>`
