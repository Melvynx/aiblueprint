---
name: step-00b-save
description: Configure APEX artifact detail while preserving the always-on minimal run record.
---

# Artifact policy

Minimal machine-readable state is always written under `.agents/apex/runs/<run-id>/`.

With `-s`, set `{artifact_policy}=verbose` and additionally preserve useful human-readable analysis, plans, command summaries, review findings, and proof galleries in `{run_dir}/artifacts/`.

Without `-s`, keep `{artifact_policy}=minimal`: write only the run state, event log, checkpoints, task graph, evidence index, and artifacts required to support claims.

For every artifact, record:

- stable ID and type;
- producing phase or task;
- repository revision and environment;
- timestamp and relative path;
- whether a later change invalidated it.

Never copy secrets, credentials, full environment files, or unnecessary personal data into artifacts.

Set `{artifact_applied}=true` and return to `step-00-init.md`.
