---
description: Setup Prisma ORM with PostgreSQL in a Next.js project with schema, migrations, and seed data
---

<objective>
Setup Prisma in the current Next.js project with a production-ready database configuration.

This creates a complete database layer including schema, migrations, client helper, seed script, and API routes for verification. Designed for projects using Neon PostgreSQL.
</objective>

<context>
Project structure: !`ls -la`
Package manager: !`cat package.json | grep -A2 '"packageManager"'`
Existing prisma config: !`ls prisma/ 2>/dev/null || echo "No prisma folder yet"`
TypeScript config: !`cat tsconfig.json | head -30`
</context>

<process>
## Phase 1: Information Gathering

1. **Ask for table structure** - Prompt user to describe ONE simple table to verify Prisma works:
   - Table name and purpose
   - Fields with types (String, Int, DateTime, Boolean)
   - Example: "Post table with id, title, content, published, createdAt"

2. **Inspect existing structure** - Before coding:
   - Check if `src/` folder exists
   - Read `tsconfig.json` for path aliases
   - Identify where `lib/` folder should be created

## Phase 2: Installation

3. **Install dependencies**:
   ```bash
   pnpm add prisma @prisma/client
   pnpm add -D tsx
   npx prisma init
   ```

4. **Configure database provider** - Update `prisma/schema.prisma`:
   - Set provider to "postgresql"
   - Configure generator output path based on project structure

## Phase 3: Schema & Configuration

5. **Create schema** - Add the user-defined table with:
   - `id` as String with `@id @default(cuid())`
   - User-specified fields
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`

6. **Configure exclusions**:
   - Add generated folder to `.eslintignore`
   - Add generated folder to `tsconfig.json` exclude array

7. **Create Prisma client helper** - Create singleton pattern in `lib/prisma.ts`:
   ```typescript
   import { PrismaClient } from "@/generated/client";

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient();

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

8. **Create prisma.config.ts** - Root configuration:
   ```typescript
   import path from "node:path";
   import { defineConfig } from "prisma/config";

   export default defineConfig({
     schema: path.join("prisma", "schema.prisma"),
     migrations: {
       seed: `tsx prisma/seed.ts`,
     },
   });
   ```

## Phase 4: Data & Verification

9. **Create seed script** - `prisma/seed.ts` with 5-10 realistic records

10. **Run migrations**:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    npx prisma db seed
    ```

11. **Create example API route** - `app/api/example/route.ts`:
    - GET endpoint fetching all records
    - POST endpoint creating new record
    - Proper error handling

12. **Add package.json scripts**:
    ```json
    {
      "db:generate": "prisma generate",
      "db:push": "prisma db push",
      "db:migrate": "prisma migrate dev",
      "db:studio": "prisma studio",
      "db:seed": "prisma db seed"
    }
    ```

## Phase 5: Documentation

13. **Update CLAUDE.md** with:
    - Database provider and connection info
    - Schema overview
    - Available db scripts
</process>

<constraints>
**FORBIDDEN - Do not create**:
- User, Account, Session, VerificationToken tables (auth tables)
- Any user-related fields or foreign keys
- More than ONE table (keep it minimal for verification)

**REQUIRED**:
- Adapt paths to existing project structure
- Use cuid() for IDs, not uuid or auto-increment
- Configure generator output path correctly
- Create seed data with realistic values
</constraints>

<success_criteria>
- `pnpm prisma generate` completes without errors
- `pnpm prisma migrate dev` creates migration successfully
- `pnpm prisma db seed` populates database
- API route returns data when called
- No TypeScript or ESLint errors in generated files
</success_criteria>
