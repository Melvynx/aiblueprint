---
name: apex
description: Systematic implementation using APEX methodology (Analyze-Plan-Execute-eXamine) with parallel agents, self-validation, and optional adversarial review. Use when implementing features, fixing bugs, or making code changes that benefit from structured workflow.
argument-hint: "[-a] [-x] [-s] [-t] [-v] [-b] [-pr] [-i] [-m] [-r <task-id>] <task description>"
---

<objective>
Execute systematic implementation workflows using the APEX methodology with progressive step loading.
</objective>

<quick_start>

```bash
/apex add authentication middleware           # Basic
/apex -a -s implement user registration       # Autonomous + save
/apex -a -x -s fix login bug                  # With adversarial review
/apex -a -v implement user dashboard          # With feature verification
/apex -a -m implement full auth system        # Agent Teams (parallel)
/apex -a -x -s -t -v add auth middleware      # Full workflow with tests + verify
/apex -a -pr add auth middleware              # With PR creation
/apex -r 01-auth-middleware                   # Resume previous task
/apex -e add auth middleware                  # Economy mode (save tokens)
/apex -i add auth middleware                  # Interactive flag config
```

</quick_start>

<flags>
**Enable (lowercase ON) / Disable (UPPERCASE OFF):**

| ON | OFF | Long | Description |
|----|-----|------|-------------|
| `-a` | `-A` | `--auto` | Skip confirmations, auto-approve |
| `-x` | `-X` | `--examine` | Adversarial code review |
| `-s` | `-S` | `--save` | Save outputs to `.claude/output/apex/` |
| `-t` | `-T` | `--test` | Include test creation + runner |
| `-v` | `-V` | `--verify` | Launch app and verify feature works |
| `-e` | `-E` | `--economy` | No subagents, save tokens |
| `-b` | `-B` | `--branch` | Verify not on main, create branch |
| `-pr` | `-PR` | `--pull-request` | Create PR at end (enables -b) |
| `-i` | | `--interactive` | Configure flags via menu |
| `-k` | `-K` | `--tasks` | Task breakdown with dependencies |
| `-m` | `-M` | `--teams` | Agent Teams parallel execution (enables -k) |
| `-r` | | `--resume` | Resume from previous task ID |

**Parsing:** Defaults from `steps/step-00-init.md`, flags override, remainder = `{task_description}`, ID = `NN-kebab-case`.
</flags>

<workflow>
1. **Init** → Parse flags, setup state
2. **Analyze** → Context gathering (1-10 parallel agents)
3. **Plan** → File-by-file strategy + TaskList creation
4. **Tasks** → Task breakdown (if -k or -m)
5. **Execute** → Implementation (standard or Agent Teams if -m)
6. **Validate** → Typecheck, lint, tests
7. **Tests** → Create + run tests (if -t)
8. **Examine** → Adversarial review (if -x) - Security + Logic + Clean Code + Thermo-Nuclear maintainability audit in parallel
9. **Resolve** → Fix findings (if examine found issues)
10. **Verify** → Launch app, test feature (if -v)
11. **Finish** → Create PR (if -pr)
</workflow>

<step_files>

| Step | File | Purpose |
|------|------|---------|
| 00 | `steps/step-00-init.md` | Parse flags, initialize state |
| 00b | `steps/step-00b-save.md` | Setup save output structure (if -s) |
| 00b | `steps/step-00b-branch.md` | Git branch setup (if -b) |
| 00b | `steps/step-00b-economy.md` | Economy mode overrides (if -e) |
| 00b | `steps/step-00b-interactive.md` | Interactive flag config (if -i) |
| 01 | `steps/step-01-analyze.md` | Smart context gathering |
| 02 | `steps/step-02-plan.md` | File-by-file plan + TaskList |
| 02b | `steps/step-02b-tasks.md` | Task breakdown (if -k/-m) |
| 03 | `steps/step-03-execute.md` | Todo-driven implementation |
| 03t | `steps/step-03-execute-teams.md` | Agent Team execution (if -m) |
| 04 | `steps/step-04-validate.md` | Self-check and validation |
| 05 | `steps/step-05-examine.md` | Adversarial code review |
| 06 | `steps/step-06-resolve.md` | Finding resolution |
| 07 | `steps/step-07-tests.md` | Test analysis and creation |
| 08 | `steps/step-08-run-tests.md` | Test runner loop |
| 09 | `steps/step-09-finish.md` | Create pull request |
| 10 | `steps/step-10-verify.md` | Launch & verify feature |

</step_files>

<state_variables>

| Variable | Type | Set by |
|----------|------|--------|
| `{task_description}` | string | step-00 |
| `{feature_name}` | string | step-00 |
| `{task_id}` | string | step-00 / step-00b-save |
| `{acceptance_criteria}` | list | step-01 |
| `{auto_mode}` | boolean | step-00 |
| `{examine_mode}` | boolean | step-00 |
| `{save_mode}` | boolean | step-00 |
| `{test_mode}` | boolean | step-00 |
| `{verify_mode}` | boolean | step-00 |
| `{economy_mode}` | boolean | step-00 |
| `{branch_mode}` | boolean | step-00 |
| `{pr_mode}` | boolean | step-00 |
| `{tasks_mode}` | boolean | step-00 |
| `{teams_mode}` | boolean | step-00 |
| `{output_dir}` | string | step-00b-save |
| `{branch_name}` | string | step-00b-branch |

</state_variables>

<execution_rules>
- **Load one step at a time** (progressive loading)
- **ULTRA THINK** before major decisions
- **Persist state variables** across all steps
- **Follow next_step directive** at end of each step
- **Save outputs** if `{save_mode}` = true (each step appends to its file)
- **Use parallel agents** for independent exploration (step-01)
- **Use online research intentionally**: default harness tools for local code first, `/Users/melvynx/.agents/skills/find-docs/SKILL.md` for current technical docs, and `/Users/melvynx/.agents/skills/exa-search/SKILL.md` for broader web research or cited sources
</execution_rules>

<entry_point>
**FIRST ACTION:** Load `steps/step-00-init.md`
</entry_point>
