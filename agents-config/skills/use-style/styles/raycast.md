# Raycast Style

Glossy dark product marketing. Near-black canvas, red accent, soft glow gradients, floating glass nav, oversized bold pricing, large-radius cards. Premium and refined - the opposite of flat.

**Reference vibe:** raycast.com (pricing, marketing, footer).

---

## Core vibe

- **Dark and glossy.** Near-black canvas with subtle red glow gradients bleeding from the top. Depth via light, not lines.
- **Red accent.** Raycast red `#FF6363` for the logo, sparkles, highlights. Used as a glow and a spark, rarely a flat fill.
- **Floating glass chrome.** The nav is a detached pill/bar with a translucent fill, `backdrop-blur`, and a faint border.
- **Big bold pricing.** Oversized white numerals (`$8`, `$16`) with a small mono `/ month`. Numbers are the hero.
- **Large soft radius.** Cards at `rounded-3xl` (20-24px), subtle gradient fills, faint borders, soft inner glow.
- **Refined Inter.** Clean sans everywhere; mono only for `/month`, prices-per-unit, tiny meta.
- **Quiet muted body.** White headings, gray body, generous spacing. Color is the spark on a calm dark field.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#0A0A0A` | `--rc-bg` | Page background |
| Canvas deep | `#000000` | `--rc-bg-deep` | Footer / deepest sections |
| Surface | `#141414` | `--rc-surface` | Cards, panels |
| Surface raised | `#1C1C1E` | `--rc-surface-raised` | Featured card, hover, inputs |
| Glass | `rgba(20,20,20,0.6)` | `--rc-glass` | Floating nav fill (with blur) |
| Ink | `#FFFFFF` | `--rc-fg` | Headings, prices, active nav |
| Muted ink | `#A1A1A1` | `--rc-muted-fg` | Body, feature text, nav links |
| Subtle ink | `#6B6B6B` | `--rc-subtle-fg` | Meta, struck prices, footer fine print |
| Border | `#232323` | `--rc-border` | Card borders, dividers |
| Border glass | `rgba(255,255,255,0.08)` | `--rc-border-glass` | Floating nav / glass outlines |
| Red | `#FF6363` | `--rc-red` | Logo, sparkle, accents, glow |
| Red deep | `#E5484D` | `--rc-red-deep` | Hover / stronger accent |
| Blue | `#3B9EFF` | `--rc-blue` | Verified badge, secondary links |
| Light | `#F5F5F5` | `--rc-light` | Light button fill (Download) |

### Tailwind mapping (when no project tokens)

```css
:root {
  --rc-bg: #0a0a0a;
  --rc-surface: #141414;
  --rc-surface-raised: #1c1c1e;
  --rc-fg: #fff;
  --rc-muted-fg: #a1a1a1;
  --rc-border: #232323;
  --rc-red: #ff6363;
  --rc-blue: #3b9eff;
}
```

### The red glow

The signature top-of-page atmosphere: diagonal/radial red beams fading into black.

```css
background:
  radial-gradient(60% 50% at 50% 0%, rgba(255,99,99,0.18), transparent 70%),
  #0a0a0a;
/* or diagonal beams */
background-image: linear-gradient(115deg, transparent 40%, rgba(255,99,99,0.12) 50%, transparent 60%);
```

**Rule:** Keep the field dark and calm. Red appears as glow, logo, and spark - never as a big solid block.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (everything) | `Inter, "SF Pro Display", ui-sans-serif, system-ui, sans-serif` |
| Mono (`/month`, units, meta) | `"Berkeley Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |

### Scale

| Level | Pattern |
|-------|---------|
| Hero | `text-5xl md:text-7xl font-semibold tracking-tight text-white` |
| Price numeral | `text-6xl md:text-7xl font-bold tracking-tight text-white` |
| Price unit | `font-mono text-sm text-[#6b6b6b]` (`/ month`) |
| Card title | `text-xl font-semibold text-white` |
| Card subtitle | `text-base text-[#a1a1a1]` |
| Section heading | `text-2xl md:text-3xl font-semibold tracking-tight` |
| Body / feature | `text-sm md:text-[15px] text-[#a1a1a1] leading-relaxed` |
| Nav / button | `text-sm font-medium` |
| Struck price | `text-sm text-[#6b6b6b] line-through` |

---

## Layout tokens

| Token | Value |
|-------|-------|
| `RC_SHELL` | `mx-auto w-full max-w-6xl px-4 sm:px-6` |
| `RC_SECTION` | `py-16 md:py-24` |
| `RC_CARD_RADIUS` | `rounded-3xl` (cards) |
| `RC_NAV_RADIUS` | `rounded-2xl` or `rounded-full` (floating nav) |
| `RC_CARD_PAD` | `p-6 md:p-8` |

### Page shell with glow

```tsx
<div className="relative min-h-screen bg-[#0a0a0a] text-white">
  {/* top red glow */}
  <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px]
    bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,99,99,0.18),transparent_70%)]" />
  <FloatingNav />
  <main className={cn(RC_SHELL, "relative")}>...</main>
</div>
```

### Floating glass nav

Detached from the top edge, translucent, blurred, faint border.

```tsx
<header className="sticky top-4 z-50 px-4">
  <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl
    border border-white/10 bg-[#141414]/60 px-5 py-3 backdrop-blur-xl">
    <span className="flex items-center gap-2 font-semibold">
      <Logo className="text-[#ff6363]" /> Raycast
    </span>
    <div className="hidden gap-7 text-sm text-[#a1a1a1] md:flex">
      <a className="hover:text-white">Store</a>
      <a className="rounded-md ring-1 ring-[#3b9eff]/60 px-2 py-0.5 text-white">Pricing</a>
    </div>
    <button className="rounded-xl bg-[#f5f5f5] px-4 py-2 text-sm font-medium text-black hover:bg-white"> Download</button>
  </nav>
</header>
```

---

## Borders, radius & elevation

| Context | Radius | Border | Fill |
|---------|--------|--------|------|
| Pricing / feature card | `rounded-3xl` | `border border-[#232323]` | gradient `#141414 → #0f0f0f` |
| Featured card | `rounded-3xl` | `border border-white/10` + soft ring | raised `#1c1c1e`, faint glow |
| Floating nav / glass | `rounded-2xl` / `full` | `border-white/10` | `bg-[#141414]/60 backdrop-blur-xl` |
| Button (primary light) | `rounded-xl` | none | `#f5f5f5` |
| Button (dark) | `rounded-xl` | `border-[#232323]` | `#1c1c1e` |
| Input | `rounded-xl` | `border-[#232323]` | `#141414` |
| Toggle pill | `rounded-full` | `border-[#232323]` | track `#141414` |

Cards get a faint inner top highlight; the featured card gets a subtle outer glow. No hard offset shadows.

---

## Component patterns

### Pricing card

```tsx
<div className="rounded-3xl border border-[#232323] bg-gradient-to-b from-[#141414] to-[#0f0f0f] p-8">
  <h3 className="text-xl font-semibold text-white">Raycast Pro</h3>
  <p className="mt-1 text-sm text-[#a1a1a1]">AI at your fingertips</p>
  <div className="mt-8 flex items-baseline gap-2">
    <span className="text-6xl font-bold tracking-tight text-white">$8</span>
    <span className="font-mono text-sm text-[#6b6b6b]">/ month</span>
  </div>
  <p className="mt-2 text-sm text-[#6b6b6b]"><span className="line-through">$120</span> $96 billed annually</p>
  <ul className="mt-8 space-y-3">{features}</ul>
</div>
```

### Featured card (raised + badge)

```tsx
<div className="relative rounded-3xl border border-white/10 bg-[#1c1c1e] p-8
  shadow-[0_0_80px_-20px_rgba(255,99,99,0.25)]">
  <span className="absolute right-6 top-6 text-[#3b9eff]">{verifiedBadge}</span>
  ...
</div>
```

### Feature row (circle check)

```tsx
<li className="flex items-start gap-3 text-sm">
  <CheckCircle className="mt-0.5 size-4 shrink-0 text-[#a1a1a1]" />
  <span className="text-[#e5e5e5]">Unlimited Clipboard History</span>
</li>
```

### Billing toggle

```tsx
<div className="inline-flex items-center gap-1 rounded-full border border-[#232323] bg-[#141414] p-1">
  <button className="rounded-full px-4 py-1.5 text-sm text-[#a1a1a1]">Monthly</button>
  <button className="rounded-full bg-[#1c1c1e] px-4 py-1.5 text-sm text-white">
    Yearly <span className="ml-1 rounded-full bg-white/10 px-1.5 text-xs">-20%</span>
  </button>
</div>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary (light) | `rounded-xl bg-[#f5f5f5] px-5 py-2.5 text-sm font-medium text-black hover:bg-white` |
| Secondary (dark) | `rounded-xl border border-[#232323] bg-[#1c1c1e] px-5 py-2.5 text-sm text-white hover:bg-[#242424]` |
| Link | `text-[#3b9eff] hover:underline` |

### Sparkle accent

The red spark marks AI / premium tiers. Small, red, never large.

```tsx
<span className="text-[#ff6363]">✦</span>
```

### Footer (multi-column dark)

```tsx
<footer className="border-t border-[#232323] bg-black pt-16">
  <div className={cn(RC_SHELL, "grid grid-cols-2 gap-8 md:grid-cols-6")}>
    {columns.map((c) => (
      <div key={c.title}>
        <p className="text-sm font-medium text-white">{c.title}</p>
        <ul className="mt-4 space-y-3 text-sm text-[#a1a1a1]">{c.links}</ul>
      </div>
    ))}
  </div>
</footer>
```

---

## Charts (glossy dark data viz)

- Series: red `#ff6363` for the highlighted series, neutral grays `#a1a1a1` / `#6b6b6b` / `#2a2a2a` for the rest. Blue `#3b9eff` as a secondary accent.
- Background = card fill (`#141414`); gridlines `#232323`; axis text `Inter`, muted `#6b6b6b`.
- **Rounded bars** (`borderRadius: 6-8`), flat fills - optionally a vertical gradient on the highlighted series for a glossy sheen.
- Tooltip: glass - `rgba(20,20,20,0.9)` + `#232323` border + white text, `12px` corners.
- Doughnut: segment stroke = card fill; legend in muted sans.
- A faint glow under the chart (red, low opacity) reinforces the Raycast atmosphere on hero charts.

```js
const RED="#ff6363", BLUE="#3b9eff", S2="#a1a1a1", S3="#6b6b6b", S4="#2a2a2a", GRID="#232323";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.color = "#6b6b6b";
// bars: backgroundColor:[S3, RED], borderRadius:8
// grid: { color: GRID }
// tooltip: { backgroundColor:"rgba(20,20,20,0.9)", borderColor:"#232323", borderWidth:1, cornerRadius:12 }
```

---

## Motion & effects

- Glow IS the depth language - keep the soft red gradients and faint card glows.
- Hover: subtle bg lift (`#1c1c1e → #242424`), border lighten, or a gentle glow bloom. No hard movement.
- `backdrop-blur` on the floating nav and any glass surface.
- `transition-colors duration-150`; the featured card may breathe a slow glow.
- Avoid hard offset shadows (that's Gumroad), avoid flat-no-glow (that's vercel-simple). Raycast is glossy-soft.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Flat dark with no glow/gradient | Raycast's identity is the soft glow + glass |
| Sharp `rounded-none` cards | Cards are large-radius `rounded-3xl` |
| Red as a big solid background fill | Red is glow, logo, spark - kept small |
| Hard offset shadows (`Npx Npx 0`) | That's neo-brutalist; use soft glow instead |
| Mono as the body font | Inter is primary; mono only for `/month` + meta |
| Opaque flat nav glued to the top edge | Nav floats, translucent, blurred, detached |
| Pure `#fff` background sections | Stay dark; this is a dark-only style |
| Multiple loud accent colors | Red primary + blue secondary, both restrained |

---

## Project overrides

If the repo defines `.agents/styles/raycast.md` or `.agents/styles/raycast-theme.md`, prefer those tokens and components over this portable spec.
