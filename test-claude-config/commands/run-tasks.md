---
description: Run a task (issue)
---

## Get task

For the given "$ARGUMENTS" you need to get the information about the tasks you need to do :

- If it's a file path, get the path to get the instructions and the feature we want to create
- If it's an issues number or URL, fetch the issues to get the information (with `gh cli`) (update the issue with a label "processing")

Use the workflow `EPCT` to make this task.

## Explore

First, use parallel subagents to find and read all files that may be useful for implementing the ticket, either as examples or as edit targets. The subagents should return relevant file paths, and any other info that may be useful.

## Plan

Next, think hard and write up a detailed implementation plan. Don't forget to include tests, lookbook components, and documentation. Use your judgement as to what is necessary, given the standards of this repo.

If there are things you are not sure about, use parallel subagents to do some web research. They should only return useful information, no noise.

If there are things you still do not understand or questions you have for the user, pause here to ask them before continuing.

⚠️ If there is an issues link, please add a comment inside the issues with your plan. So we can discuss it and understand your plan.

## Code

When you have a thorough implementation plan, you are ready to start writing code. Follow the style of the existing codebase (e.g. we prefer clearly named variables and methods to extensive comments). Make sure to run our autoformatting script when you're done, and fix linter warnings that seem reasonable to you.

## Test

If there is tests in the project, create tests and run them. In any case, run linter and TypeScript to verify that you code work correctly.

If your changes touch the UX in a major way, use the browser to make sure that everything works correctly. Make a list of what to test for, and use a subagent for this step.

If your testing shows problems, go back to the planning stage and think ultra-hard.

## Create pull request

After the change is made, create a pull request with the changes and commit your changes following commitizen format.

Make the merge of the pull request actually close the issues.

## Write up your work

When you are happy with your work, write up a short report that could be used as the PR description. Include what you set out to do, the choices you made with their brief justification, and any commands you ran in the process that may be useful for future developers to know about with the link of the pull request.

Add in the issue a comment about the things you did.
