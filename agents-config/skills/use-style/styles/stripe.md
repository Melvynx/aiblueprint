# Stripe Style

Clean fintech product UI. Light, airy, trust-driven. Soft elevation over hard lines, blurple accent, rounded geometry.

**Reference vibe:** Stripe Dashboard, Checkout, and docs. App panels, settings pages, payment forms.

---

## Core vibe

- **Trust-first fintech.** Polished, premium, calm. Feels like money software, not a marketing funnel.
- **Light canvas.** Off-white / pale blue background, white cards, dark navy ink.
- **Soft elevation.** Subtle layered shadows define cards, NOT 1px borders. This is the key contrast with `grid` / `black-grid`.
- **Rounded geometry.** `8px` cards, `6px` inputs/buttons, `radius-full` pills and avatars.
- **Blurple accent.** `#635BFF` for primary actions, active states, links. Green (`#24B47E`) for success/confirm CTAs.
- **Sans everywhere.** Clean grotesk (Inter / system / sohne). Mono only for card numbers, IDs, code.
- **Generous whitespace.** Wide gutters, airy row padding, breathing room around values.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#F6F9FC` | `--sp-bg` | Page background (pale blue-gray) |
| Surface | `#FFFFFF` | `--sp-surface` | Cards, panels, inputs |
| Surface sunken | `#F7FAFC` | `--sp-sunken` | Inset blocks, table headers, hover rows |
| Ink | `#0A2540` | `--sp-fg` | Headlines, primary values |
| Slate ink | `#425466` | `--sp-slate` | Body copy, descriptions |
| Muted ink | `#697386` | `--sp-muted-fg` | Metadata, labels, inactive tabs |
| Subtle ink | `#8792A2` | `--sp-subtle-fg` | Placeholders, helper text |
| Border | `#E3E8EE` | `--sp-border` | Input outlines, dividers, table lines |
| Border strong | `#CFD7DF` | `--sp-border-strong` | Hover/focus outlines |
| Primary | `#635BFF` | `--sp-primary` | Buttons, active tab, links, focus ring |
| Primary hover | `#5249E0` | `--sp-primary-hover` | Button hover |
| Primary surface | `#F5F4FF` | `--sp-primary-surface` | Active row / selected card tint |
| Success | `#24B47E` | `--sp-success` | Confirm CTA, connected status, paid |
| Warning | `#D97917` | `--sp-warning` | Pending, attention |
| Error | `#DF1B41` | `--sp-error` | Failed, destructive |
| Link | `#635BFF` | `--sp-link` | Text links |

### Dark variant (Checkout dark, dashboards)

| Role | Hex |
|------|-----|
| Canvas | `#0A2540` |
| Surface | `#1A2B45` / `#15233B` |
| Ink | `#FFFFFF` |
| Muted ink | `#A3ACBA` |
| Border | `#2A3A55` |
| Primary CTA | `#24B47E` (green) or `#635BFF` |

### Tailwind mapping (when no project tokens)

```css
:root {
  --sp-bg: #f6f9fc;
  --sp-surface: #fff;
  --sp-fg: #0a2540;
  --sp-slate: #425466;
  --sp-muted-fg: #697386;
  --sp-border: #e3e8ee;
  --sp-primary: #635bff;
  --sp-success: #24b47e;
}
```

| Tailwind | Value |
|----------|-------|
| `bg-[#f6f9fc]` | Canvas |
| `bg-white` | Card / surface |
| `text-[#0a2540]` | Primary ink |
| `text-[#697386]` | Muted |
| `border-[#e3e8ee]` | Structure |
| `bg-[#635bff]` | Primary action |
| `bg-[#24b47e]` | Success CTA |

**Rule:** Keep the layout neutral (navy/slate/gray) and reserve saturated color for actions, active state, and status. Blurple is the signature; use it deliberately, not everywhere.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (everything) | `Inter, "Sohne", ui-sans-serif, system-ui, -apple-system, sans-serif` |
| Mono (card #, IDs, code) | `"Berkeley Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |

Load Inter via `@fontsource/inter` or `next/font`. Stripe's own face is "sohne"; Inter is the closest free substitute.

### Scale

| Level | Pattern |
|-------|---------|
| Page title | `text-2xl md:text-3xl font-semibold tracking-tight text-[#0a2540]` |
| Section heading | `text-lg md:text-xl font-semibold text-[#0a2540]` |
| Section label | `text-xs font-medium uppercase tracking-wide text-[#697386]` |
| Body | `text-sm md:text-base leading-relaxed text-[#425466]` |
| Large metric | `text-3xl md:text-4xl font-semibold tabular-nums text-[#0a2540]` |
| Metadata | `text-xs text-[#697386]` |
| Card number / ID | `font-mono text-sm tabular-nums text-[#0a2540]` |

### Weight & tracking

- Headlines: `font-semibold` (600), `tracking-tight`.
- Body: `font-normal` (400), normal tracking, relaxed leading.
- Labels: `font-medium` (500), light uppercase tracking.
- Numbers: always `tabular-nums`.

---

## Layout tokens

| Token | Value |
|-------|-------|
| `SP_SHELL` | `mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8` |
| `SP_SHELL_NARROW` | `max-w-3xl` (settings, forms) |
| `SP_SECTION` | `py-10 md:py-14 lg:py-16` |
| `SP_CARD_PAD` | `p-5 sm:p-6 md:p-8` |
| `SP_GAP_SECTION` | `space-y-8 md:space-y-10` |

### App shell (dashboard)

Top nav + horizontal tab bar + content on pale canvas. Optional right-rail app dock.

```tsx
<div className="min-h-screen bg-[#f6f9fc] text-[#0a2540]">
  <header className="border-b border-[#e3e8ee] bg-white">
    <div className={cn(SP_SHELL, "flex h-16 items-center justify-between")}>...</div>
    <nav className={cn(SP_SHELL, "flex gap-1")}>{tabs}</nav>
  </header>
  <main className={cn(SP_SHELL, "py-8")}>...</main>
</div>
```

### Settings / form shell (narrow)

```tsx
<main className={cn(SP_SHELL_NARROW, "py-12")}>
  <nav className="mb-6 text-sm text-[#697386]">Settings › Authorized apps › <span className="text-[#635bff]">SuperTodo</span></nav>
  <h1 className="text-3xl font-semibold tracking-tight">...</h1>
  <div className="mt-8 space-y-8">{rows}</div>
</main>
```

---

## Borders, radius & elevation

This is where Stripe diverges from the line-driven styles. **Cards float on soft shadows; borders are thin and quiet.**

| Context | Radius | Border | Shadow |
|---------|--------|--------|--------|
| Card / panel | `rounded-lg` (8px) | none or `border-[#e3e8ee]` | `SP_SHADOW_CARD` |
| Floating panel (app dock, popover) | `rounded-xl` (12px) | none | `SP_SHADOW_FLOAT` |
| Input | `rounded-md` (6px) | `border-[#e3e8ee]` | `SP_SHADOW_INPUT` (inset-ish) |
| Button | `rounded-md` (6px) | none | `SP_SHADOW_BTN` |
| Tab / segmented item | `rounded-md` (6px) | none | none until active |
| Pill / badge / avatar | `rounded-full` | optional | none |

### Shadow tokens (Stripe's signature soft elevation)

```css
--sp-shadow-card:  0 1px 3px rgba(50,50,93,0.10), 0 1px 2px rgba(0,0,0,0.06);
--sp-shadow-float: 0 7px 14px rgba(50,50,93,0.10), 0 3px 6px rgba(0,0,0,0.08);
--sp-shadow-input: 0 1px 1px rgba(0,0,0,0.03);
--sp-shadow-btn:   0 1px 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08);
--sp-focus-ring:   0 0 0 3px rgba(99,91,255,0.25);
```

Tailwind arbitrary equivalents:

```tsx
// card
className="shadow-[0_1px_3px_rgba(50,50,93,0.10),0_1px_2px_rgba(0,0,0,0.06)]"
// floating panel
className="shadow-[0_7px_14px_rgba(50,50,93,0.10),0_3px_6px_rgba(0,0,0,0.08)]"
// focus
className="focus:shadow-[0_0_0_3px_rgba(99,91,255,0.25)]"
```

Dividers: `border-t border-[#e3e8ee]`.

---

## Component patterns

### Primary button (blurple)

```tsx
<button className="rounded-md bg-[#635bff] px-4 py-2.5 text-sm font-medium text-white shadow-[0_1px_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#5249e0]">
  Save changes
</button>
```

### Success CTA (green pay button)

```tsx
<button className="w-full rounded-md bg-[#24b47e] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1f9e6e]">
  Pay $24.90
</button>
```

### Secondary button

```tsx
<button className="rounded-md border border-[#e3e8ee] bg-white px-4 py-2 text-sm font-medium text-[#0a2540] shadow-[0_1px_1px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f7fafc]">
  Uninstall app
</button>
```

### Input

```tsx
<input
  className="w-full rounded-md border border-[#e3e8ee] bg-white px-3 py-2.5 text-sm text-[#0a2540] placeholder:text-[#8792a2] shadow-[0_1px_1px_rgba(0,0,0,0.03)] transition-shadow focus:border-[#635bff] focus:shadow-[0_0_0_3px_rgba(99,91,255,0.25)] focus:outline-none"
  placeholder="orders@supertodo.me"
/>
```

### Tab bar (horizontal nav)

Active: blurple pill background + white/dark text. Inactive: muted, transparent.

```tsx
<button className={cn(
  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
  active ? "bg-[#635bff] text-white" : "text-[#425466] hover:bg-[#f7fafc]"
)}>Home</button>
```

### Card

```tsx
<div className="rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(50,50,93,0.10),0_1px_2px_rgba(0,0,0,0.06)]">
  ...
</div>
```

### Metric block (dashboard "Today")

```tsx
<div>
  <p className="text-sm font-medium text-[#697386]">Gross volume</p>
  <p className="mt-1 text-3xl font-semibold tabular-nums text-[#0a2540]">$12,198.72</p>
  <p className="mt-1 text-xs text-[#8792a2]">1:00 PM</p>
</div>
```

### Status pill

```tsx
// success
<span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-xs font-medium text-[#24b47e]">
  <span className="h-1.5 w-1.5 rounded-full bg-[#24b47e]" /> Connected
</span>
```

### Sidebar info panel (settings right rail)

```tsx
<aside className="rounded-lg bg-[#f7fafc] p-6 text-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-[#697386]">Version</p>
  <p className="mt-1 text-[#0a2540]">v1.4.2</p>
</aside>
```

### Radio / toggle row

```tsx
<label className="flex items-center gap-2 text-sm text-[#0a2540]">
  <input type="radio" className="accent-[#635bff]" /> Yes
</label>
```

### Floating app panel (dock popover)

```tsx
<div className="rounded-xl bg-white shadow-[0_7px_14px_rgba(50,50,93,0.10),0_3px_6px_rgba(0,0,0,0.08)]">
  <header className="flex items-center justify-between rounded-t-xl bg-[#ec4899] px-4 py-3 text-white">...</header>
  <div className="p-6">...</div>
</div>
```

---

## Hero / marketing (Stripe.com style)

When building a marketing page rather than a product UI:

- **Diagonal gradient hero.** The famous angled blurple-to-cyan band. Skew a colored block behind the content.
- Gradient: `linear-gradient(101deg, #635bff 0%, #00d4ff 100%)` or the warmer `#a960ee → #ff333d → #ffcb57`.
- Light content on top, then white cards float over the seam.

```tsx
<section className="relative overflow-hidden bg-[#f6f9fc]">
  <div className="absolute inset-0 origin-top-left -skew-y-6 bg-[linear-gradient(101deg,#635bff,#00d4ff)]" />
  <div className="relative mx-auto max-w-6xl px-6 py-32 text-white">...</div>
</section>
```

Keep this for marketing only. Product/app UIs stay flat pale-blue, no gradient.

---

## Charts (fintech data viz)

Soft, light, blurple-led - the Stripe dashboard look:

- Series as a **blurple ramp**: `#635bff → #9b96ff → #cdcaff → #e9e8ff`. The primary/highlighted series is full blurple `#635bff`; supporting series fade toward light lavender.
- Use `#24b47e` (green) for explicitly positive/paid series, `#df1b41` for negative, sparingly.
- **Rounded bars** (`borderRadius: 6-8`), flat fills, no gradients or glow.
- Background stays white/`#f6f9fc`; gridlines `#e3e8ee`; axis text sans (`Inter`), muted `#697386`, tabular nums.
- Tooltip: navy `#0a2540` background, white text, `8px` corners.
- Doughnut: white segment stroke (`#fff`), `60-62%` cutout; legend in sans.

```js
const PRIMARY="#635bff", S2="#9b96ff", S3="#cdcaff", S4="#e9e8ff", GRID="#e3e8ee";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.color = "#697386";
// bars: backgroundColor:[S2, PRIMARY], borderRadius:6
// grid: { color: GRID }
// tooltip: { backgroundColor:"#0a2540", cornerRadius:8 }
```

---

## Motion & effects

- Soft shadow IS the depth language - keep it; do not strip it like in `grid`/`black-grid`.
- Hover: slight bg shift (`#f7fafc`), darker fill on primary buttons, never scale-jump.
- Focus: 3px blurple ring (`rgba(99,91,255,0.25)`) on inputs and focusable controls. Always visible.
- `transition-colors duration-150` on interactive elements; `transition-shadow` on inputs.
- Subtle card lift on hover is OK for clickable cards: shadow `card → float`.
- No glow halos, no neon, no glass blur on product surfaces.

---

## Mode selection

| Surface type | Background | Accent | Notes |
|--------------|------------|--------|-------|
| Dashboard / app UI | `#f6f9fc` flat | blurple | shadows + rounded, tabular nums |
| Settings / forms | `#f6f9fc`, white cards | blurple | narrow shell, breadcrumb nav |
| Checkout / payment | white OR dark navy | green CTA | rounded inputs, payment-method tabs |
| Marketing / landing | gradient hero + white | blurple | diagonal skew band |

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| `rounded-none` / sharp corners on cards | Stripe is soft and rounded, not blueprint-square |
| Removing shadows in favor of 1px borders only | Elevation is the core depth language here |
| Pure black `#000` background | Use navy `#0a2540` for dark, pale `#f6f9fc` for light |
| Blurple on large fills / backgrounds | Reserve it for actions and active state |
| Mono for body text | Sans for prose; mono only for card #, IDs, code |
| Heavy `shadow-2xl` drop shadows | Use the layered soft tokens, not one big blur |
| Gradient on product/app surfaces | Gradient is marketing-hero only; product stays flat |
| Skipping the focus ring | Fintech trust UI must keep visible focus states |
| Saturated multi-color UI | Keep layout neutral; one accent + status colors |

---

## Project overrides

If the repo defines `.agents/styles/stripe.md` or `.agents/styles/stripe-theme.md`, prefer those tokens and components over this portable spec.
