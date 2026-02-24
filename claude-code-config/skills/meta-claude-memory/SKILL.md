---
name: claude-memory
description: Create and optimize CLAUDE.md memory files or .claude/rules/ modular rules for Claude Code projects. Comprehensive guidance on file hierarchy, content structure, path-scoped rules, best practices, and anti-patterns. Use when working with CLAUDE.md files, .claude/rules directories, setting up new projects, or improving Claude Code's context awareness.
argument-hint: [task description or "optimize"]
---

<core_principle>
Memory files consume tokens from the context window. ~100-150 instruction slots available for your customizations. Keep files minimal — only include what the agent cannot discover on its own.

**Two approaches:**
- **CLAUDE.md** — Single file, best for small projects (< 100 lines)
- **.claude/rules/** — Modular files with optional path-scoping, best for large projects
</core_principle>

<quick_start>
Run `/init` to auto-generate a CLAUDE.md. Or create manually:

```markdown
# Project Name

## Tech Stack
- [Primary framework]
- [Key non-obvious libraries]

## Commands
- `npm run dev` - Dev server
- `npm test` - Run tests
- `npm run build` - Build

## Rules
- [2-3 critical project-specific rules]
```

- Press `#` during a session to add memory items quickly
- Use `/memory` to open CLAUDE.md in your editor
</quick_start>

<file_hierarchy>

| Priority | Location | Scope |
|----------|----------|-------|
| 1 (Highest) | Enterprise policy (managed by IT) | All org users |
| 2 | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team via git |
| 2 | `./.claude/rules/*.md` | Team via git |
| 3 | `~/.claude/CLAUDE.md` | All your projects |
| 3 | `~/.claude/rules/*.md` | All your projects |
| 4 (Lowest) | `./CLAUDE.local.md` (auto-gitignored) | Just you |

Claude recurses UP from current directory, loading all CLAUDE.md files found. Also discovers CLAUDE.md in subtrees when reading files in those directories.

**Monorepo strategy:** Root file defines WHEN; subtree files define HOW.
```
root/CLAUDE.md           # Universal: tech stack, git workflow
apps/web/CLAUDE.md       # Frontend-specific
apps/api/CLAUDE.md       # Backend-specific
```
</file_hierarchy>

<rules_directory>
The `.claude/rules/` directory splits instructions into focused markdown files.

**Use `.claude/rules/` when:** many concerns, different rules for different file types, team maintains different areas.
**Use CLAUDE.md when:** small project, universal rules, single source of truth.

Path-scoped rules use YAML frontmatter:
```yaml
---
paths:
  - "src/api/**/*.ts"
---
# API Rules
- All endpoints must include input validation
```

Supported patterns: `**/*.ts`, `src/**/*`, `src/**/*.{ts,tsx}`, `{src,lib}/**/*.ts`

Rules without `paths` frontmatter load unconditionally.

See [references/rules-directory-guide.md](references/rules-directory-guide.md) for complete guide including symlinks, user-level rules, and migration.
</rules_directory>

<content_structure>
Structure CLAUDE.md with only these sections:

1. **Project purpose** (1-3 lines) — What the project is
2. **Tech stack** (compact) — Only non-obvious technologies
3. **Commands** — Non-obvious dev, build, and test commands
4. **Important files** — Architecture-critical, non-obvious files only
5. **Rules** — Prohibitions and constraints that prevent mistakes (highest-value lines)
6. **Workflow** (optional) — Only if non-standard

**Do NOT include:**
- Repository overviews (agent discovers structure itself)
- Code style rules (linters enforce these)
- Generic best practices ("write clean code", "DRY", "SOLID")
- Redundant specs (copies of config files, env vars, schema descriptions)
- Marketing/goals (vision statements, KPIs, roadmaps)
- Verbose explanations (paragraphs where one line suffices)

See [references/section-templates.md](references/section-templates.md) for ready-to-use templates.
See [references/project-patterns.md](references/project-patterns.md) for framework-specific patterns.
</content_structure>

<writing_rules>
**Golden rule:** If someone with zero project context reads your CLAUDE.md and gets confused, Claude will too.

**Be specific, never vague:**
```
❌ "Format code properly" / "Write good tests" / "Follow best practices"
✅ "Run `pnpm lint` before committing" / "Tests in `__tests__/` using Vitest"
```

**Prohibitions > positive guidance:**
```
❌ "Try to use TanStack Form for forms"
✅ "NEVER use native form/useState for forms — ALWAYS use TanStack Form"
```

**Show, don't tell:** When format matters, show a concrete example (3-5 lines max).

**Emphasis hierarchy:** CRITICAL > NEVER > ALWAYS > IMPORTANT > YOU MUST
- Put critical rules **first** in each section
- Use **bold + keyword** for non-negotiable rules: `**CRITICAL**: Never commit secrets`

See [references/prompting-techniques.md](references/prompting-techniques.md) for advanced techniques.
</writing_rules>

<size_limits>
- **Ideal:** < 100 lines
- **Maximum:** 150 lines before performance degrades
- **Over 200 lines:** directives start getting lost

When exceeding limits, split into `.claude/rules/` files or link to separate docs:
```markdown
- **API patterns**: See [docs/api-patterns.md](docs/api-patterns.md)
- **Testing guide**: See [docs/testing-guide.md](docs/testing-guide.md)
```

CLAUDE.md supports importing: `@docs/coding-standards.md` (relative/absolute paths, `~` expansion, up to 5 levels deep, not evaluated inside code blocks).
</size_limits>

<workflow>
**ALWAYS ASK FIRST: Storage Strategy**

Before creating or updating memory files, use AskUserQuestion:
- **Option 1: Single CLAUDE.md** — < 100 lines, simple project, universal rules
- **Option 2: Modular .claude/rules/** — 100+ lines, different rules for different files

**Creating new memory:**
1. Start with `/init` or minimal template
2. Add tech stack and commands first
3. Add rules only as you encounter friction
4. Test with real tasks, iterate based on Claude's behavior

**Maintaining:**
1. Review quarterly or when project changes significantly
2. Remove outdated instructions
3. Add patterns that required repeated explanation
4. Use `#` for quick additions during work

**Troubleshooting:**

| Problem | Solution |
|---------|----------|
| Claude ignores instructions | Reduce file size, add emphasis (CRITICAL, NEVER) |
| Context overflow | Use `/clear`, split into .claude/rules/ |
| Instructions conflict | Consolidate, use hierarchy (root vs subtree) |
| Path rules not applying | Verify glob pattern matches target files |
</workflow>

<optimize_workflow>
## `/claude-memory optimize` — Deep CLAUDE.md Cleanup

When the user argument contains "optimize", execute this workflow.

**CRITICAL — Step 0 is MANDATORY. Do NOT skip it. Do NOT start optimizing without reading the guide first.**

### Step 0: Read the optimization guide (REQUIRED FIRST)

YOU MUST use the Read tool on `{SKILL_PATH}/references/optimize-guide.md` BEFORE doing anything else.
This file contains the research data (ETH Zurich study), the 6 bloat categories with specific examples, target metrics, and before/after examples. Without reading it, you will miss removal criteria and produce a subpar optimization.

### Step 1: Inventory

Read every CLAUDE.md, CLAUDE.local.md, and `.claude/rules/*.md` in the project. Count total lines.

### Step 2: Read linter configs

Read ESLint/Biome/Prettier/TypeScript configs. Any CLAUDE.md line duplicating an enforced rule → delete.

### Step 3: Apply the 6 bloat categories from the guide

For each line ask: "Can the agent discover this by reading the project, or does a linter enforce this?" If yes → delete.

Remove everything matching:
1. Linter-enforced rules (ESLint, Prettier, Biome, TypeScript strict)
2. Marketing / goals / vision (zero code value)
3. Obvious info the agent discovers itself (directory structure, framework defaults, deps from package.json)
4. Verbose explanations (paragraphs where 1 line suffices, tutorials, history)
5. Redundant specs (copies of config files, schema descriptions, env var lists)
6. Generic best practices ("write clean code", "DRY", "SOLID")

### Step 4: Keep only essentials

- Project purpose (1-3 lines)
- Tech stack (compact, non-obvious only)
- Core commands (non-obvious only)
- Testing commands
- Important files (non-obvious only)
- Project-specific rules (prohibitions + constraints)
- Workflow (only if non-standard)

### Step 5: Compress

- Paragraphs → bullet points
- 3-line rules → 1-line rules
- Zero filler words ("In order to", "It's important to note that")
- Merge related items

### Step 6: Present diff

Show before/after with line counts. For each removal, cite which bloat category it falls under.
Let user approve before applying changes.

**Target:** < 100 lines ideal, < 150 max.
</optimize_workflow>

<reference_guides>
- **Optimization guide**: [references/optimize-guide.md](references/optimize-guide.md) — Research-backed bloat checklist, 6 removal categories, before/after examples
- **Rules directory**: [references/rules-directory-guide.md](references/rules-directory-guide.md) — Complete .claude/rules/ guide with path-scoping, YAML syntax, symlinks, migration
- **Prompting techniques**: [references/prompting-techniques.md](references/prompting-techniques.md) — Emphasis strategies, clarity techniques, constraint patterns
- **Section templates**: [references/section-templates.md](references/section-templates.md) — Copy-paste templates for each section type
- **Comprehensive example**: [references/comprehensive-example.md](references/comprehensive-example.md) — Full production SaaS CLAUDE.md
- **Project patterns**: [references/project-patterns.md](references/project-patterns.md) — Next.js, Express, Python, Monorepo patterns
</reference_guides>
