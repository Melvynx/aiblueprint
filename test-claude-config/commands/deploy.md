---
description: Auto-correct TypeScript and ESLint errors for deployment
---

# Deploy Preparation

Automatically fix TypeScript and ESLint errors to prepare code for deployment.

## Workflow
1. Run `pnpm lint` to check for ESLint errors
2. Correct all errors and run `pnpm lint` until no errors remain
3. Run `pnpm ts` to check for TypeScript errors  
4. Correct all errors and run `pnpm ts` until no errors remain

## Commands
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm ts` - Run TypeScript type checking
- `pnpm clean` - Run lint, type check, and format code

I'll now run the deployment preparation workflow to fix any errors.