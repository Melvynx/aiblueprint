---
name: rules-manager
description: Create, edit, and maintain AGENTS.md and .agents/rules/ — tech stack, commands, universal rules, rule index, and rule files. Use to add, modify, restructure, or optimize project rules, conventions, and constraints.
argument-hint: "[init | add <rule-name> | edit | optimize | task description]"
---

<core_principle>
Rules consume tokens on every agent run. Keep them minimal, specific, and discoverable.

**Two-tier system:**

- **AGENTS.md** — Always loaded. Acts as the **index** + universal rules.
- **.agents/rules/\*.md** — Modular rule files for focused topics (changelog, testing, deployment, etc.).

**CRITICAL invariant:** Every file in `.agents/rules/` must be referenced in AGENTS.md so agents know it exists. AGENTS.md without a reference = orphaned rule = invisible to agents.
</core_principle>

<file_layout>

```
project-root/
├── AGENTS.md                  # Index + universal rules (always loaded)
└── .agents/
    └── rules/
        ├── changelog.md       # Rule for changelog management
        ├── testing.md         # Rule for tests
        └── deployment.md      # Rule for deployment
```

**AGENTS.md must contain a `## Rules` section listing each `.agents/rules/*.md` file with a one-line description.**
</file_layout>

<agents_md_template>
Minimal AGENTS.md with rules index:

```markdown
# Project Name

Short description (1-2 lines).

## Tech Stack

- [Non-obvious tech only]

## Commands

- `[dev]` - Dev server
- `[test]` - Run tests

## Rules

The detailed rules live in `.agents/rules/`. Read the relevant file before acting:

- **Changelog** - [.agents/rules/changelog.md](.agents/rules/changelog.md) - When/how to update CHANGELOG.md
- **Testing** - [.agents/rules/testing.md](.agents/rules/testing.md) - Test conventions and coverage
- **Deployment** - [.agents/rules/deployment.md](.agents/rules/deployment.md) - Deploy checklist

## Universal Rules

- [2-3 critical rules that apply everywhere]
```

The `## Rules` section is the index. Each bullet = one file in `.agents/rules/`. The `## Universal Rules` section holds short, project-wide constraints that don't deserve their own file.
</agents_md_template>

<rule_file_template>
Each `.agents/rules/<name>.md` should be focused, short, and actionable.

```markdown
# [Rule Title]

Short purpose statement (1 line).

## When this applies

- [Specific triggers - what task/context loads this rule]

## Rules

- [Specific, actionable rule]
- [Another rule with example if format matters]

## Example

[3-5 line concrete example, only if needed]
```

**Size target:** 20-60 lines per rule file. If longer, split into multiple files.
</rule_file_template>

<writing_rules>
**Be specific, never vague:**

```
NO: "Update changelog properly"
YES: "Append entry to CHANGELOG.md under ## Unreleased before every PR. Format: - [type] description (#PR)"
```

**Prohibitions beat positive guidance:**

```
NO: "Try to write tests"
YES: "NEVER merge without a passing test for the changed behavior"
```

**Emphasis hierarchy:** CRITICAL > NEVER > ALWAYS > IMPORTANT

- Lead each section with the most critical rule
- Use **bold + keyword** for non-negotiables: `**CRITICAL**: Never commit secrets`

**Do NOT include:**

- Generic best practices ("write clean code", "DRY", "SOLID")
- Linter-enforced rules (ESLint, Prettier, Biome already do this)
- Things the agent discovers from the code (file structure, framework defaults)
- Marketing or vision statements
- Verbose paragraphs - one line is almost always enough
  </writing_rules>

<workflows>

## `/rules-manager init` - Bootstrap AGENTS.md + .agents/rules/

When the argument contains `init`:

1. **Detect project context** - Read `package.json` or equivalent for name, stack, scripts.
2. **Check existing files** - If `AGENTS.md` or `.agents/rules/` already exists, read them and ASK before overwriting.
3. **Create skeleton** - Write AGENTS.md with empty `## Rules` index, ready to populate.
4. **Create `.agents/rules/` directory** - Empty for now. New rules added via `add` workflow.

Target AGENTS.md size at init: under 40 lines.

## `/rules-manager add <name>` - Add a new rule

When the argument starts with `add`:

1. **Confirm name** - Slugify (e.g., "changelog management" -> `changelog`). Ask user if unclear.
2. **Read existing AGENTS.md** - Confirm it exists. If not, run `init` first.
3. **Ask the user for rule content** - What does the rule enforce? When does it apply? Any examples?
4. **Write `.agents/rules/<name>.md`** - Use the rule file template. Keep it 20-60 lines.
5. **Update AGENTS.md `## Rules` section** - Add a one-line bullet pointing to the new file:
   ```
   - **<Title>** - [.agents/rules/<name>.md](.agents/rules/<name>.md) - <one-line purpose>
   ```
6. **Verify the link** - Make sure the path in AGENTS.md exactly matches the created file.

**CRITICAL:** Step 5 is non-negotiable. A rule file without an index entry is invisible.

## `/rules-manager edit` - Modify AGENTS.md directly

When the user wants to change AGENTS.md itself rather than add a rule file — update the tech stack, commands, universal rules, project description, or restructure sections:

1. **Read AGENTS.md** - Load current content.
2. **Make the targeted edit in place** - Change only the relevant section; leave unrelated sections untouched.
3. **Preserve the index** - If touching `## Rules`, keep every `.agents/rules/*.md` link intact.
4. **Stay minimal** - Apply `<writing_rules>`: specific, prohibitions over guidance, no bloat.

This is the default when the user references AGENTS.md content (not a rule file) — e.g. "add a command to AGENTS.md", "update the tech stack", "tighten the universal rules".

## `/rules-manager optimize` - Audit and clean up

When the argument contains `optimize`:

1. **Inventory** - List AGENTS.md and every file in `.agents/rules/`.
2. **Check the index** - For each file in `.agents/rules/`, verify there's a matching bullet in AGENTS.md `## Rules`. Flag missing entries.
3. **Check for orphans** - For each AGENTS.md bullet, verify the file exists. Flag broken links.
4. **Apply bloat removal** - For each rule file, remove:
   - Linter-enforced rules
   - Generic best practices
   - Verbose explanations (compress to one line)
   - Things derivable from code
5. **Compress** - Paragraphs to bullets, multi-line rules to single lines.
6. **Show diff and ask before applying.**

Target sizes:

- AGENTS.md: under 80 lines
- Each rule file: under 60 lines

## Default - Add a rule based on description

When the argument is a free-form task (e.g., "add a rule about how we tag releases"):

1. Treat as `add` with auto-derived name.
2. Ask the user 1-2 clarifying questions if the rule scope is unclear.
3. Follow the `add` workflow.
   </workflows>

<rules_for_this_skill>

- This skill manages ALL of AGENTS.md (tech stack, commands, universal rules, index, description) and `.agents/rules/` — not just creating new rule files. Editing existing AGENTS.md content is fully in scope.
- ALWAYS update AGENTS.md `## Rules` index when creating a file in `.agents/rules/`
- NEVER create a rule file without confirming with the user what it should contain
- NEVER overwrite existing AGENTS.md or rule files without asking
- Default to short rule files (20-60 lines). Split if larger.
- When user asks "create a rule", default to creating a file in `.agents/rules/` (not inline in AGENTS.md), unless the rule is 1-2 lines and fits the universal section.
- When the user references AGENTS.md content directly (a command, the stack, a universal rule), edit AGENTS.md in place via the `edit` workflow — don't spin up a new rule file.
  </rules_for_this_skill>

<reference_guides>

- **Examples**: [references/examples.md](references/examples.md) - Sample rule files (changelog, testing, deployment)
- **AGENTS.md vs CLAUDE.md**: [references/agents-vs-claude.md](references/agents-vs-claude.md) - When to use which format
  </reference_guides>
