---
description: Setup a complete Next.js project with TypeScript, Tailwind, shadcn/ui, TanStack Query, and theme support
---

<objective>
Setup a production-ready Next.js project in the current directory with the complete AIBlueprint stack.

This creates a Next.js 15 App Router project with TypeScript, Tailwind CSS, shadcn/ui components, TanStack Query, dark/light theme toggle, dialog manager, server toast, and a landing page with navbar.
</objective>

<context>
Current directory: !`pwd`
Directory contents: !`ls -la`
Existing package.json: !`cat package.json 2>/dev/null | head -10 || echo "No package.json"`
</context>

<process>
## Phase 1: Project Initialization

1. **Create Next.js project**:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
   ```

2. **Create src directory structure**:
   ```bash
   mkdir -p src/components src/lib src/features/landing
   ```

3. **Update tsconfig.json** - Configure path aliases:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

4. **Clean default files** - Replace `app/page.tsx` with simple placeholder

## Phase 2: Core Libraries

5. **Install TanStack Query**:
   ```bash
   pnpm add @tanstack/react-query
   ```

6. **Create providers** - `app/providers.tsx`:
   ```typescript
   "use client";

   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
   import { ThemeProvider } from "next-themes";
   import { useState } from "react";

   export function Providers({ children }: { children: React.ReactNode }) {
     const [queryClient] = useState(
       () => new QueryClient({
         defaultOptions: {
           queries: { staleTime: 60 * 1000 },
         },
       })
     );

     return (
       <QueryClientProvider client={queryClient}>
         <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           {children}
         </ThemeProvider>
       </QueryClientProvider>
     );
   }
   ```

7. **Wrap layout with providers** - Update `app/layout.tsx`

## Phase 3: UI Components

8. **Initialize shadcn/ui**:
   ```bash
   pnpm dlx shadcn@latest init
   ```
   Configure paths: Components `@/components`, Utils `@/lib/utils`

9. **Install base components**:
   ```bash
   pnpm dlx shadcn@latest add button input card
   ```

10. **Install next-themes**:
    ```bash
    pnpm add next-themes
    ```

11. **Create theme toggle** - `src/components/theme-toggle.tsx`:
    - Use `useTheme` from next-themes
    - Handle mounted state for hydration
    - Toggle between dark and light

## Phase 4: UI Utilities

12. **Install dialog manager**:
    ```bash
    pnpm dlx shadcn@latest add https://ui.nowts.app/r/dialog-manager.json
    ```

13. **Install server toast**:
    ```bash
    pnpm dlx shadcn@latest add https://ui.nowts.app/r/server-toast.json
    ```

14. **Update layout** - Add to `app/layout.tsx`:
    ```typescript
    import { DialogManagerRenderer } from "@/lib/dialog-manager/dialog-manager-renderer";
    import { ServerToaster } from "@/components/server-toast/server-toast.server";
    import { Suspense } from "react";

    // Inside body after Providers:
    <DialogManagerRenderer />
    <Suspense>
      <ServerToaster />
    </Suspense>
    ```

## Phase 5: Landing Page

15. **Install navbar**:
    ```bash
    pnpm dlx shadcn@latest add https://coss.com/origin/r/comp-577.json
    ```
    Rename to `navbar.tsx` with semantic component name

16. **Install landing sections**:
    ```bash
    pnpm dlx shadcn@latest add https://shadcn-ui-blocks.akashmoradiya.com/r/hero-03.json
    pnpm dlx shadcn@latest add https://shadcn-ui-blocks.akashmoradiya.com/r/footer-05.json
    pnpm dlx shadcn@latest add https://shadcn-ui-blocks.akashmoradiya.com/r/faq-02.json
    ```

17. **Organize landing components**:
    - Move to `src/features/landing/`
    - Rename: `hero.tsx`, `footer.tsx`, `faq.tsx`
    - Update component names inside files

18. **Assemble landing page** - Update `app/page.tsx`:
    - Import all landing components
    - Navbar with logo, signin link, theme toggle
    - Hero, FAQ, Footer sections

## Phase 6: Quality & Documentation

19. **Add quality scripts** to `package.json`:
    ```json
    {
      "lint": "eslint .",
      "ts": "tsc --noEmit"
    }
    ```

20. **Run quality checks**:
    ```bash
    pnpm lint
    pnpm ts
    ```
    Fix any errors before completing

21. **Create CLAUDE.md** with:
    - Stack overview (Next.js 15, TanStack Query, shadcn/ui)
    - Directory structure explanation
    - UI Utilities section (dialog manager, server toast usage)
    - Project structure section

22. **Create AGENTS.md** as symlink:
    ```bash
    ln -s CLAUDE.md AGENTS.md
    ```
</process>

<output>
**Files created**:
- `app/` - Next.js App Router pages and layouts
- `src/components/` - UI components including shadcn/ui
- `src/lib/` - Utilities and helpers
- `src/features/landing/` - Landing page components
- `CLAUDE.md` - Project documentation
- `AGENTS.md` - Symlink to CLAUDE.md
</output>

<success_criteria>
- `pnpm dev` starts without errors
- `pnpm lint` passes
- `pnpm ts` passes (no TypeScript errors)
- Landing page renders with navbar, hero, FAQ, footer
- Theme toggle switches between dark/light mode
- Dialog manager and server toast are integrated
- CLAUDE.md contains complete stack documentation
</success_criteria>
