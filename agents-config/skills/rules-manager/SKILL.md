---
name: rules-manager
description: Create, edit, and maintain AGENTS.md and .agents/rules/. Use when adding, modifying, restructuring, or optimizing project rules, conventions, or constraints.
argument-hint: "[init | add <rule-name> | edit | optimize | task description]"
disable-model-invocation: true
user-invocable: true
---

Manage the two-tier rule system: the always-loaded index plus modular files. Every modular file must be linked from the index or agents will not find it.

Open [agents-vs-claude.md](references/agents-vs-claude.md) before choosing `AGENTS.md` + `.agents/rules/` versus `CLAUDE.md` + `.claude/rules/`, path-scoped `paths:` frontmatter, or dual-format setup. Run the same workflows against the chosen pair. Open [examples.md](references/examples.md) before writing a new rule file or index skeleton.

Never overwrite existing files without asking. Never write a rule file without confirming its content. Default new rules to a modular file (20–60 lines); put 1–2 line constraints in Universal Rules. When the user names index content (stack, commands, universal rules), edit that file in place. Write specific prohibitions. Do not add generic best practices, linter-enforced rules, or facts the agent can read from the code.

`init`: read package manifests; if the index or rules directory exists, ask before writing; create a <40-line index with an empty Rules section and the rules directory.

`add <name>`: slugify the name; `init` if no index; ask what it enforces and when it applies; write the modular file; add one index bullet whose path matches the file.

`edit`: change only the named index section; keep every modular-file link intact.

`optimize`: inventory index vs files (flag orphans and broken links); strip linter-enforced, generic, verbose, and code-derivable rules; compress to bullets; show the diff and wait. Targets: index <80 lines, each rule <60.

A free-form request is `add` with a derived name. Ask 1–2 scope questions if the rule is unclear.
