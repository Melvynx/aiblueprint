---
description: Setup Better Auth with Email OTP authentication and shadcn/ui components in a Next.js project
---

<objective>
Setup Better Auth in the current Next.js project with Email OTP authentication flow.

This creates a production-ready authentication system with Resend email delivery, a beautiful sign-in page using shadcn/ui, and an account management page. Uses Prisma adapter for database integration.
</objective>

<context>
Project structure: !`ls -la`
Prisma schema: !`cat prisma/schema.prisma 2>/dev/null | head -40 || echo "No Prisma schema"`
Existing auth: !`ls src/lib/auth* 2>/dev/null || ls lib/auth* 2>/dev/null || echo "No auth files"`
Path aliases: !`cat tsconfig.json | grep -A5 '"paths"'`
</context>

<process>
## Phase 1: Prerequisites

1. **Ask for Resend API Key** - Prompt user:
   > "I need your Resend API key to send OTP emails. Get it from https://resend.com/api-keys"

2. **Verify Prisma is configured**:
   - Check `prisma/schema.prisma` exists
   - Identify Prisma client import path (custom output or default)
   - Confirm `lib/prisma.ts` singleton exists

## Phase 2: Installation

3. **Install dependencies**:
   ```bash
   pnpm add better-auth resend
   ```

4. **Install shadcn/ui components**:
   ```bash
   pnpm dlx shadcn@latest add input label card button tabs input-otp
   ```

5. **Get reference components** (study then delete):
   ```bash
   pnpm dlx shadcn@latest add https://coss.com/origin/r/comp-326.json
   pnpm dlx shadcn@latest add https://coss.com/origin/r/comp-324.json
   ```

## Phase 3: Configuration

6. **Configure environment variables** - Add to `.env`:
   ```
   BETTER_AUTH_SECRET="[generate with: openssl rand -base64 32]"
   BETTER_AUTH_URL="http://localhost:3000"
   RESEND_API_KEY="[user-provided]"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```

7. **Create Better Auth instance** - `src/lib/auth.ts`:
   ```typescript
   import { betterAuth } from "better-auth";
   import { prismaAdapter } from "better-auth/adapters/prisma";
   import { emailOTP } from "better-auth/plugins";
   import { prisma } from "./prisma";
   import { Resend } from "resend";

   const resend = new Resend(process.env.RESEND_API_KEY);

   export const auth = betterAuth({
     database: prismaAdapter(prisma, { provider: "postgresql" }),
     emailAndPassword: { enabled: false },
     plugins: [
       emailOTP({
         async sendVerificationOTP({ email, otp, type }) {
           await resend.emails.send({
             from: process.env.RESEND_FROM_EMAIL!,
             to: email,
             subject: type === "sign-in" ? "Sign in to your account" : "Verify your email",
             html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`,
           });
         },
         otpLength: 6,
         expiresIn: 300,
       }),
     ],
     secret: process.env.BETTER_AUTH_SECRET!,
     baseURL: process.env.BETTER_AUTH_URL!,
   });
   ```

8. **Generate Prisma schema** using Better Auth CLI:
   ```bash
   npx @better-auth/cli generate --config src/lib/auth.ts
   npx prisma migrate dev --name add_better_auth
   npx prisma generate
   ```

9. **Create API route handler** - `app/api/auth/[...all]/route.ts`:
   ```typescript
   import { auth } from "@/lib/auth";
   import { toNextJsHandler } from "better-auth/next-js";

   export const { GET, POST } = toNextJsHandler(auth.handler);
   ```

10. **Create auth client** - `src/lib/auth-client.ts`:
    ```typescript
    import { createAuthClient } from "better-auth/react";
    import { emailOTPClient } from "better-auth/client/plugins";

    export const authClient = createAuthClient({
      baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
      plugins: [emailOTPClient()],
    });

    export const { signIn, signOut, useSession } = authClient;
    ```

## Phase 4: UI Implementation

11. **Study reference components** - Read comp-326 and comp-324 patterns:
    - Note form layouts, validation patterns, UX flows
    - Understand OTP input behavior

12. **Create sign-in page** - `app/sign-in/page.tsx`:
    - Two-step flow: email input → OTP verification
    - Use `InputOTP` component with 6 slots
    - Auto-submit on complete with `onComplete` handler
    - Loading states and error handling with `text-destructive`
    - Redirect to `/account` on success

13. **Create account page** - `app/account/page.tsx`:
    - Protected route (redirect if no session)
    - Tabs for Profile and Security
    - Profile form with name update
    - Sign out button
    - Session info display

14. **Delete reference components** - Remove comp-326 and comp-324 files

## Phase 5: Integration & Testing

15. **Update layout** - Add TanStack Query provider if needed for session management

16. **Update home page** - Add auth status display with sign-in/account links

17. **Test complete flow**:
    - Navigate to `/sign-in`
    - Enter email, receive OTP
    - Verify OTP, redirect to `/account`
    - Update name, sign out
</process>

<constraints>
**UI RULES**:
- ONLY use shadcn/ui components and theme colors
- NEVER use custom colors - only background, foreground, primary, secondary, muted, accent, destructive
- All styling via Tailwind with theme-aware classes
- NO hardcoded colors like #000, blue-500, etc.

**FLEXIBILITY**:
- Check Prisma client location before importing
- Adapt all paths to project structure
- Match existing path alias conventions
</constraints>

<success_criteria>
- Sign-in page renders with email input
- OTP email is sent via Resend
- OTP verification signs user in
- Account page shows session data
- Name update persists to database
- Sign out clears session and redirects
- No TypeScript or linting errors
</success_criteria>
