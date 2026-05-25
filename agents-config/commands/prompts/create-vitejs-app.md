---
description: Create a Vite.js app with Tailwind CSS v4 and shadcn/ui in the current directory
argument-hint: [template]
---

<objective>
Create a Vite.js project with Tailwind CSS v4 and shadcn/ui in the current directory, handling all edge cases intelligently.

Templates: vanilla, vanilla-ts, vue, vue-ts, react, react-ts, react-swc, react-swc-ts, preact, preact-ts, lit, lit-ts, svelte, svelte-ts, solid, solid-ts, qwik, qwik-ts

Default: react-ts (if no template specified)

Note: shadcn/ui only works with React templates (react, react-ts, react-swc, react-swc-ts)
</objective>

<context>
Directory contents: !`ls -la 2>/dev/null || echo "EMPTY"`
Package.json exists: !`test -f package.json && echo "YES" || echo "NO"`
Vite config exists: !`ls vite.config.* 2>/dev/null || echo "NONE"`
</context>

<verified_sources>
- Vite docs: https://vite.dev/guide/
- Tailwind v4 docs: https://tailwindcss.com/docs/installation/using-vite
- shadcn/ui Vite: https://ui.shadcn.com/docs/installation/vite
- shadcn/ui Tailwind v4: https://ui.shadcn.com/docs/tailwind-v4
</verified_sources>

<process>
1. **Determine template**: Use `$ARGUMENTS` if provided, otherwise `react-ts`

2. **Analyze current directory**:
   - Has `package.json` with vite? → Existing Vite project, add Tailwind + shadcn
   - Has `package.json` without vite? → Add Vite + Tailwind + shadcn
   - No `package.json`? → Create fresh Vite project

3. **Create Vite project** (if needed):
   ```bash
   npm create vite@latest . -- --template <template>
   ```

   If this fails (rare), use subfolder workaround:
   ```bash
   npm create vite@latest .vite-temp -- --template <template>
   mv .vite-temp/* .vite-temp/.* . 2>/dev/null
   rmdir .vite-temp
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Install Tailwind CSS v4**:
   ```bash
   npm install tailwindcss@latest @tailwindcss/vite@latest
   ```

6. **Install @types/node** (required for path aliases):
   ```bash
   npm install -D @types/node
   ```

7. **Configure TypeScript paths** - Edit `tsconfig.json`:
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

   Also edit `tsconfig.app.json` if it exists:
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

8. **Configure Vite** - Edit `vite.config.ts`:
   ```typescript
   import path from "path"
   import tailwindcss from "@tailwindcss/vite"
   import react from "@vitejs/plugin-react"
   import { defineConfig } from "vite"

   export default defineConfig({
     plugins: [react(), tailwindcss()],
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   })
   ```

9. **Setup CSS** - Update `src/index.css`:
   ```css
   @import "tailwindcss";
   ```

10. **Initialize shadcn/ui** (React templates only):
    ```bash
    npx shadcn@latest init
    ```

    When prompted:
    - Style: Default or New York
    - Base color: Neutral (recommended)
    - CSS variables: Yes

    Or non-interactive:
    ```bash
    npx shadcn@latest init -y -b neutral
    ```

11. **Add shadcn components**:
    ```bash
    npx shadcn@latest add button badge
    ```

12. **Create landing page** - Replace `src/App.tsx` with:
    ```tsx
    import { Button } from "@/components/ui/button"
    import { Badge } from "@/components/ui/badge"

    function App() {
      return (
        <div className="min-h-svh bg-gradient-to-b from-background to-muted">
          {/* Hero Section */}
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Badge */}
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                Powered by Vite + Tailwind v4 + shadcn/ui
              </Badge>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">
                  ViteJS
                </span>
                <span className="text-primary"> Ready</span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground">
                Your project is set up with the modern stack. Start building something amazing.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="min-w-40">
                  Get Started
                </Button>
                <Button size="lg" variant="outline" className="min-w-40">
                  Documentation
                </Button>
              </div>

              {/* Tech Stack */}
              <div className="pt-12 flex flex-wrap justify-center gap-8 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Vite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-cyan-500" />
                  <span className="text-sm font-medium">Tailwind v4</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">React</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-neutral-500" />
                  <span className="text-sm font-medium">shadcn/ui</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="container mx-auto px-4 pb-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Lightning Fast", desc: "Instant HMR and optimized builds with Vite" },
                { title: "Type Safe", desc: "Full TypeScript support out of the box" },
                { title: "Beautiful UI", desc: "Pre-built components with shadcn/ui" },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t py-8">
            <p className="text-center text-sm text-muted-foreground">
              Edit <code className="font-mono bg-muted px-1.5 py-0.5 rounded">src/App.tsx</code> to get started
            </p>
          </footer>
        </div>
      )
    }

    export default App
    ```

13. **Clean up default files** (optional):
    - Delete `src/App.css` (styles now in Tailwind)
    - Delete `src/assets/react.svg` (not needed)
    - Update `index.html` title to your project name

14. **Verify setup**:
    ```bash
    npm run dev
    ```

    You should see a modern landing page with:
    - Gradient background
    - "ViteJS Ready" heading
    - Tech stack indicators
    - Feature cards
    - Responsive design
</process>

<edge_cases>
- **Non-React template**: Skip shadcn/ui steps (only add Tailwind). shadcn/ui requires React.
- **Non-empty directory**: Vite supports this natively (PR #15272, Dec 2023)
- **Existing package.json**: Skip Vite creation, add dependencies to existing project
- **Existing vite.config**: MERGE plugins and alias config, don't replace
- **JavaScript (not TypeScript)**: Use `jsconfig.json` instead of `tsconfig.json` for paths
- **PowerShell (Windows)**: Use `---` instead of `--`: `npm create vite@latest . --- --template react-ts`
- **shadcn init fails**: Ensure tsconfig paths and vite alias are configured BEFORE running init
- **Tailwind v4 + shadcn**: Fully supported as of Feb 2025. Uses OKLCH colors, @theme inline directive
</edge_cases>

<shadcn_notes>
- shadcn/ui now supports Tailwind v4 and React 19 (Feb 2025 update)
- Components use `data-slot` attributes for styling
- HSL colors converted to OKLCH
- `toast` deprecated, use `sonner` instead
- Buttons use default cursor (not pointer)
- All components work with modern browsers only
</shadcn_notes>

<success_criteria>
- Vite project created in current directory
- `tailwindcss` and `@tailwindcss/vite` in package.json
- `tailwindcss()` plugin in vite.config
- Path alias `@` configured in tsconfig and vite.config
- `src/index.css` has `@import "tailwindcss"`
- `components.json` exists (shadcn config)
- `src/components/ui/button.tsx` and `badge.tsx` exist
- `src/App.tsx` contains the "ViteJS Ready" landing page
- `npm run dev` runs without errors
- Landing page displays with gradient, heading, buttons, and feature cards
</success_criteria>
