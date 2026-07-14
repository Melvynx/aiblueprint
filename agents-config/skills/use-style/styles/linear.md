# Linear Style

Linear's app UI. Near-black canvas, dense aligned navigation, indigo accent, Inter Display headings. Quiet chrome, line-defined structure, content-first hierarchy.

**Reference vibe:** Linear desktop app (inbox, issue view, sidebar). See `linear.app/now/how-we-redesigned-the-linear-ui`.

---

## Core vibe

- **Product UI, not marketing.** This is an app shell aesthetic: sidebar, panes, lists, properties. Use it for dashboards and tools, not hero landing pages.
- **Quiet chrome.** Reduce visual noise. Navigation recedes; content leads. Neutral, timeless, minimal blue tint in the grays.
- **Line over depth.** 1px low-contrast borders separate panes. No shadows on structure (one soft shadow only on floating menus/popovers).
- **Dense and aligned.** Compact rows, tight vertical rhythm. Labels, icons, and buttons align both vertically and horizontally.
- **Indigo accent, used sparingly.** Linear's signature `#5e6ad2` for active state, links, focus. 90% of the UI stays neutral gray.
- **Inter Display for headings, Inter for body.** Display adds expressiveness on titles; regular Inter keeps prose readable.
- **Soft small radius.** `rounded-md` (6px) on rows, buttons, inputs. Never sharp `0`, never `rounded-xl+`.
- **Status by glyph.** Colored circle/icon glyphs carry meaning (todo, in-progress, done, urgent), not colored text or fills.

---

## Color

Portable palette. LCH-derived neutrals with a faint cool tint. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#08090a` | `--ln-bg` | App background, main pane |
| Surface | `#0f1011` | `--ln-surface` | Sidebar, secondary panes |
| Surface raised | `#1a1b1e` | `--ln-surface-raised` | Hover rows, selected items, inputs |
| Popover | `#1c1d1f` | `--ln-popover` | Floating menus, dropdowns, tooltips |
| Ink | `#f7f8f8` | `--ln-fg` | Headings, primary text, active labels |
| Muted ink | `#8a8f98` | `--ln-muted-fg` | Secondary text, inactive nav, metadata |
| Subtle ink | `#62666d` | `--ln-subtle-fg` | Timestamps, placeholders, faint labels |
| Border | `#1f2023` | `--ln-border` | Pane dividers, row separators |
| Border strong | `#2c2e33` | `--ln-border-strong` | Hover/active borders, input focus ring base |
| Accent | `#5e6ad2` | `--ln-accent` | Active state, links, selection, focus |
| Accent hover | `#6e79de` | `--ln-accent-hover` | Accent hover |
| Todo | `#e2a336` | `--ln-todo` | Yellow status glyph |
| In progress | `#f2994a` | `--ln-progress` | Orange status glyph (partial ring) |
| Done | `#5e6ad2` | `--ln-done` | Filled indigo check |
| Urgent | `#eb5757` | `--ln-urgent` | Red SLA / urgent glyph |
| Success | `#4cb782` | `--ln-success` | Positive state |

### Tailwind mapping (when no project tokens)

```css
:root {
  --ln-bg: #08090a;
  --ln-surface: #0f1011;
  --ln-surface-raised: #1a1b1e;
  --ln-fg: #f7f8f8;
  --ln-muted-fg: #8a8f98;
  --ln-border: #1f2023;
  --ln-accent: #5e6ad2;
}
```

| Tailwind | Value |
|----------|-------|
| `bg-[#08090a]` | Canvas |
| `bg-[#0f1011]` | Surface (sidebar) |
| `bg-[#1a1b1e]` | Hover / selected row |
| `text-[#f7f8f8]` | Primary |
| `text-[#8a8f98]` | Muted |
| `border-[#1f2023]` | Structure |
| `text-[#5e6ad2]` | Accent |

**Rule:** Keep the surface within a 2-3 step gray range. Accent and status colors are glyph-sized only - never large fills.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Display (headings) | `Inter Display, Inter, ui-sans-serif, system-ui, sans-serif` |
| Body / UI | `Inter, ui-sans-serif, system-ui, sans-serif` |
| Mono (IDs, code) | `Berkeley Mono, ui-monospace, SFMono-Regular, Menlo, monospace` |

Load Inter via `@fontsource/inter` or `next/font`. Inter Display is the optical "display" cut for large sizes; fall back to Inter if unavailable.

### Scale

| Level | Font | Pattern |
|-------|------|---------|
| Issue / page title | Display | `text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-[#f7f8f8]` |
| Pane heading (Inbox) | Display | `text-base font-semibold text-[#f7f8f8]` |
| Section label | Body | `text-xs font-medium text-[#8a8f98]` (e.g. Workspace, Favorites) |
| Row title | Body | `text-sm font-medium text-[#f7f8f8]` |
| Row subtitle / meta | Body | `text-[13px] text-[#8a8f98]` |
| Body prose | Body | `text-sm md:text-[15px] leading-relaxed text-[#d0d2d6]` |
| Timestamp / ID | Body or Mono | `text-xs text-[#62666d]` |

### Section labels

Small, medium weight, muted. NOT uppercase, NOT letter-spaced (unlike Vercel style). Examples: `Workspace`, `Favorites`, `Your teams`, `Properties`, `Labels`.

```tsx
<p className="px-2 text-xs font-medium text-[#8a8f98]">Workspace</p>
```

---

## Layout tokens

| Token | Value |
|-------|-------|
| `LN_SIDEBAR` | `w-56 shrink-0 bg-[#0f1011] border-r border-[#1f2023]` |
| `LN_LIST` | `w-[360px] shrink-0 border-r border-[#1f2023]` |
| `LN_MAIN` | `flex-1 min-w-0` |
| `LN_PROPS` | `w-64 shrink-0 border-l border-[#1f2023] p-4` |
| `LN_ROW` | `flex items-center gap-2.5 rounded-md px-2 py-1.5` |
| `LN_CONTENT` | `mx-auto w-full max-w-3xl px-6 md:px-10 py-8` |

### App shell (Linear's core layout)

Two or three panes: sidebar + (list) + main, optional right properties rail.

```
+--------+------------------+---------------------------+--------+
| side   |  list / inbox    |  main (issue / content)   | props  |
| bar    |  rows w/ glyphs  |  title + body + activity  | rail   |
| w-56   |  w-[360px]       |  flex-1                   | w-64   |
+--------+------------------+---------------------------+--------+
```

```tsx
<div className="flex h-screen bg-[#08090a] text-[#f7f8f8]">
  <aside className="w-56 shrink-0 border-r border-[#1f2023] bg-[#0f1011] p-2">...</aside>
  <section className="w-[360px] shrink-0 border-r border-[#1f2023]">...</section>
  <main className="flex-1 min-w-0">...</main>
  <aside className="w-64 shrink-0 border-l border-[#1f2023] p-4">...</aside>
</div>
```

### Breadcrumb header

Top of the main pane. Icon + segment, `/` or `chevron` between, muted until the leaf.

```tsx
<header className="flex items-center gap-1.5 border-b border-[#1f2023] px-4 py-2.5 text-sm">
  <span className="text-[#8a8f98]">Product</span>
  <span className="text-[#62666d]">/</span>
  <span className="text-[#8a8f98]">Insights</span>
  <span className="text-[#62666d]">/</span>
  <span className="text-[#f7f8f8]">LIN-1305</span>
</header>
```

---

## Borders & radius

| Context | Radius | Border |
|---------|--------|--------|
| Panes (sidebar, list, rail) | n/a | `border-[#1f2023]` dividers only |
| Sidebar / list rows | `rounded-md` (6px) | none; selection = `bg-[#1a1b1e]` |
| Buttons, badges, inputs | `rounded-md` (6px) | `border-[#1f2023]` or borderless |
| Avatars, status icons | `rounded-full` | none |
| Popovers / menus | `rounded-lg` (8px) | `border-[#2c2e33]` + soft shadow |

Dividers: `border-b border-[#1f2023]`, full width inside the pane. Rows are separated by selection bg, not by per-row borders.

---

## Component patterns

### Sidebar nav item

Icon + label. Inactive muted, active = raised bg + white text. No left accent bar.

```tsx
<a className={cn(
  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
  active ? "bg-[#1a1b1e] text-[#f7f8f8]" : "text-[#8a8f98] hover:bg-[#1a1b1e] hover:text-[#f7f8f8]"
)}>
  <Icon className="size-4 shrink-0" />
  <span className="truncate">Inbox</span>
</a>
```

### Status glyph

Colored ring/circle, no fill text. The glyph is the only color in the row.

```tsx
// Todo: hollow yellow circle · In progress: partial orange ring · Done: filled indigo check · Urgent: red square
<span className="grid size-4 place-items-center rounded-full border-2 border-[#e2a336]" />
<CheckCircle className="size-4 text-[#5e6ad2]" />
```

### Inbox / list row

Avatar or glyph left, two-line title + subtitle, status + timestamp right. Selected row gets raised bg.

```tsx
<a className={cn(
  "flex items-center gap-3 rounded-md px-3 py-2.5",
  selected ? "bg-[#1a1b1e]" : "hover:bg-[#1a1b1e]/60"
)}>
  <img className="size-7 shrink-0 rounded-full" src={avatar} />
  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-medium text-[#f7f8f8]">LIN-13055 Add source to insights</p>
    <p className="truncate text-[13px] text-[#8a8f98]">nan mentioned you</p>
  </div>
  <div className="flex items-center gap-2 text-xs text-[#62666d]">
    <StatusGlyph />
    <span>2d</span>
  </div>
</a>
```

### Issue title block

Display heading + sub-issue context line.

```tsx
<div className="mb-6">
  <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[#f7f8f8] md:text-3xl">Update copy</h1>
  <p className="mt-2 flex items-center gap-1.5 text-sm text-[#8a8f98]">
    Sub-issue of <CheckCircle className="size-3.5 text-[#5e6ad2]" />
    <span className="text-[#f7f8f8]">LIN-19734 Update welcome and log in screens</span>
  </p>
</div>
```

### Properties rail row

Label-less stacked rows or icon + value. Muted label, white value, click to edit.

```tsx
<div className="space-y-1">
  <p className="text-xs font-medium text-[#8a8f98]">Properties</p>
  <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#f7f8f8] hover:bg-[#1a1b1e]">
    <CheckCircle className="size-4 text-[#5e6ad2]" /> Done
  </button>
  <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#8a8f98] hover:bg-[#1a1b1e]">
    <CircleDashed className="size-4" /> Set priority
  </button>
</div>
```

### Label / badge chip

Small, muted, dot or icon + text. `rounded-md`, faint border or transparent.

```tsx
<span className="inline-flex items-center gap-1.5 rounded-md border border-[#1f2023] px-2 py-0.5 text-xs text-[#8a8f98]">
  <span className="size-2 rounded-full bg-[#5e6ad2]" /> UI Refresh
</span>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `rounded-md bg-[#5e6ad2] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#6e79de]` |
| Secondary | `rounded-md border border-[#2c2e33] bg-transparent px-3 py-1.5 text-sm text-[#f7f8f8] hover:bg-[#1a1b1e]` |
| Ghost / toolbar | `rounded-md px-2 py-1.5 text-sm text-[#8a8f98] hover:bg-[#1a1b1e] hover:text-[#f7f8f8]` |
| Link | `text-[#5e6ad2] hover:underline` |

### Input

```tsx
<input
  className="w-full rounded-md border border-[#1f2023] bg-[#1a1b1e] px-3 py-1.5 text-sm text-[#f7f8f8] placeholder:text-[#62666d] focus:border-[#5e6ad2] focus:outline-none"
  placeholder="Add description..."
/>
```

### Popover / command menu

Floating surface gets the one allowed shadow.

```tsx
<div className="rounded-lg border border-[#2c2e33] bg-[#1c1d1f] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
  {items.map(...)}
</div>
```

### Avatar

```tsx
<img className="size-6 rounded-full ring-1 ring-[#1f2023]" src={src} />
// stacked: -ml-1.5 ring-2 ring-[#08090a]
```

---

## Charts (app data viz)

Dashboards and insights panes use charts that stay as quiet as the rest of the chrome:

- Series in the neutral grays: `#8a8f98`, `#62666d`, `#2c2e33`, with **one** indigo accent `#5e6ad2` for the highlighted/primary series. Status colors (`#e2a336`, `#f2994a`, `#eb5757`, `#4cb782`) only when the chart literally encodes those states.
- **Small-radius bars** (`borderRadius: 4`), flat fills. No gradients, no glow.
- Background = pane surface (`#08090a` / `#0f1011`); gridlines `#1f2023`; axis text `Inter`, muted `#8a8f98`.
- Tooltip: popover surface `#1c1d1f`, border `#2c2e33`, ink `#f7f8f8`, `8px` corners, the one allowed soft shadow.
- Keep legends and labels in `Inter` sentence-case (not uppercase), matching section labels.

```js
const ACCENT="#5e6ad2", S2="#8a8f98", S3="#62666d", S4="#2c2e33", GRID="#1f2023";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.color = "#8a8f98";
// bars: backgroundColor:[S3, ACCENT], borderRadius:4
// grid: { color: GRID }
// tooltip: { backgroundColor:"#1c1d1f", borderColor:"#2c2e33", borderWidth:1, cornerRadius:8 }
```

---

## Motion & effects

- **Quiet.** Transitions are fast and subtle: `transition-colors duration-100`.
- Hover = bg shift to `#1a1b1e` and/or text muted to white. No scale, no lift on rows.
- One soft shadow allowed: floating menus/popovers only (`0 8px 24px rgba(0,0,0,.5)`).
- Focus ring uses accent: `focus:border-[#5e6ad2]` or `focus-visible:ring-1 ring-[#5e6ad2]`.
- No gradients, no glow, no glass blur on structure.

---

## When to use

| Surface | Fit |
|---------|-----|
| Issue tracker, inbox, dashboard, settings, admin panel | Strong fit |
| Tool with sidebar + list + detail panes | Strong fit |
| Marketing landing / hero page | Poor fit - use `grid` or `vercel` |
| Data calculator / index of tools | Use `black-grid` (mono + sharp) |

Linear style is for **product app shells**. If the request is a marketing page, redirect to another style.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Sharp `rounded-none` rows/buttons | Linear is soft 6px, not Vercel-sharp |
| `rounded-xl`, `rounded-2xl`, pills on rows | Too soft; breaks the dense app feel |
| Uppercase letter-spaced section labels | Linear labels are sentence-case, medium weight |
| Large accent or status color fills | Color lives in glyphs and active state only |
| Shadows on cards, panes, rows | Structure is line-defined; shadow is popover-only |
| Per-row 1px borders in lists | Use selection bg + spacing, not borders |
| High-contrast pure `#000` / `#fff` | Use `#08090a` canvas and `#f7f8f8` ink |
| Monospace as the primary UI font | Inter is primary; mono only for IDs/code |
| Gradient or photographic backgrounds | Keep flat neutral surfaces |

---

## Project overrides

If the repo defines `.agents/styles/linear.md` or `.agents/styles/linear-theme.md`, prefer those tokens and components over this portable spec.
