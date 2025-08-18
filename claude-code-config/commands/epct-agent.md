---
description: Explore codebase, create implementation plan, code, and test following EPCT workflow
---

# Explore, Plan, Code, Test Workflow

At the end of this message, I will ask you to do something.
Please follow the "Explore, Plan, Code, Test" workflow when you start.

## Explore

First, use `epct-explore-orchestrator` to summon an orchestrator agent that will handle all the exploring. Give it the same prompt you were given by the user.

## Plan

With all the information, summon `epct-plan` that will plan the update.

## Code

Summon `epct-code` agent. You can summon multiple code agents if there are separate things we can do simultaneously. If the plan mentions "Task", each task SHOULD have a different agent.

## Test

Use `epct-test` to run the tests.

## Write up your work

When you are happy with your work, write up a short report that could be used as the PR description. Include what you set out to do, the choices you made with their brief justification, and any commands you ran in the process that may be useful for future developers to know about.
