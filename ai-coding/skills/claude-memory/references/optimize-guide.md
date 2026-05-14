# CLAUDE.md Optimization Guide

## Research Foundation

Based on "Evaluating AGENTS.md" (ETH Zurich, arXiv 2602.11988, Feb 2026) — the first rigorous study of repository context files for coding agents:

**Key findings:**
- Context files with unnecessary specs **reduce** task success rates vs no context at all
- LLM-generated context files reduced success by 0.5-2% and increased costs 20-23%
- Developer-written **minimal** files improved performance by 4%
- Repository overviews are useless — agents discover structure themselves
- Removing redundant documentation improved performance by 2.7%
- Instructions ARE reliably followed (mentioned tools used 1.6-2.5x more) — the problem is **what** you instruct, not **whether** it's followed
- Files averaging 641 words performed; files with unnecessary complexity degraded

**The paradox:** More instructions = worse performance. The agent follows your instructions faithfully, but unnecessary constraints make the task harder.

**Conclusion:** Write only what the agent cannot discover on its own. Everything else is noise that actively hurts.

## Additional Metrics (SFEIR Institute, Feb 2026)

- Files over 200 lines: 30% of directives silently lost
- Vague instructions: +45% manual corrections needed
- Explicit prohibitions: more effective than positive guidance
- Modular `.claude/rules/` with path-scoping: 40% noise reduction, 35% relevance increase
- Documented test/build commands: 30% reduction in back-and-forth
- 3-5 concrete code examples: 40% reduction in correction requests

## The 7 Essential Sections

Every optimized CLAUDE.md should contain ONLY these. Nothing else.

### 1. Project Purpose (1-3 lines)
What the project is. One sentence is ideal. The agent doesn't need your vision or goals.

```markdown
# MyApp
SaaS invoice management platform with Stripe billing.
```

**Kill:** Vision statements, goals, target audience, roadmaps, business metrics, "why we built this."

### 2. Tech Stack (compact)
Only technologies the agent can't detect from package.json/config files.

```markdown
## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Prisma + PostgreSQL
- TanStack Form + Zod
- Tailwind + shadcn/ui
```

**Kill:** Version numbers from lockfiles, obvious deps (React in Next.js), descriptions of what each lib does.

### 3. Core Commands
Commands the agent needs. Only non-obvious ones.

```markdown
## Commands
- `pnpm dev` - Dev server
- `pnpm build` - Production build
- `pnpm db:push` - Push schema changes
- `pnpm db:seed` - Seed database
```

**Kill:** `pnpm install` (obvious), `pnpm start` (obvious), self-explanatory package.json scripts.

### 4. Testing Commands
How to run tests. The research shows documented test commands reduce back-and-forth 30%.

```markdown
## Testing
- `pnpm test` - Run all tests
- `pnpm test:e2e` - E2E tests (needs running dev server)
- Single file: `pnpm vitest run path/to/file.test.ts`
```

### 5. Important Files
Only files the agent wouldn't find naturally. Architecture-critical, non-obvious files.

```markdown
## Important Files
- `src/lib/auth.ts` - Auth config (Better Auth)
- `src/lib/safe-actions.ts` - Server action wrapper
```

**Kill:** `package.json`, `tsconfig.json`, `next.config.js`, any standard framework file the agent already knows.

### 6. Project-Specific Rules (Highest Value)
Prohibitions and constraints that prevent recurring mistakes. Research shows explicit prohibitions are more effective than positive guidance.

```markdown
## Rules
- NEVER import from `@/features/*/server` in client components
- ALWAYS use `safe-action` wrapper for server actions
- Use TanStack Form for ALL forms (not native form/useState)
- Errors must use `ActionError` not `throw new Error`
```

**These are the most valuable lines in the entire file.** Each rule should encode a mistake that was made before and must not be repeated.

### 7. Workflow (optional)
Only if the project has a non-standard workflow.

```markdown
## Workflow
- Start with plan mode for features touching 3+ files
- Run `pnpm build` after changes (strict TypeScript)
```

**Kill:** Standard git workflows, obvious PR processes.

## The 6 Bloat Categories (What to Remove)

### Category 1: Linter-Enforced Rules
The research is clear: if a tool enforces it, the context file shouldn't mention it.

Delete anything ESLint, Prettier, Biome, or TypeScript strict mode handles:
- Indentation, semicolons, trailing commas, quote style
- Import ordering, max line length
- Naming conventions in ESLint rules
- "Use const over let" / "Prefer arrow functions"
- "No unused variables" / "No any type"
- Type annotation rules

**Test:** Does `.eslintrc`, `biome.json`, or `tsconfig.json` enforce this? → Delete from CLAUDE.md.

### Category 2: Repository Overviews
The paper proved these are useless — agents discover repo structure themselves with zero performance benefit:

- Directory structure descriptions (agent can `ls`)
- Folder explanations (`src/components/ contains React components`)
- Architecture diagrams in text
- "This is a monorepo" (agent sees `packages/` or `apps/`)
- Framework defaults ("Next.js uses file-based routing")
- Feature descriptions ("The auth module handles login")

### Category 3: Marketing / Goals / Vision
Zero value for code generation:
- Mission statements, vision, goals
- Target audience, competitive positioning
- Feature roadmaps, business metrics
- "Why we built this" narratives

### Category 4: Redundant Specifications
The paper found removing redundant docs improved performance by 2.7%:

- Copy of TypeScript config settings
- Copy of ESLint config
- Environment variable names (agent reads `.env.example`)
- Database schema prose (agent reads `schema.prisma`)
- API route docs (agent reads the code)
- Component prop docs (TypeScript types handle this)
- README content repeated in CLAUDE.md

### Category 5: Verbose Explanations
Multi-paragraph explanations actively hurt — they consume context budget and add complexity:

- Paragraphs explaining why a pattern exists (one line is enough)
- Tutorials, onboarding guides, historical context
- Code examples longer than 5 lines (reference the file instead)
- Filler phrases: "In order to", "It's important to note that", "Please make sure to"

### Category 6: Generic Best Practices
The agent already knows these. Adding them wastes instruction slots:
- "Write clean code" / "Follow SOLID principles"
- "Write tests" (without specific commands)
- "Use meaningful variable names" / "Keep functions small"
- "DRY principle" / "Handle errors properly"

## Optimization Process

### Step 1: Inventory
Read every CLAUDE.md and `.claude/rules/*.md` in the project.
Count total lines across all files.

### Step 2: Cross-check linter configs
Read ESLint/Biome/Prettier/TypeScript configs. Any CLAUDE.md line duplicating an enforced rule → delete.

### Step 3: Apply the 6 bloat categories
For each line ask: **"Can the agent discover this by reading the project, or does a linter enforce this?"**
If yes → delete.

### Step 4: Check for redundancy
- Information duplicated across files → consolidate
- Information in README also in CLAUDE.md → remove from CLAUDE.md
- Information derivable from config files → remove

### Step 5: Compress survivors
- Paragraphs → bullet points
- 3-line rules → 1-line rules
- Remove all filler words
- Merge related items

### Step 6: Verify essentials remain
- [ ] Project purpose (1-3 lines)
- [ ] Tech stack (compact, non-obvious only)
- [ ] Core commands (non-obvious only)
- [ ] Testing commands
- [ ] Important files (non-obvious only)
- [ ] Project-specific rules (prohibitions + constraints)
- [ ] Workflow (only if non-standard)

### Step 7: Present changes
Show before/after with line counts. Explain what was removed and why (cite category). Let user approve.

## Target Metrics

| Metric | Target | Research Basis |
|--------|--------|----------------|
| Total lines | < 100 ideal, < 150 max | >200 lines = 30% directive loss |
| Sections | 5-7 | Minimal requirements only |
| Filler words | 0 | +45% corrections when vague |
| Linter-duplicate rules | 0 | Already enforced = wasted tokens |
| Marketing/goals text | 0 | Zero value for code generation |
| Generic best practices | 0 | Agent already knows them |
| Repository overviews | 0 | Research: zero navigation benefit |

## Before vs After Example

### Before (bloated — 47 lines, typical file is 200+)
```markdown
# MyApp - AI-Powered Invoice Management

## Vision
MyApp aims to simplify invoicing for small businesses worldwide.

## Goals
- Reach 10,000 users by Q3 2025
- Achieve 99.9% uptime

## Tech Stack
- Next.js 15 with App Router for server-side rendering
- React 19 for building user interfaces
- TypeScript for type safety
- Prisma ORM for database access
- PostgreSQL database hosted on Neon
- Tailwind CSS for styling
- shadcn/ui component library
- Stripe for payment processing

## Directory Structure
- src/app/ - Next.js app router pages
- src/components/ - Reusable React components
- src/lib/ - Utility functions
- src/features/ - Feature modules
- prisma/ - Database schema

## Code Style
- Use 2-space indentation
- Use semicolons
- Use single quotes
- Use const over let
- No unused variables
- Prefer arrow functions
- Use PascalCase for components
- Use camelCase for functions

## Important Notes
In order to maintain code quality, it's important to note that
all developers should follow clean code principles and ensure
that the codebase remains maintainable and readable.
```

### After (optimized — complete file, 22 lines)
```markdown
# MyApp
SaaS invoice management platform.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Prisma + PostgreSQL (Neon)
- Stripe payments
- Tailwind + shadcn/ui

## Commands
- `pnpm dev` - Dev server
- `pnpm build` - Build
- `pnpm test` - Tests
- `pnpm db:push` - Push schema

## Important Files
- `src/lib/auth.ts` - Auth config
- `src/lib/safe-actions.ts` - Server action wrapper

## Rules
- ALWAYS use safe-action wrapper for server actions
- NEVER import server modules in client components
- Use TanStack Form for ALL forms
```

**What was removed and why:**
- Vision/Goals (Category 3: marketing — zero code value)
- React 19, TypeScript descriptions (Category 2: obvious from package.json)
- Directory structure (Category 2: agent discovers via `ls`)
- All code style rules (Category 1: ESLint/Prettier enforces these)
- "Important Notes" paragraph (Category 6: generic best practices + Category 5: filler)

**Result:** 47 → 22 lines. Research predicts ~4% better task completion and ~20% cost reduction.
