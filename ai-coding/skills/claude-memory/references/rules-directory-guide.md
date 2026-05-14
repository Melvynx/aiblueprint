# .claude/rules/ Directory - Official Guide

Complete guide to using modular rules with `.claude/rules/` directory, based on official Claude Code documentation.

## Overview

For larger projects, organize instructions into multiple files using the `.claude/rules/` directory. This allows teams to maintain focused, well-organized rule files instead of one large CLAUDE.md.

## Basic Structure

Place markdown files in your project's `.claude/rules/` directory:

```
your-project/
├── .claude/
│   ├── CLAUDE.md           # Main project instructions
│   └── rules/
│       ├── code-style.md   # Code style guidelines
│       ├── testing.md      # Testing conventions
│       └── security.md     # Security requirements
```

**Key points:**
- All `.md` files in `.claude/rules/` are automatically loaded as project memory
- Same priority as `.claude/CLAUDE.md`
- No imports or configuration needed

## Path-Specific Rules

Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns.

### Syntax

```yaml
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

**Important:**
- `paths` must be a YAML array (list format with `-` prefix)
- Rules **without** a `paths` field are loaded unconditionally
- Conditional rules only load when working with matching files

### Glob Patterns

The `paths` field supports standard glob patterns:

| Pattern                | Matches                                  |
| ---------------------- | ---------------------------------------- |
| `**/*.ts`              | All TypeScript files in any directory    |
| `src/**/*`             | All files under `src/` directory         |
| `*.md`                 | Markdown files in the project root       |
| `src/components/*.tsx` | React components in a specific directory |

### Multiple Patterns

Specify multiple patterns in the array:

```yaml
---
paths:
  - "src/**/*.ts"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

### Brace Expansion

Use brace expansion for matching multiple extensions or directories:

```yaml
---
paths:
  - "src/**/*.{ts,tsx}"
  - "{src,lib}/**/*.ts"
---

# TypeScript/React Rules
```

This expands `src/**/*.{ts,tsx}` to match both `.ts` and `.tsx` files.

## Subdirectories

Rules can be organized into subdirectories for better structure:

```
.claude/rules/
├── frontend/
│   ├── react.md
│   └── styles.md
├── backend/
│   ├── api.md
│   └── database.md
└── general.md
```

All `.md` files are discovered recursively in any subdirectory depth.

## Symlinks

The `.claude/rules/` directory supports symlinks, allowing you to share common rules across multiple projects:

```bash
# Symlink a shared rules directory
ln -s ~/shared-claude-rules .claude/rules/shared

# Symlink individual rule files
ln -s ~/company-standards/security.md .claude/rules/security.md
```

**Behavior:**
- Symlinks are resolved and their contents are loaded normally
- Circular symlinks are detected and handled gracefully
- Great for sharing company standards across projects

## User-Level Rules

Create personal rules that apply to all your projects in `~/.claude/rules/`:

```
~/.claude/rules/
├── preferences.md    # Your personal coding preferences
└── workflows.md      # Your preferred workflows
```

**Priority:**
- User-level rules load before project rules
- Project rules take higher priority (can override user rules)
- User rules typically **don't** need `paths` frontmatter (apply globally)

## Examples

### Unconditional Project Rule

File: `.claude/rules/testing.md`

```markdown
# Testing Conventions

- Write tests in `__tests__/` directories
- Use Vitest for unit tests
- Minimum 80% coverage for new code
- Run `pnpm test` before committing
```

No frontmatter needed - applies to entire project.

### Path-Specific Rule

File: `.claude/rules/api-standards.md`

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/routes/**/*.ts"
---

# API Development Standards

- All endpoints must validate input with Zod
- Use standard error response format
- Include rate limiting for public endpoints
- Document with OpenAPI comments
```

Only loads when working with API-related TypeScript files.

### Frontend-Specific Rules

File: `.claude/rules/frontend/react.md`

```yaml
---
paths:
  - "src/components/**/*.{tsx,ts}"
  - "src/app/**/*.tsx"
---

# React Component Guidelines

- Prefer Server Components (Next.js App Router)
- Use `"use client"` only when needed for interactivity
- Keep components under 300 lines
- Extract hooks to separate files
```

### User-Level Global Rule

File: `~/.claude/rules/preferences.md`

```markdown
# My Personal Coding Preferences

- I prefer concise variable names (no unnecessary verbosity)
- Always add error boundaries around async operations
- Use early returns to reduce nesting
```

No frontmatter - applies to all projects globally.

## Best Practices

### Keep Rules Focused

Each file should cover one topic:
- ✅ `testing.md` - All testing conventions
- ✅ `api-design.md` - API-specific patterns
- ✅ `security.md` - Security requirements
- ❌ `everything.md` - Mixed concerns

### Use Descriptive Filenames

The filename should indicate what the rules cover:
- ✅ `database-migrations.md`
- ✅ `error-handling.md`
- ❌ `stuff.md`
- ❌ `misc.md`

### Use Conditional Rules Sparingly

Only add `paths` frontmatter when rules **truly** apply to specific file types:
- ✅ API validation rules → `paths: ["src/api/**/*.ts"]`
- ✅ React component rules → `paths: ["**/*.tsx"]`
- ❌ General project conventions → No paths needed

### Organize with Subdirectories

Group related rules:

```
.claude/rules/
├── frontend/
│   ├── components.md
│   ├── styling.md
│   └── state-management.md
├── backend/
│   ├── api.md
│   ├── database.md
│   └── auth.md
└── general.md
```

### Avoid Duplication

Don't repeat the same rules in multiple files. If a rule applies globally, put it in:
1. Root-level rule file (e.g., `.claude/rules/general.md`)
2. Or in `.claude/CLAUDE.md`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Rules not loading | Ensure file extension is `.md` and in `.claude/rules/` |
| Path rules not applying | Verify glob pattern matches target files exactly |
| Rules conflicting | Check for duplicates across multiple files |
| Too many rules loading | Use `paths` frontmatter to scope appropriately |

## When to Use .claude/rules/ vs CLAUDE.md

**Use `.claude/rules/` when:**
- Project has many distinct concerns (testing, security, API, frontend)
- Different rules apply to different file types
- Team members maintain different areas
- You want to update one concern without touching others
- CLAUDE.md exceeds 200 lines

**Use CLAUDE.md when:**
- Project is small/simple (< 100 lines of instructions)
- All rules are universal across the project
- You prefer a single source of truth
- Quick setup is priority

## Migration Path

When CLAUDE.md grows too large (200+ lines):

1. **Identify sections**: testing, API, frontend, security, etc.
2. **Create `.claude/rules/` directory**
3. **Move each section** to its own file
4. **Add `paths` frontmatter** where rules are file-type specific
5. **Keep universal essentials** in CLAUDE.md (or remove it entirely)
6. **Test** to ensure rules load correctly

## Reference

Based on official Claude Code documentation:
https://code.claude.com/docs/mcp/claude-md#modular-rules-with-clauderules
