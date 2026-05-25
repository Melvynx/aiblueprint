# Cursor Rules

Official docs: https://cursor.com/docs/rules.md

Cursor calls them "rules", not skills. Same idea: persistent instructions injected into the model context. Four kinds:

| Kind          | Location                   | Notes                              |
| :------------ | :------------------------- | :--------------------------------- |
| Project Rules | `.cursor/rules/*.md(c)`    | Version-controlled, scoped to repo |
| User Rules    | Cursor Settings → Rules    | Global, chat-only                  |
| Team Rules    | Cursor dashboard           | Team/Enterprise plans              |
| AGENTS.md     | project root + subdirs     | Plain markdown, no frontmatter     |

Precedence when merging: **Team Rules → Project Rules → User Rules**. Earlier source wins on conflict.

## Project rule file: `.cursor/rules/<name>.mdc`

Use `.mdc` when you need frontmatter, `.md` for content-only. Frontmatter has three fields:

| `alwaysApply` | `description` | `globs`   | Behavior                                                |
| :------------ | :------------ | :-------- | :------------------------------------------------------ |
| `true`        | -             | -         | Always included. `description`/`globs` ignored.         |
| `false`       | -             | provided  | Auto-attached when a matching file is in context.       |
| `false`       | provided      | omitted   | Agent reads description, pulls in when relevant.        |
| `false`       | omitted       | omitted   | Manual only - included when `@`-mentioned in chat.      |

### Four templates

**Always applied**

```md
---
alwaysApply: true
---

- All source files must include the company copyright header
- Never modify generated files in `dist/` or `build/`
```

**Auto-attached by file pattern**

```md
---
globs: src/components/**/*.tsx
alwaysApply: false
---

- Use named exports, not default exports
- Co-locate styles in a CSS module next to the component
- Keep components under 200 lines
```

**Agent-selected by description**

```md
---
description: RPC service conventions and patterns for the backend
alwaysApply: false
---

- Define each service in its own file under `src/services/`
- Validate inputs at the service boundary
- Reference `@service-template.ts` for boilerplate
```

**Manual via @-mention**

```md
---
alwaysApply: false
---

- Every database migration must have `up` and `down`
- Never alter a column type in-place

@migration-template.sql
```

### Glob examples

| Pattern                          | Matches                              |
| :------------------------------- | :----------------------------------- |
| `*.ts`                           | `.ts` files at root                  |
| `**/*.ts`                        | `.ts` files anywhere                 |
| `src/**`                         | everything under `src/`              |
| `src/**/*.tsx`                   | `.tsx` files anywhere under `src/`   |
| `docs/**/*.md, docs/**/*.mdx`    | comma-separate multiple patterns     |
| `tailwind.config.*`              | any extension                        |

### Referencing files

`@filename.ts` inside a rule attaches that file to the context when the rule fires. Use this to point at canonical templates instead of copying code.

## AGENTS.md (no frontmatter)

Plain markdown in project root or subdirectories. No fields, no globs - just instructions.

```markdown
# Project Instructions

## Code Style
- Use TypeScript for all new files
- Prefer functional components in React
```

Nested support: `frontend/AGENTS.md` applies inside `frontend/`, combined with the root file. More specific wins.

## User Rules

Free-form global preferences set in Cursor Settings. Chat-only (not Inline Edit / Cmd-K).

## Best practices

- Keep rules under 500 lines; split into composable rules instead.
- Concrete examples beat vague guidance.
- Reference files with `@name.ts` rather than copying code (stays in sync).
- Skip style guides Cursor already knows. Add a rule when you see the same mistake twice.
- Check rules into git so the team benefits.

## Common mistakes

- Using `alwaysApply: true` for rules that only matter in one directory - use `globs` instead.
- Description that's a label, not a trigger ("Backend stuff" → "RPC service conventions and patterns for the backend").
- Copying entire style guides instead of using a linter.
- Manual rule (no globs, no description, `alwaysApply: false`) without telling the user it must be `@`-mentioned.
