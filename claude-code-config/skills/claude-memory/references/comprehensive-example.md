<comprehensive_example>
This is a full-featured CLAUDE.md example for a production SaaS application. Use as inspiration, adapting to your specific project.

```markdown
# Thumbnail.io - AI Thumbnail Generator

## About
AI-powered YouTube thumbnail generator SaaS. Users create thumbnails via text prompts, reference persons, and inspiration images.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth with organization support
- **Email**: React Email with Resend
- **Payments**: Stripe (subscriptions + credits)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Package Manager**: pnpm

## Directory Structure
```
app/                  # Next.js App Router pages
src/
├── components/       # UI components (shadcn in ui/, custom in nowts/)
├── features/         # Feature modules with actions, queries, schemas
├── lib/              # Utilities and configurations
├── hooks/            # Custom React hooks
emails/               # React Email templates
prisma/               # Database schema and migrations
e2e/                  # End-to-end tests
__tests__/            # Unit tests
```

## Key Features
- **Editor**: `@/features/editor/` - Main thumbnail generation
- **Persons**: `@/features/person/` - Reference person management
- **Credits**: `@/features/credits/` - Usage-based credit system
- **Forms**: `@/features/form/tanstack-form.tsx` - TanStack Form setup

## Commands

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build application
- `pnpm ts` - TypeScript type checking
- `pnpm lint` - ESLint with auto-fix
- `pnpm clean` - Lint + type check + format

### Testing
**CRITICAL - Always use CI commands:**
- `pnpm test:ci` - Unit tests (non-interactive)
- `pnpm test:e2e:ci` - E2E tests (headless)

**NEVER use interactive commands:**
- ~~`pnpm test`~~ - Interactive mode breaks Claude Code
- ~~`pnpm test:e2e`~~ - Interactive mode breaks Claude Code

### Database
- `pnpm prisma:seed` - Seed database
- `pnpm better-auth:migrate` - Generate auth schema

## Code Conventions

### TypeScript
- Use `type` over `interface` (enforced by ESLint)
- No enums - use maps instead
- Strict mode - no `any` types
- Prefer `??` over `||`

### React/Next.js
- Prefer Server Components over Client Components
- Use `"use client"` only for Web API access
- Wrap client components in `Suspense` with fallback
- **ALWAYS** use `PageProps<"/route/path">` for page components

### Forms
**CRITICAL - Use TanStack Form for ALL forms:**

```tsx
import { Form, useForm } from "@/features/form/tanstack-form";

const form = useForm({
  schema: MySchema,
  defaultValues: { field: "" },
  onSubmit: async (values) => { /* handle */ },
});

return (
  <Form form={form}>
    <form.AppField name="field">
      {(field) => (
        <field.Field>
          <field.Label>Label</field.Label>
          <field.Content>
            <field.Input placeholder="..." />
            <field.Message />
          </field.Content>
        </field.Field>
      )}
    </form.AppField>
    <form.SubmitButton>Submit</form.SubmitButton>
  </Form>
);
```

**NEVER use React Hook Form directly.**

### Server Actions
- Suffix files with `.action.ts`
- Use `@src/lib/actions/safe-actions.ts` for all actions
- Use `resolveActionResult` helper for mutations

### API Routes
- All routes in `/app/api` MUST use `@src/lib/zod-route.ts`
- All HTTP requests MUST use `@src/lib/up-fetch.ts` (never raw `fetch`)

### Authentication
- Server: `getUser()` (optional) or `getRequiredUser()` (required)
- Client: `useSession()` from auth-client.ts
- Organization: `getCurrentOrgCache()`

## Styling Preferences
- Use typography components from `@src/components/ui/typography.tsx`
- Prefer `flex flex-col gap-4` over `space-y-4`
- Use Card component from `@src/components/ui/card.tsx`
- Never use emojis (prefer Lucide icons)
- Never use gradients unless explicitly requested

## TypeScript Imports
- `@/*` → `@src`
- `@email/*` → `@emails`
- `@app/*` → `@app`

## Workflow

### Before Editing Files
🚨 **CRITICAL** 🚨
**Read at least 3 files** before editing:
1. Similar files (understand patterns)
2. Imported dependencies (understand APIs)

### Debugging
- Add logs at each step
- Ask user to send logs for debugging

## Important Files
- `src/lib/auth.ts` - Auth configuration
- `src/features/dialog-manager/` - Global dialog system
- `src/features/form/tanstack-form.tsx` - Form setup (**CRITICAL**)
- `src/lib/actions/safe-actions.ts` - Server action utilities
- `src/lib/zod-route.ts` - API route utilities
- `src/site-config.ts` - Site configuration

## Database
- Main schema: `prisma/schema/schema.prisma`
- Auth schema: `prisma/schema/better-auth.prisma` (auto-generated)
- All queries must include `tenant_id` for multi-tenant support
```
</comprehensive_example>

<usage_notes>
This example demonstrates:

- Clear tech stack documentation
- Directory structure visualization
- Critical command distinctions (CI vs interactive)
- Specific code patterns with examples
- Emphasis on critical rules
- File location references
- Workflow requirements
- Import path conventions

Adapt sections to match your project's actual structure and conventions.
</usage_notes>
