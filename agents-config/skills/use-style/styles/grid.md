# Grid Style

Structured, builder-centric landing aesthetic. A technical spec sheet, not a marketing funnel.

**Reference implementations:** `/aibuilder`, `/aiblueprint`, `/agents`

---

## Core vibe

- **Blueprint / terminal** look. Reads like a spec sheet, not a soft SaaS funnel.
- **Square geometry.** Zero border-radius on structural UI.
- **Line-driven hierarchy.** 1px borders and dividers, never shadows or blur.
- **Condensed display type** for hero and section titles (Science Gothic or an equivalent condensed grotesk).
- **Mono for data.** Prices, counts, nav, buttons, and status chips.
- **Generous whitespace.** Section padding scales with the breakpoint.

---

## Color

Use existing design tokens. Do **not** invent a new palette.

| Role | Token | Usage |
|------|-------|-------|
| Canvas | `--background` | Page and section fill |
| Ink | `--foreground` | Headlines, primary buttons |
| Muted ink | `--muted-foreground` | Body, descriptions, sold-out rows |
| Structure | `--border` | Dividers, boxes, ghost buttons |
| Accent | `--primary` | Highlights, active tier, CTA emphasis |
| Accent surface | `--primary/5` | Active pricing row background |
| Muted surface | `--muted/20` | Sidebar panels |
| Card | `--card` | Bordered panels |

Status (sold out, success) may use the existing destructive/emerald tokens at low opacity.

**Codelynx:** wrap pages in `theme-aiblueprint` (or the product theme class). See `.agents/styles/grid-theme.md` for token detail.

---

## Typography

| Level | Font | Pattern |
|-------|------|---------|
| Hero H1 | Condensed display | `text-2xl sm:text-4xl md:text-5xl lg:text-6xl`, tight tracking, `leading-none` |
| Section H2 | Condensed display | `text-2xl sm:text-3xl md:text-4xl` |
| Small display | Condensed display | `text-xl sm:text-2xl` (guarantee blocks, compact titles) |
| Body | Sans | `text-base sm:text-lg leading-relaxed text-muted-foreground` |
| Nav / button / data | Mono | `font-mono uppercase tracking-wider text-xs` |
| Price / count | Mono tabular | `font-mono tabular-nums` |

### Title accent syntax

`GridThemeSectionTitle` parses `**bold phrase**` inside a string title and wraps it in `<span className="text-primary">`.

### Display font loading

Scope the display font to the routes that need it (layout + co-located CSS), not globally.

**Codelynx:** `GT_DISPLAY_FONT = "font-science-gothic font-normal tracking-tight leading-none"`, loaded via `science-gothic.css`.

---

## Layout tokens

Responsive shell and section rhythm. Names vary by repo; the semantics stay the same.

| Token | Value (Codelynx) | Purpose |
|-------|------------------|---------|
| `GT_SHELL` | `mx-auto max-w-5xl px-3 pb-8 pt-2 sm:max-w-6xl sm:px-6 sm:pt-0 md:px-8 md:pb-10 lg:px-10 lg:pb-14 xl:px-12 xl:pb-16` | Outer page wrapper |
| `GT_FRAME_X` | `px-5 sm:px-8 md:px-10 lg:px-18 xl:px-20` | Horizontal padding for header and sections |
| `GT_SECTION` | `GT_FRAME_X` + `py-5 sm:py-8 md:py-10 lg:py-18 xl:py-20` | Section wrapper |
| `GT_STACK_PADDING` | `px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 xl:px-12 xl:py-12` | Inner card/row padding |
| `GT_SECTION_TITLE_GAP` | `mb-8 md:mb-10 lg:mb-12` | Margin below section titles |
| `GT_DIVIDER_NARROW` | `mx-auto max-w-md border-t border-border sm:max-w-lg` | Narrow centered hero divider |

### Responsive scale (matches the live tokens above)

| Property | base | sm | md | lg | xl |
|----------|------|----|----|----|----|
| Shell max-width | max-w-5xl | max-w-6xl | - | - | - |
| Shell px | px-3 | px-6 | px-8 | px-10 | px-12 |
| Shell pt | pt-2 | pt-0 | - | - | - |
| Section py | py-5 | py-8 | py-10 | py-18 | py-20 |
| Frame px | px-5 | px-8 | px-10 | px-18 | px-20 |
| Stack padding | px-5 py-5 | px-6 py-6 | px-8 py-8 | px-10 py-10 | px-12 py-12 |

**Rule:** Only remove top padding on the outer shell (`sm:pt-0`). Never strip section vertical padding globally.

---

## Page shell

```
+----------------------------------------------- viewport --+
|  GT_SHELL (max-w-5xl/6xl, responsive px)                  |
|  +-----------------------------------------------------+  |
|  |  border-x border-b border-border bg-background      |  |
|  |  - Sticky header (GT_FRAME_X, divider bottom)       |  |
|  |  - Section (GT_SECTION)                             |  |
|  |  - Full-bleed section divider                       |  |
|  |  - Section ...                                      |  |
|  |  - Footer                                           |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
```

```tsx
<div className="theme-aiblueprint bg-background text-foreground relative min-h-full overflow-x-hidden">
  <div className={GT_SHELL}>
    <div className="border-x border-b border-border bg-background">
      <PageHeader />
      <SectionA />
      <GridThemeSectionDivider />
      <SectionB />
    </div>
  </div>
</div>
```

### Full-bleed divider

Breaks out of the bordered frame to the viewport edges:

```tsx
className="relative left-1/2 w-screen -translate-x-1/2 border-t border-border"
```

Place it between sections inside the bordered frame. The header uses its own bottom divider, so the frame has no top border.

---

## Component patterns

Reuse the Codelynx primitives from `grid-theme-primitives.tsx` rather than rebuilding these.

| Component | Notes |
|-----------|-------|
| `GridThemeSectionTitle` | Props `title`, `description?`, `label?`, `align?`, `size?`. `align="center"` for hero-adjacent sections, `size="sm"` for compact titles. Omit `label` in the main flow. |
| `GridThemeButton` | Link-styled CTA. Variants `primary` (filled `bg-foreground`) and `ghost` (border only). Square, mono, `h-12 px-6`. |
| `GridThemeFeatureRow` | Two-column row: square icon box + title/description. No left label column. |
| `GridThemeBorderedStack` | Outer `border divide-y` container + padded `GridThemeStackSection` children. FAQ stacks, guarantee blocks, feature lists. |
| `GridThemeCompareTable` | 3-column comparison. Square borders, muted header, highlight column defaults to center/right. |
| `GridThemeSplitCard` | Two-column card with a vertical divider on `md+`. |
| `GridThemeBlockquote` | Left-bordered quote (`border-l-2 border-primary`). |
| `GridThemeStatusBox` / `GridThemePixelProgress` | Batch counter UI with a pixel progress grid. |
| `GridThemePricingTiers` | Tier list with a batch counter. Parent owns `divide-y`. |

---

## Grid patterns

### Feature grid (gap-px is fine here)

Dense icon/tile grid where every cell owns a border:

```tsx
<div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <div key={item.title} className="bg-background px-5 py-6">...</div>
  ))}
</div>
```

`gap-px` + `bg-border` works only when every cell sets `bg-background`.

### Image proof grid (no gap-px)

Photos sit edge-to-edge. Use `divide-*`, not `gap-px`:

```tsx
// Good: no gray band between images
<div className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
  {images.map((src) => (
    <Image key={src} className="block w-full bg-background" />
  ))}
</div>

// Bad: visible gray gutters
<div className="grid gap-px bg-border">
```

### Bordered stack

```tsx
<div className="border border-border divide-y divide-border">
  {rows.map(...)}
</div>
```

The parent owns the separators. Child rows must not override with conflicting `py-*` that breaks `first:pt-0`.

---

## Sticky header

```tsx
<header className="sticky top-0 z-50 bg-background">
  <div className={cn("flex h-12 items-center", GT_FRAME_X)}>...</div>
  <GridThemeSectionDivider />
</header>
```

- Full-width divider under the nav.
- No top border on the main frame (`border-x border-b` only).
- Nav links: `font-mono text-[10px] uppercase tracking-wider text-muted-foreground`.

---

## Legacy component integration

Wrap existing blocks that cannot be rewritten yet:

```tsx
<div className="overflow-x-hidden [&_*]:!rounded-none [&_*]:!shadow-none">
  <LegacyPricing showDecorativeGlow={false} gridTheme />
</div>
```

| Technique | Effect |
|-----------|--------|
| `showDecorativeGlow={false}` | Removes the blur gradient halo |
| `gridTheme` prop | Switches guarantee/FAQ to grid components |
| `[&_*]:!rounded-none` | Forces square corners on nested legacy UI |
| `[&_*]:!shadow-none` | Removes drop shadows from nested legacy UI |

---

## Charts (blueprint data viz)

When charting (e.g. Chart.js), keep it as flat and square as the rest of the UI:

- Series in the token grays: `--foreground`, `--muted-foreground`, `--border`, with **one** `--primary` accent for the highlighted series. No rainbow palettes.
- **Square bars** (`borderRadius: 0`, or 2px max). Flat fills, no gradients, no glow.
- Gridlines `--border`; axis labels **mono** (`Geist Mono`), uppercase where it fits, muted color.
- Tooltip: inverted - `--foreground` background, `--background` text, square corners.
- Doughnut/pie: thin segments separated by a `--background` stroke; legend in mono.
- Bar category labels use the mono tabular treatment (prices/counts), matching the rest of the data type.

```js
const FG=getVar('--foreground'), MUTED=getVar('--muted-foreground'), BORDER=getVar('--border'), PRIMARY=getVar('--primary');
Chart.defaults.font.family = "Geist Mono, ui-monospace, monospace";
// bars: backgroundColor:[MUTED, FG], borderRadius:0
// grid: { color: BORDER }, ticks: { font:{ family:'Geist Mono' } }
// tooltip: { backgroundColor: FG, cornerRadius: 0 }
```

---

## Motion & effects

- No blur halos, glass morphism, or large drop shadows.
- Hover changes color/background only (`hover:bg-muted`, `hover:bg-foreground/90`).
- `transition-colors` on interactive elements.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| `rounded-xl`, `rounded-2xl`, `rounded-full` on structural UI | Breaks the grid aesthetic |
| `shadow-2xl`, `ring-*`, `backdrop-blur-*` | Replaces line hierarchy with depth |
| Gradient section backgrounds | Keep flat `bg-background` |
| `gap-px` + `bg-border` on image grids | Creates gray bands between photos |
| `last:border-b-0` on tier rows inside a `divide-y` parent | Removes the active tier bottom border |
| `sm:py-8` on the first stack row | Overrides `first:pt-0` |
| Global removal of section `py-*` | Breaks vertical rhythm; target the shell only |
| Mono overline labels everywhere | Use sparingly |

---

## Codelynx file map

When working in `codelynx.dev-v2`, prefer these over reimplementing:

| Path | Role |
|------|------|
| `.agents/styles/grid-theme.md` | Full project spec (tokens, file paths) |
| `.agents/styles/grid-theme-migration.md` | Migration playbook |
| `src/features/product-landings/pages/aibuilder/_landing/grid-theme/` | Primitives + components |
| `src/features/product-landings/pages/aibuilder/view.tsx` | Reference landing |
| `src/features/product-landings/pages/aiblueprint/view.tsx` | AI Blueprint landing |
| `src/features/product-landings/pages/agents/view.tsx` | Agents landing |
