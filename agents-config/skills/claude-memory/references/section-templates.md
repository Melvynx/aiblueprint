<section_templates>
Copy and adapt these section templates for your CLAUDE.md file.

<tech_stack_templates>
<minimal>
```markdown
## Tech Stack
- Next.js 15 + TypeScript
- PostgreSQL via Prisma
- TailwindCSS
```
</minimal>

<detailed>
```markdown
## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: [Auth solution]
- **Testing**: Vitest (unit), Playwright (e2e)
- **Package Manager**: pnpm
```
</detailed>

<with_infrastructure>
```markdown
## Tech Stack

### Application
- Next.js 15 + TypeScript
- PostgreSQL via Prisma
- Redis for caching/queues

### Infrastructure
- Vercel (hosting)
- Neon (database)
- Upstash (Redis)

### Monitoring
- Sentry (errors)
- Vercel Analytics
```
</with_infrastructure>
</tech_stack_templates>

<commands_templates>
<minimal>
```markdown
## Commands
- `pnpm dev` - Development
- `pnpm test` - Run tests
- `pnpm build` - Production build
```
</minimal>

<categorized>
```markdown
## Commands

### Development
- `pnpm dev` - Start dev server
- `pnpm build` - Production build
- `pnpm start` - Start production

### Quality
- `pnpm lint` - ESLint
- `pnpm ts` - Type check
- `pnpm format` - Prettier

### Testing
- `pnpm test:ci` - Unit tests
- `pnpm test:e2e:ci` - E2E tests

### Database
- `pnpm db:push` - Push schema
- `pnpm db:seed` - Seed data
```
</categorized>

<with_warnings>
```markdown
## Commands

### Development
- `pnpm dev` - Start dev server
- `pnpm build` - Production build

### Testing
**CRITICAL - Use CI commands only:**
- `pnpm test:ci` - Unit tests (non-interactive)
- `pnpm test:e2e:ci` - E2E tests (headless)

**NEVER use:**
- ~~`pnpm test`~~ - Interactive mode
- ~~`pnpm test:e2e`~~ - Interactive mode
```
</with_warnings>
</commands_templates>

<directory_structure_templates>
<simple>
```markdown
## Directory Structure
```
src/
├── components/    # UI components
├── lib/           # Utilities
├── hooks/         # React hooks
└── styles/        # CSS
```
```
</simple>

<feature_based>
```markdown
## Directory Structure
```
src/
├── features/
│   ├── auth/          # Authentication
│   ├── dashboard/     # Dashboard views
│   └── settings/      # User settings
├── components/
│   ├── ui/            # shadcn components
│   └── shared/        # Shared components
├── lib/               # Utilities
└── hooks/             # React hooks
```
```
</feature_based>

<monorepo>
```markdown
## Directory Structure
```
apps/
├── web/           # Next.js frontend
├── api/           # Node.js backend
└── admin/         # Admin dashboard
packages/
├── ui/            # Shared components
├── config/        # Shared config
└── types/         # Shared types
```
```
</monorepo>
</directory_structure_templates>

<conventions_templates>
<minimal>
```markdown
## Conventions
- TypeScript strict mode
- ESLint + Prettier configured
- Conventional commits
```
</minimal>

<detailed>
```markdown
## Code Conventions

### TypeScript
- Use `type` over `interface`
- No `any` types
- Strict mode enabled

### React
- Prefer Server Components
- Client components only for interactivity
- Components under 300 lines

### Naming
- camelCase for variables/functions
- PascalCase for components/types
- kebab-case for files
```
</detailed>

<with_critical_rules>
```markdown
## Code Conventions

### TypeScript
- Strict mode enabled
- No `any` types

### Forms
**CRITICAL**: Use TanStack Form for ALL forms
- Import from `@/features/form/tanstack-form`
- **NEVER** use React Hook Form directly

### Server Actions
- All actions use `safe-actions.ts`
- Suffix files with `.action.ts`
```
</with_critical_rules>
</conventions_templates>

<git_workflow_templates>
<simple>
```markdown
## Git Workflow
- Branch: `feature/name` or `fix/name`
- Conventional commits (feat:, fix:, refactor:)
- PRs required for all changes
```
</simple>

<detailed>
```markdown
## Git Workflow

### Branches
- `main` - Production
- `develop` - Integration
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Production fixes

### Commits
Format: `type(scope): description`
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change
- `docs`: Documentation
- `test`: Tests

### Pull Requests
- Create from feature branch to develop
- Require 1 approval
- Must pass CI checks
- Squash merge preferred
```
</detailed>
</git_workflow_templates>

<important_files_templates>
<simple>
```markdown
## Key Files
- `src/lib/auth.ts` - Auth config
- `src/lib/db.ts` - Database client
- `prisma/schema.prisma` - DB schema
```
</simple>

<with_descriptions>
```markdown
## Important Files

### Configuration
- `src/lib/auth.ts` - Authentication setup
- `src/lib/db.ts` - Prisma client
- `src/site-config.ts` - Site metadata

### Patterns
- `src/features/form/tanstack-form.tsx` - Form utilities (**use for all forms**)
- `src/lib/actions/safe-actions.ts` - Server action wrapper

### Database
- `prisma/schema.prisma` - Main schema
- `prisma/seed.ts` - Seed data
```
</with_descriptions>
</important_files_templates>

<testing_templates>
<minimal>
```markdown
## Testing
- Run `pnpm test` before committing
- Write tests for new features
```
</minimal>

<detailed>
```markdown
## Testing

### Unit Tests
- Location: `__tests__/`
- Framework: Vitest + Testing Library
- Run: `pnpm test:ci`

### E2E Tests
- Location: `e2e/`
- Framework: Playwright
- Run: `pnpm test:e2e:ci`

### Requirements
- All new features require tests
- Target 80% coverage
- Run tests before pushing
```
</detailed>
</testing_templates>

<security_templates>
```markdown
## Security

**NEVER commit:**
- `.env` files
- API keys or secrets
- Database credentials
- Private tokens

**Always:**
- Use environment variables
- Store secrets in `.env.local`
- Check `.gitignore` before committing
```
</security_templates>
</section_templates>

<combination_tips>
<minimal_project>
For small projects, combine into fewer sections:

```markdown
# Project Name

## Stack & Commands
- Next.js + TypeScript
- `pnpm dev` / `pnpm test` / `pnpm build`

## Conventions
- ESLint/Prettier configured
- Run tests before pushing
- Never commit .env files
```
</minimal_project>

<large_project>
For large projects, use all relevant sections but keep each concise. Link to external docs for details:

```markdown
## Detailed Guides
- Architecture: See [docs/architecture.md](docs/architecture.md)
- API patterns: See [docs/api.md](docs/api.md)
- Testing: See [docs/testing.md](docs/testing.md)
```
</large_project>
</combination_tips>
