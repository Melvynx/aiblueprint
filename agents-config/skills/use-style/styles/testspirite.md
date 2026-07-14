# TestSpirite Style

Calm light SaaS product UI. Warm paper-white canvas, one forest-green accent, grouped sidebar, soft rounded cards on quiet borders, pale-green status pills, and isometric line-art empty states. Trust-driven dev tooling, never loud.

**Reference vibe:** TestSprite app shell (home dashboard, sidebar nav, test lists, monitoring, plan/billing, changelog rail).

---

## Core vibe

- **Product UI, not marketing.** App shell aesthetic: grouped sidebar + content + promo rail. Use it for dashboards, settings, and tool surfaces, not splashy hero landings.
- **Warm paper light mode.** Faint sage-tinted off-white canvas, white cards, near-black warm ink. Light, airy, never stark white-on-white.
- **One green, used calmly.** A single forest green `#3d7c4e` carries every action, active state, and positive status. 90% of the UI stays neutral gray; green is the only saturated color.
- **Line over depth.** 1px low-contrast borders define cards and panes. At most one barely-there ambient shadow on raised cards. No heavy elevation.
- **Soft, generous radius.** `rounded-xl` (12px) cards, `rounded-lg` (8px) buttons/inputs, `rounded-full` pills and avatars. Never sharp `0`.
- **Pale-green pills everywhere.** Feature checkmarks, `New` tags, `New Feature` changelog labels, status dots: tinted green text on a pale green wash.
- **Isometric wireframe empty states.** Light gray line-art stacked cubes / layered chevrons (echoing the TestSprite mark) sit centered above an empty-state CTA.
- **Conversion woven in.** Free-trial and upgrade promo cards live inside the shell (sidebar foot, right rail, section banners), not bolted on.
- **Clean Inter sans.** Inter / system grotesque for everything; `tabular-nums` for credits, counts, and dates. Mono only for IDs/keys.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#f7f7f3` | `--ts-bg` | Page + sidebar background (warm sage-white) |
| Surface | `#ffffff` | `--ts-surface` | Cards, panels, promo rail, inputs |
| Surface sunken | `#f0f1ec` | `--ts-sunken` | Hover rows, inset blocks, table headers |
| Ink | `#1a1c19` | `--ts-fg` | Headings, primary values, active nav |
| Slate ink | `#494c46` | `--ts-slate` | Body copy, descriptions |
| Muted ink | `#8a8d84` | `--ts-muted-fg` | Section labels, metadata, inactive nav |
| Subtle ink | `#a8aaa0` | `--ts-subtle-fg` | Placeholders, helper text, faint icons |
| Border | `#e8e9e3` | `--ts-border` | Card outlines, dividers, row separators |
| Border strong | `#d8dad2` | `--ts-border-strong` | Hover/focus outlines |
| Primary | `#3d7c4e` | `--ts-primary` | Buttons, active state, links, focus ring |
| Primary hover | `#336b42` | `--ts-primary-hover` | Button / link hover |
| Primary surface | `#eaf3ea` | `--ts-primary-surface` | Pill / badge / promo-card wash, active row tint |
| Primary border | `#d3e6d5` | `--ts-primary-border` | Outline on pale-green surfaces |
| Status dot | `#2f9e54` | `--ts-status` | Brighter green for live/connected dots |
| Warning | `#c98a28` | `--ts-warning` | Pending, attention, low-credit |
| Error | `#cf4a3e` | `--ts-error` | Failed runs, destructive |
| Link | `#3d7c4e` | `--ts-link` | Text links |

### Tailwind mapping (when no project tokens)

```css
:root {
  --ts-bg: #f7f7f3;
  --ts-surface: #fff;
  --ts-sunken: #f0f1ec;
  --ts-fg: #1a1c19;
  --ts-slate: #494c46;
  --ts-muted-fg: #8a8d84;
  --ts-border: #e8e9e3;
  --ts-primary: #3d7c4e;
  --ts-primary-surface: #eaf3ea;
}
```

| Tailwind | Value |
|----------|-------|
| `bg-[#f7f7f3]` | Canvas / sidebar |
| `bg-white` | Card / surface |
| `bg-[#f0f1ec]` | Hover / sunken |
| `text-[#1a1c19]` | Primary ink |
| `text-[#8a8d84]` | Muted |
| `border-[#e8e9e3]` | Structure |
| `bg-[#3d7c4e]` | Primary action |
| `bg-[#eaf3ea]` | Green pill / promo wash |
| `text-[#3d7c4e]` | Accent / link |

**Rule:** Keep the layout neutral warm-gray and reserve forest green for actions, active state, and positive status. One green only; no second accent hue.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (everything) | `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` |
| Mono (keys, IDs) | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |

Load Inter via `@fontsource/inter` or `next/font`. No display/serif face: TestSpirite is sans-only.

### Scale

| Level | Pattern |
|-------|---------|
| Page title | `text-xl md:text-2xl font-semibold tracking-tight text-[#1a1c19]` |
| Card / promo heading | `text-lg md:text-xl font-semibold text-[#1a1c19]` |
| Section heading (Recent Created Tests) | `text-sm font-semibold text-[#1a1c19]` |
| Sidebar section label | `text-[11px] font-medium uppercase tracking-wide text-[#8a8d84]` |
| Nav item | `text-sm text-[#494c46]` |
| Body / description | `text-sm leading-relaxed text-[#494c46]` |
| Metadata / date | `text-xs tabular-nums text-[#8a8d84]` |
| Metric / credits | `text-sm font-medium tabular-nums text-[#1a1c19]` |
| Key / ID | `font-mono text-xs text-[#494c46]` |

### Weight & tracking

- Headings: `font-semibold` (600), `tracking-tight`.
- Body: `font-normal` (400), relaxed leading.
- Sidebar section labels: `font-medium` (500), `uppercase`, light tracking, muted. (This is the one uppercase label in the system.)
- Nav items + most labels: sentence case.
- Counts, credits, dates: always `tabular-nums`.

---

## Layout tokens

| Token | Value |
|-------|-------|
| `TS_SIDEBAR` | `w-60 shrink-0 border-r border-[#e8e9e3] bg-[#f7f7f3] flex flex-col` |
| `TS_MAIN` | `flex-1 min-w-0 bg-[#f7f7f3]` |
| `TS_TOPBAR` | `flex h-14 items-center border-b border-[#e8e9e3] px-6` |
| `TS_CONTENT` | `mx-auto w-full max-w-6xl px-6 py-6 md:py-8` |
| `TS_RAIL` | `w-80 shrink-0 space-y-4` (right promo/plan/changelog rail) |
| `TS_CARD` | `rounded-xl border border-[#e8e9e3] bg-white p-5` |
| `TS_ROW` | `flex items-center gap-2.5 rounded-lg px-2.5 py-2` |
| `TS_GAP` | `space-y-6 md:space-y-8` |

### App shell (TestSpirite's core layout)

Grouped sidebar + main column; main splits into a content stream and a right promo rail.

```
+--------+--------------------------------+-----------------+
| side   |  topbar (page title)           |                 |
| bar    +--------------------------------+                 |
| groups |  hero / section cards          |  promo rail     |
| + foot |  (recent tests, lists, ...)    |  plan, updates  |
| w-60   |  max-w-6xl                     |  w-80           |
+--------+--------------------------------+-----------------+
```

```tsx
<div className="flex min-h-screen bg-[#f7f7f3] text-[#1a1c19]">
  <aside className="flex w-60 shrink-0 flex-col border-r border-[#e8e9e3] bg-[#f7f7f3]">
    <WorkspaceSwitcher />
    <nav className="flex-1 space-y-5 px-3 py-4">{groups}</nav>
    <TrialCard />            {/* sidebar foot */}
  </aside>
  <div className="flex flex-1 flex-col">
    <header className="flex h-14 items-center border-b border-[#e8e9e3] px-6 text-sm text-[#494c46]">Home</header>
    <main className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-8">
      <div className="min-w-0 flex-1 space-y-8">{content}</div>
      <aside className="w-80 shrink-0 space-y-4">{rail}</aside>
    </main>
  </div>
</div>
```

### Workspace switcher (sidebar head)

```tsx
<button className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-[#f0f1ec]">
  <span className="grid size-7 place-items-center rounded-md bg-[#3d7c4e] text-xs font-semibold text-white">MW</span>
  <span className="flex-1 truncate font-medium text-[#1a1c19]">My Workspace</span>
  <ChevronsUpDown className="size-4 text-[#8a8d84]" />
</button>
```

---

## Borders, radius & elevation

Line-defined and soft. Cards are bordered; one faint ambient shadow at most.

| Context | Radius | Border | Shadow |
|---------|--------|--------|--------|
| Card / panel / promo | `rounded-xl` (12px) | `border-[#e8e9e3]` | none, or `TS_SHADOW_CARD` |
| Hero / billboard card | `rounded-2xl` (16px) | `border-[#e8e9e3]` | `TS_SHADOW_CARD` |
| Button | `rounded-lg` (8px) | none (primary) / `border-[#e8e9e3]` (secondary) | none |
| Input | `rounded-lg` (8px) | `border-[#e8e9e3]` | none |
| Nav row / list row | `rounded-lg` (8px) | none; active = `bg-[#f0f1ec]` | none |
| Pill / badge / avatar | `rounded-full` | optional `border-[#d3e6d5]` | none |
| Workspace logo mark | `rounded-md` (6px) | none | none |

### Shadow token (the one soft ambient lift)

```css
--ts-shadow-card: 0 1px 2px rgba(26,28,25,0.04), 0 1px 3px rgba(26,28,25,0.03);
```

```tsx
className="shadow-[0_1px_2px_rgba(26,28,25,0.04),0_1px_3px_rgba(26,28,25,0.03)]"
```

Dividers: `border-t border-[#e8e9e3]`. Rows separate by spacing + hover bg, not per-row borders.

---

## Component patterns

### Sidebar nav group

Tiny muted uppercase label, then icon + label rows. Active row = sunken bg + ink text. No left accent bar.

```tsx
<div>
  <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#8a8d84]">Testing</p>
  <a className={cn(
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
    active ? "bg-[#f0f1ec] font-medium text-[#1a1c19]" : "text-[#494c46] hover:bg-[#f0f1ec]"
  )}>
    <FlaskConical className="size-4 shrink-0 text-[#8a8d84]" />
    <span className="flex-1 truncate">Create Tests</span>
    <NewBadge />
  </a>
</div>
```

### `New` badge / `New Feature` tag

The signature pale-green pill.

```tsx
<span className="rounded-full bg-[#eaf3ea] px-2 py-0.5 text-[11px] font-medium text-[#3d7c4e]">New</span>
```

### Feature pill with checkmark (promo cards)

```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ea] px-2.5 py-1 text-xs font-medium text-[#3d7c4e]">
  <Check className="size-3.5" /> Better Coverage
</span>
```

### Status pill (live / connected)

```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ea] px-2.5 py-0.5 text-xs font-medium text-[#3d7c4e]">
  <span className="size-1.5 rounded-full bg-[#2f9e54]" /> Connected
</span>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `rounded-lg bg-[#3d7c4e] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#336b42]` |
| Secondary | `rounded-lg border border-[#e8e9e3] bg-white px-4 py-2 text-sm font-medium text-[#1a1c19] transition-colors hover:bg-[#f0f1ec]` |
| Ghost / icon | `rounded-lg p-2 text-[#8a8d84] transition-colors hover:bg-[#f0f1ec] hover:text-[#1a1c19]` |
| Link | `text-sm font-medium text-[#3d7c4e] hover:text-[#336b42]` |

### Input

```tsx
<input
  className="w-full rounded-lg border border-[#e8e9e3] bg-white px-3 py-2 text-sm text-[#1a1c19] placeholder:text-[#a8aaa0] transition-shadow focus:border-[#3d7c4e] focus:shadow-[0_0_0_3px_rgba(61,124,78,0.15)] focus:outline-none"
  placeholder="Search tests..."
/>
```

### Card

```tsx
<div className="rounded-xl border border-[#e8e9e3] bg-white p-5">...</div>
```

### Section header (with action)

```tsx
<div className="flex items-center justify-between">
  <h2 className="text-sm font-semibold text-[#1a1c19]">Recent Created Tests</h2>
  <div className="flex items-center gap-2">
    <button className="rounded-lg border border-[#e8e9e3] bg-white px-2.5 py-1.5 text-xs text-[#494c46] hover:bg-[#f0f1ec]">Last 7 Days ▾</button>
    <button className="rounded-lg border border-[#e8e9e3] bg-white p-1.5 text-[#8a8d84] hover:bg-[#f0f1ec]"><Plus className="size-4" /></button>
  </div>
</div>
```

### Empty state (signature)

Isometric line-art mark, centered, muted, above a label + primary CTA. Draw the mark as stacked/offset wireframe cubes or layered chevrons in `--ts-subtle-fg` strokes (no fill).

```tsx
<div className="flex flex-col items-center gap-4 rounded-xl border border-[#e8e9e3] bg-white py-16">
  <IsometricStackMark className="size-16 text-[#cfd1c8]" />   {/* line-art, stroke only */}
  <p className="text-sm text-[#8a8d84]">No tests</p>
  <button className="rounded-lg border border-[#e8e9e3] bg-white px-3.5 py-2 text-sm font-medium text-[#1a1c19] hover:bg-[#f0f1ec]">
    <Plus className="mr-1.5 inline size-4" /> Create Tests
  </button>
</div>
```

### Promo / trial card (sidebar foot or rail)

Pale-green wash, sparkle glyph, headline, sub, feature pills, full-width primary CTA.

```tsx
<div className="rounded-xl border border-[#d3e6d5] bg-[#eaf3ea] p-4">
  <p className="flex items-center gap-1.5 text-sm font-semibold text-[#1a1c19]"><Sparkles className="size-4 text-[#3d7c4e]" /> 1 Month Free Trial</p>
  <p className="mt-1 text-xs text-[#494c46]">Unlock all features free for 1 month.</p>
  <div className="mt-3 flex flex-wrap gap-1.5">{featurePills}</div>
  <button className="mt-3 w-full rounded-lg bg-[#3d7c4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#336b42]">Try For Free</button>
</div>
```

### Plan / credits block (rail)

```tsx
<div className="rounded-xl border border-[#e8e9e3] bg-white p-4">
  <div className="flex items-center justify-between">
    <p className="text-sm font-semibold text-[#1a1c19]">My Plan</p>
    <button className="text-xs font-medium text-[#3d7c4e]">Manage Plan</button>
  </div>
  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f0f1ec]">
    <div className="h-full rounded-full bg-[#3d7c4e]" style={{width:"30%"}} />
  </div>
  <p className="mt-2 flex items-center justify-between text-xs text-[#494c46]">
    <span>Free</span><span className="tabular-nums"><b className="text-[#1a1c19]">150</b> Credits Remaining</span>
  </p>
</div>
```

### Changelog rail item

```tsx
<div className="border-t border-[#e8e9e3] py-3 first:border-0">
  <span className="rounded-full bg-[#eaf3ea] px-2 py-0.5 text-[11px] font-medium text-[#3d7c4e]">New Feature</span>
  <p className="mt-2 text-sm font-medium text-[#1a1c19]">GitHub Integration</p>
  <p className="mt-1 text-xs leading-relaxed text-[#494c46]">Connect your repositories to streamline testing.</p>
  <p className="mt-2 text-xs tabular-nums text-[#a8aaa0]">Feb 17, 2026</p>
</div>
```

---

## Charts (light app data viz)

Quiet, green-led, on white panels:

- Primary series in forest green `#3d7c4e`; supporting series fade through a green ramp `#6fa67d → #a9cdb1 → #d3e6d5`. Status colors (`#c98a28`, `#cf4a3e`) only when the chart literally encodes pass/fail.
- **Rounded bars** (`borderRadius: 6`), flat fills. No gradients, no glow.
- Background = white card; gridlines `#e8e9e3`; axis text Inter, muted `#8a8d84`, `tabular-nums`.
- Tooltip: white bg, `#e8e9e3` border, ink `#1a1c19`, `8px` corners, the one soft card shadow.

```js
const PRIMARY="#3d7c4e", S2="#6fa67d", S3="#a9cdb1", S4="#d3e6d5", GRID="#e8e9e3";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.color = "#8a8d84";
// bars: backgroundColor:[S3, PRIMARY], borderRadius:6
// grid: { color: GRID }
// tooltip: { backgroundColor:"#fff", borderColor:"#e8e9e3", borderWidth:1, titleColor:"#1a1c19", bodyColor:"#494c46", cornerRadius:8 }
```

---

## Motion & effects

- **Calm.** `transition-colors duration-150` on interactive elements; `transition-shadow` on inputs.
- Hover = bg shift to `#f0f1ec` on rows/secondary buttons, darker fill `#336b42` on primary. No scale, no lift on rows.
- Focus: soft 3px green ring `rgba(61,124,78,0.15)` + green border on inputs. Always visible.
- At most one faint ambient card shadow; no neon glow (raycast), no hard offset (gumroad), no glass blur.
- Empty-state marks may fade/slide in gently; no bounce.

---

## When to use

| Surface | Fit |
|---------|-----|
| Dev-tool dashboard, test runner, monitoring, settings, plan/billing | Strong fit |
| App shell with grouped sidebar + content + promo rail | Strong fit |
| Onboarding / empty states with illustrated CTAs | Strong fit |
| Marketing hero / landing page | Poor fit - use `grid`, `vercel`, or `raycast` |
| Dense issue-tracker triage (3-pane) | Use `linear` |

TestSpirite is for **calm light-mode product app shells**. If the request is a marketing page, redirect to another style.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Pure cool `#fff` / `#f9fafb` gray canvas | Use the warm sage-white `#f7f7f3`; the warmth is the signature |
| A second accent hue (blue, purple, etc.) | TestSpirite is one green only; color lives in green + status |
| Sharp `rounded-none` cards/buttons | The look is soft 8-16px radius, never blueprint-square |
| Heavy `shadow-lg`/`shadow-2xl` elevation | Structure is line-defined; at most one faint ambient shadow |
| Large green fills / green backgrounds | Reserve green for actions, active state, pills, and the pale promo wash |
| Filled or photographic empty-state art | Empty states are light gray isometric line-art (stroke only) |
| Uppercase letter-spaced labels everywhere | Only the sidebar section labels are uppercase; everything else is sentence case |
| Dark mode by default | TestSpirite is a light, warm, paper surface |
| Mono for body text | Inter sans for prose; mono only for keys/IDs |

---

## Project overrides

If the repo defines `.agents/styles/testspirite.md` or `.agents/styles/testspirite-theme.md`, prefer those tokens and components over this portable spec.
