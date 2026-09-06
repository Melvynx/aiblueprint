---
name: apex
description: Run adaptive APEX implementation with scoped delegation, durable checkpoints, risk-based tests and review, and proof-backed verification. Use for features, bug fixes, migrations, or code changes requiring disciplined execution.
disable-model-invocation: true
metadata:
  opencode/autoinvoke: "false"
  opencode/slash: "true"
---

Implement through Analyze → Plan → Execute → eXamine. The task contract, repository state, authority, and evidence are the source of truth.

Load only the current step and any reference it names. Start with `steps/step-00-init.md`. Persist run state with `scripts/apex-state.py` under `.agents/apex/runs/<run-id>/`. Never store secrets in run state.

Flags express intent; they do not force a vendor implementation. `-a`/`-A` interaction low/standard. `-x`/`-X` review adversarial/risk-based. `-s`/`-S` artifacts verbose/minimal. `-t`/`-T` new tests on/off. `-v`/`-V` runtime proof on/off. `-e`/`-E` budget low/standard. `-b`/`-B` branch on/off. `-pr`/`-PR` pull request on/off. `-i` configure interactively. `-k`/`-K` expanded artifacts on/off. `-m`/`-M` prefer-parallel/direct. `-r <id>` resume a checkpoint.

1. Contract — `steps/step-00-init.md` (interactive `00b-interactive`, branch `00b-branch`, budget `00b-economy`, artifacts `00b-save`)
2. Analyze — `steps/step-01-analyze.md`
3. Plan — `steps/step-02-plan.md` (expanded graph `02b-tasks`)
4. Execute — `steps/step-03-execute.md` (teams `03-execute-teams`)
5. Validate — `steps/step-04-validate.md`
6. Examine / resolve — `steps/step-05-examine.md`, `steps/step-06-resolve.md`
7. Tests when required — `steps/step-07-tests.md`, `steps/step-08-run-tests.md`
8. Prove when required — `steps/step-10-verify.md`
9. Handoff — `steps/step-09-finish.md`

Delegate only bounded, independent work. Record objective, allowed files, forbidden scope, done evidence, and stop condition. Returned work is untrusted until the coordinator inspects the diff. Re-plan when evidence invalidates an assumption. Preserve unrelated local changes.

Finish only when the requested implementation is present, acceptance criteria have current evidence, introduced failures are resolved, required review is done, and delivery actions have authoritative read-back.
