# Vercel Simple Style

Minimal dark-mode developer UI. High contrast, line-driven structure, no decoration.

**Reference vibe:** Vercel dashboard, blog, and data tools (take-home pay, country index).

---

## Core vibe

- **Developer-first.** Utilitarian, not marketing-soft.
- **Pure dark canvas.** Black background, white primary text, gray hierarchy.
- **Line over depth.** 1px borders define structure; no shadows or blur.
- **Restrained radius.** `0` on data/tool surfaces, `6-8px` on nav buttons and cards in app shells.
- **Monospace for data.** Labels, nav, tables, inputs, metadata.
- **Sans for prose.** Blog posts, long descriptions, dashboard titles (Geist / Inter stack).
- **Generous whitespace.** Wide section gaps, airy row padding.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#000000` | `--vs-bg` | Page background |
| Surface | `#111111` | `--vs-surface` | Summary boxes, sidebar panels, inset blocks |
| Surface raised | `#1a1a1a` | `--vs-surface-raised` | Hover rows, secondary panels |
| Ink | `#ffffff` | `--vs-fg` | Headlines, primary values, active tab text |
| Muted ink | `#888888` | `--vs-muted-fg` | Descriptions, metadata, inactive tabs |
| Subtle ink | `#a1a1aa` | `--vs-subtle-fg` | Breadcrumbs, timestamps, helper text |
| Border | `#333333` | `--vs-border` | Boxes, dividers, input outlines |
| Border strong | `#444444` | `--vs-border-strong` | Active/hover borders |
| Data bar | `#666666` | `--vs-bar` | Progress / comparison bars |
| Link | `#0070f3` | `--vs-link` | Text links, copy actions |
| Success | `#50e3c2` | `--vs-success` | Stable / success states |
| Error | `#ee0000` | `--vs-error` | Failed states |

### Tailwind mapping (when no project tokens)

```css
:root {
  --vs-bg: #000;
  --vs-surface: #111;
  --vs-fg: #fff;
  --vs-muted-fg: #888;
  --vs-border: #333;
  --vs-link: #0070f3;
}
```

| Tailwind | Value |
|----------|-------|
| `bg-black` | Canvas |
| `bg-[#111]` | Surface |
| `text-white` | Primary |
| `text-[#888]` | Muted |
| `border-[#333]` | Structure |

**Rule:** Keep 90% of the UI monochromatic. Color accents only for links, status, and flag/icon glyphs.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (prose / dashboard) | `Geist, Inter, ui-sans-serif, system-ui, sans-serif` |
| Mono (data / tools) | `Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace` |

Load Geist via `@fontsource/geist-sans` / `@fontsource/geist-mono`, or `next/font/local` in Next.js.

### Scale

| Level | Font | Pattern |
|-------|------|---------|
| Page title | Sans or Mono | `text-2xl md:text-3xl font-medium tracking-tight text-white` |
| Section label | Mono | `text-[10px] sm:text-xs uppercase tracking-wider text-[#888]` |
| Body | Sans | `text-sm md:text-base leading-relaxed text-[#888]` |
| Data / nav / button | Mono | `font-mono text-xs uppercase tracking-wide` |
| Large input value | Mono | `font-mono text-2xl md:text-3xl tabular-nums text-white` |
| Metadata | Sans or Mono | `text-xs text-[#888]` |

### Section labels

All-caps, small, muted gray. Examples: `TAX`, `TOOLS`, `SORT BY`, `YOUR GROSS ANNUAL SALARY`.

```tsx
<p className="font-mono text-xs uppercase tracking-wider text-[#888]">Tools</p>
```

---

## Layout tokens

| Token | Value |
|-------|-------|
| `VS_SHELL` | `mx-auto w-full max-w-5xl px-4 sm:px-6 md:px-8` |
| `VS_SHELL_WIDE` | `max-w-7xl` (dashboard) |
| `VS_SECTION` | `py-12 md:py-16 lg:py-20` |
| `VS_STACK` | `px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6` |
| `VS_GAP_SECTION` | `mb-12 md:mb-16` |

### Page shell (tool / index)

```
+---------------------------------------- viewport --+
|  VS_SHELL                                          |
|  - Section label (mono, uppercase, muted)          |
|  - Page title                                      |
|  - Description (muted sans)                         |
|  - Search / controls                               |
|  - Bordered grid or list                           |
+----------------------------------------------------+
```

```tsx
<div className="min-h-screen bg-black text-white">
  <main className={VS_SHELL}>
    <section className={VS_SECTION}>...</section>
  </main>
</div>
```

### App shell (dashboard)

Sidebar + main. Sidebar is narrow, icon + label, muted inactive links.

```tsx
<div className="flex min-h-screen bg-black">
  <aside className="w-56 border-r border-[#333]">...</aside>
  <main className="flex-1 p-6 md:p-8">...</main>
</div>
```

---

## Borders & radius

| Context | Radius | Border |
|---------|--------|--------|
| Data tools, country lists, tables | `rounded-none` | `border border-[#333]` |
| Cards, project tiles, blog feature | `rounded-lg` (8px) | `border border-[#333]` |
| Primary button | `rounded-md` (6px) | filled or outline |
| Inputs | `rounded-none` or `rounded-md` | `border border-[#333] bg-transparent` |

Dividers: `border-t border-[#333]`, full width inside the container.

---

## Component patterns

### Search input

```tsx
<input
  className="w-full border border-[#333] bg-transparent px-4 py-3 font-mono text-sm text-white placeholder:text-[#888] focus:border-[#444] focus:outline-none"
  placeholder="Search countries..."
/>
```

### Link row (index grid)

Bordered box, icon left, title white, arrow right.

```tsx
<a className="flex items-center justify-between border border-[#333] px-4 py-3 transition-colors hover:border-[#444] hover:bg-[#111]">
  <span className="flex items-center gap-3 font-mono text-sm text-white">...</span>
  <span className="font-mono text-[#888]">{"->"}</span>
</a>
```

### Tab / sort toggle

Inactive: gray border + gray text. Active: white border + white text.

```tsx
<button className={cn(
  "border px-3 py-1.5 font-mono text-xs uppercase tracking-wide",
  active ? "border-white text-white" : "border-[#333] text-[#888]"
)}>...</button>
```

### Data table row

Row inside a bordered container. Primary number is white + mono tabular. Secondary detail is muted and small.

```tsx
<div className="flex items-center gap-4 border-b border-[#333] px-4 py-4 last:border-b-0">
  <span className="w-28 font-mono text-sm">Germany</span>
  <div className="h-2 flex-1 bg-[#333]">
    <div className="h-full bg-[#666]" style={{ width: `${pct}%` }} />
  </div>
  <span className="font-mono tabular-nums text-white">52,340</span>
</div>
```

Progress bars: track `#333`, fill `#666`. Flat, no gradient.

### Summary / highlight box

```tsx
<div className="border border-[#333] bg-[#111] px-5 py-4 font-mono text-sm">
  <span className="text-[#888]">Best value: </span>
  <span className="text-white">Bulgaria</span>
</div>
```

### Card (dashboard / blog)

```tsx
<div className="rounded-lg border border-[#333] bg-black p-4 transition-colors hover:border-[#444]">
  <div className="mb-3 flex items-start justify-between">...</div>
  <h3 className="text-sm font-medium text-white">Project name</h3>
  <p className="mt-1 text-xs text-[#888]">project.vercel.app</p>
</div>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90` |
| Secondary | `rounded-md border border-[#333] bg-black px-4 py-2 text-sm text-white hover:border-[#444]` |
| Ghost link | `text-[#0070f3] hover:underline` |

### Two-column grid

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  {items.map(...)}
</div>
```

Each cell is its own bordered box, not a `gap-px` mosaic unless every cell sets explicit `bg-black`.

---

## Grid patterns

### Bordered list stack

```tsx
<div className="border border-[#333] divide-y divide-[#333]">
  {rows.map(...)}
</div>
```

### Full-width tool card

```tsx
<a className="block border border-[#333] px-5 py-5 transition-colors hover:bg-[#111]">
  <p className="font-mono text-base text-white">Europe: Take-Home Pay Comparison</p>
  <p className="mt-1 text-sm text-[#888]">Calculate, visualize, and compare...</p>
</a>
```

---

## Charts (data viz)

Match the line-driven, monochrome tool aesthetic:

- Series in grayscale: `#fff`, `#888`, `#666`, `#333`. Add **one** accent only when a series must stand out - `#0070f3` (link blue) or `#50e3c2` (success).
- **Sharp bars** (`borderRadius: 0`) - same square geometry as the data tools. Flat fills, no gradients.
- Gridlines `#333`; axis text **mono** (`Geist Mono`), muted `#888`.
- Tooltip: `#111` background, white text, square or 6px corners.
- Bars/progress reuse the data-bar token: track `#333`, fill `#666` (or `#fff` for the active series).
- Doughnut: segments separated by a `#000` stroke; legend in mono uppercase.

```js
const FG="#fff", S2="#888", S3="#666", S4="#333", ACCENT="#0070f3", GRID="#333";
Chart.defaults.font.family = "Geist Mono, ui-monospace, monospace";
Chart.defaults.color = "#888";
// bars: backgroundColor:[S3, FG], borderRadius:0
// grid: { color: GRID }, border: { color: GRID }
// tooltip: { backgroundColor:"#111", cornerRadius:0 }
```

---

## Motion & effects

- No drop shadows, glass blur, gradient backgrounds, or glow halos.
- Hover: border lighten (`#333` to `#444`), subtle bg (`#111`), or text color shift.
- `transition-colors duration-150` on interactive elements.
- No scale/lift animations on cards.

---

## Mode selection

| Surface type | Font | Radius |
|--------------|------|--------|
| Data tools, tax calculators, index pages | Mono primary | Sharp (`0`) |
| Dashboard, blog, marketing docs | Sans primary, mono for metadata | Soft (`6-8px`) |

When unsure, default to mono + sharp for new tool UIs, and sans + `rounded-lg` for app shells and content pages.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| `rounded-xl`, `rounded-2xl`, `rounded-full` on data/tool UI | Breaks the utilitarian look |
| `shadow-lg`, `ring-*`, `backdrop-blur-*` | Depth replaces line hierarchy |
| Gradient backgrounds | Keep flat black / `#111` surfaces |
| Bright saturated fills on large areas | Reserve color for links and status |
| `gap-px` + `bg-border` without per-cell bg | Unintended gray gutters |
| Pill-shaped tabs on tool pages | Use rectangular bordered toggles |
| Light mode by default | The style is dark-first |
| Decorative hero imagery on a tool index | Text + bordered grid only |

---

## Project overrides

If the repo defines `.agents/styles/vercel-simple.md` or `.agents/styles/vercel-simple-theme.md`, prefer those tokens and components over this portable spec.
