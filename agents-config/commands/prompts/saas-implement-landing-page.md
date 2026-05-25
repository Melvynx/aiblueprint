---
description: Implement a production-ready landing page from specification using shadcn/ui components
---

<objective>
Implement a complete, production-ready landing page from a markdown specification file using high-quality Shadcn UI components.

This comes AFTER the PRD, ARCHI, and LANDING_PAGE copywriting. Transform the specification into a fully functional, modern landing page using the Shadcn UI ecosystem.
</objective>

<role>
You are a senior frontend developer and design systems specialist with 10+ years experience building production-ready landing pages using modern UI components and design patterns.
</role>

<context>
Project structure: !`ls -la`
Existing components: !`ls src/components/ 2>/dev/null || ls components/ 2>/dev/null || echo "No components folder"`
CSS variables: !`cat app/globals.css 2>/dev/null | head -50 || cat src/app/globals.css 2>/dev/null | head -50 || echo "No globals.css"`
</context>

<process>
## Phase 1: Read Specification

1. **Ask for spec file location**:
   > "Please provide the path to your landing page specification file (LANDING_PAGE.md)."

2. **Read and extract from spec**:
   - Sections needed (Hero, Features, Pricing, FAQ, etc.)
   - Content (headlines, descriptions, CTAs, images)
   - Design preferences (colors, style, brand)
   - Target audience

3. **STOP if spec is missing** - Ask user for complete specification

## Phase 2: Analyze Project

4. **Ask for project location** if not provided

5. **Explore project structure** (use Glob):
   - `**/*.tsx` - existing components
   - `**/globals.css` - styling and CSS variables
   - `**/tsconfig.json` - path aliases
   - `components.json` - shadcn setup

6. **Read key config files**:
   - `tsconfig.json` - path aliases (@/*)
   - `app/globals.css` - CSS variables and theme

7. **Document findings**:
   - Framework version (Next.js 14/15)
   - Component organization pattern
   - Existing UI components
   - Path aliases and imports

## Phase 3: Research Components

8. **Use MCP Context7** to research Shadcn UI:
   - `mcp__context7__resolve-library-id` with "shadcn-ui"
   - `mcp__context7__get-library-docs` for component patterns

9. **Component source hierarchy** (priority order):
   - **Official Shadcn UI** (ui.shadcn.com) - Base components
   - **Shadcn UI Blocks** (shadcn-ui-blocks.akashmoradiya.com) - Pre-built sections
   - **Coss.com** (coss.com/origin) - Modern components
   - **Aceternity UI** (ui.aceternity.com) - Advanced effects (selective use)

10. **Create `landing-page-components.md`** documenting:
    - Component source for each section
    - Installation command
    - Customization notes

## Phase 4: Configure Theme

11. **Configure CSS variables** in `app/globals.css` based on spec brand colors:
    ```css
    :root {
      --primary: /* brand primary */;
      --secondary: /* brand secondary */;
    }
    ```

12. **Ensure contrast** - 4.5:1 for text (WCAG AA)

## Phase 5: Install Components

13. **Install base components**:
    ```bash
    npx shadcn@latest add button card input label badge separator
    npx shadcn@latest add navigation-menu dropdown-menu sheet
    npx shadcn@latest add accordion dialog
    ```

14. **Install section-specific components** from blocks:
    ```bash
    npx shadcn add https://shadcn-ui-blocks.akashmoradiya.com/r/hero-03.json
    npx shadcn add https://shadcn-ui-blocks.akashmoradiya.com/r/features-01.json
    ```

## Phase 6: Build Sections

15. **Create component files** in `src/features/landing/` (or match existing structure):

**Navigation** (`navbar.tsx`):
- Logo, nav links, mobile menu
- Sticky header with backdrop blur
- CTA button

**Hero** (`hero.tsx`):
- Headline from spec (H1)
- Subheadline (H2)
- Primary/secondary CTAs
- Hero image with next/image

**Features** (`features.tsx`):
- Section headline
- Feature cards with icons (lucide-react)
- Grid layout (3 columns desktop)

**Social Proof** (`testimonials.tsx`) - if in spec:
- Testimonial cards
- Logo cloud
- Statistics

**Pricing** (`pricing.tsx`) - if in spec:
- Pricing tiers with Card component
- Feature lists with checkmarks
- Popular tier highlight
- CTA buttons

**FAQ** (`faq.tsx`) - if in spec:
- Accordion component
- All questions from spec

**CTA** (`cta.tsx`):
- Compelling headline
- Action buttons
- Background styling

**Footer** (`footer.tsx`):
- Navigation columns
- Social links (lucide-react icons)
- Legal links
- Copyright

## Phase 7: Assemble Page

16. **Update `app/page.tsx`**:
    ```typescript
    import { Navbar } from "@/features/landing/navbar"
    import { Hero } from "@/features/landing/hero"
    import { Features } from "@/features/landing/features"
    // ... other imports

    export default function HomePage() {
      return (
        <>
          <Navbar />
          <main>
            <Hero />
            <Features />
            {/* Other sections */}
          </main>
          <Footer />
        </>
      )
    }
    ```

17. **Add smooth scrolling** in `globals.css`:
    ```css
    html { scroll-behavior: smooth; }
    ```

## Phase 8: Quality Assurance

18. **Mobile responsiveness**:
    - Test at 375px (iPhone SE)
    - Verify touch targets (44x44px min)
    - Check text readability (16px min)
    - Test mobile navigation

19. **Accessibility audit**:
    - Tab through entire page
    - Verify heading hierarchy (h1 → h2 → h3)
    - Check alt text on images
    - Verify color contrast
    - Add ARIA labels on icon buttons

20. **Performance optimization**:
    - Use next/image with width/height
    - Add `priority` to hero image
    - Use `loading="lazy"` below fold

21. **Final verification**:
    ```bash
    pnpm format
    pnpm lint
    pnpm ts
    pnpm build
    ```
</process>

<constraints>
**DESIGN STANDARDS**:
- Modern, contemporary design (not dated Bootstrap-style)
- Mobile-first responsive approach
- WCAG 2.1 AA accessibility compliance
- Lighthouse score 90+ target

**CODE QUALITY**:
- Follow existing project conventions
- Use path aliases (@/components, @/features)
- TypeScript strict mode
- No placeholder content - use real spec content

**COMPONENT RULES**:
- Prioritize official Shadcn UI components
- Use next/image for all images
- Use next/font for typography
- Respect existing component patterns

**NEVER**:
- Overwrite existing components without understanding
- Use placeholder text instead of spec content
- Skip mobile responsiveness
- Ignore accessibility requirements
- Add unused dependencies
</constraints>

<output>
**Files created in `src/features/landing/`** (or matching structure):
- `navbar.tsx` - Navigation header
- `hero.tsx` - Hero section
- `features.tsx` - Features grid
- `pricing.tsx` - Pricing tiers (if in spec)
- `faq.tsx` - FAQ accordion (if in spec)
- `cta.tsx` - Call-to-action sections
- `footer.tsx` - Footer navigation

**Documentation**:
- `landing-page-components.md` - Component sources and customizations

**Updated files**:
- `app/page.tsx` - Assembled landing page
- `app/globals.css` - Theme variables and brand colors
</output>

<success_criteria>
- All spec sections implemented with real content (not placeholders)
- Mobile responsive on all breakpoints (375px, 768px, 1024px, 1440px)
- WCAG 2.1 AA accessible (keyboard nav, contrast, alt text)
- Lighthouse performance score 90+
- All links and CTAs functional
- No console errors
- Build passes without warnings
- Matches spec design preferences and brand colors
</success_criteria>
