---
allowed-tools: Bash(git :*), Bash(gh :*)
description: Create a pull request for the current branch
---

You're task is to create a pull request with the current changes.

Follow the workflow :

1. Check git status and current branch
   - If we are on branch `main` you SHOULD create a new branch. To name the new branch look at the diff and find a good name following `feat/<feature-name>`.
2. Ensure the branch is pushed to remote
3. Get the diff between current branch and main/master
4. Analyze changes to create meaningful PR title and description

The description should be short with only IMPORTANT information. Following this format :

<pull-request-format>

_Explain briefly the problems that we try to resolve_

### Solution

_Explain what we include in our solution, keep thing simple_

Optional : add notes to explain why we did this

</pull-request-format>

5. Create pull request using `gh pr create` with proper title and body
6. Return the PR URL
