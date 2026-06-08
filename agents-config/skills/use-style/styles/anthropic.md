# Anthropic Style

Warm, literary AI-lab aesthetic. Cream paper, bold grotesque display mixed with a reading serif, clay-coral accent, big soft-rounded panels. Calm, human, considered.

**Reference vibe:** anthropic.com (marketing) and claude.ai (the app).

---

## Core vibe

- **Warm, not clinical.** Ivory/oatmeal paper, ink near-black, a single clay-coral accent. Never pure `#fff` / `#000`.
- **Two type voices.** Bold neo-grotesque sans for display/UI; a humanist serif for reading copy and product surfaces. The contrast is the signature.
- **Editorial hero.** Oversized lowercase sans words, some ghosted at low opacity and scattered, paired with a serif paragraph. Composed like a poster.
- **Big soft radius.** Large rounded rectangles (`16-28px`) on dark panels and media; pill buttons. Soft, never sharp blueprint corners.
- **Quiet structure.** Few rules, lots of air. Hierarchy comes from type scale and the cream/ink/dark-panel contrast, not from boxes everywhere.
- **One accent.** Clay coral `#CC785C` / `#D97757` (the Claude spark). Used sparingly: a mark, a link, an active dot.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Paper | `#F0EFE9` | `--an-bg` | Marketing background (warm oatmeal) |
| Paper light | `#FAF9F5` | `--an-bg-light` | Lighter cream sections, cards on cream |
| Ink | `#191919` | `--an-fg` | Headlines, body on cream |
| Ink soft | `#141413` | `--an-ink` | Dark panels / app canvas |
| Slate | `#3D3D3A` | `--an-slate` | Secondary text on cream |
| Muted | `#6B6B66` | `--an-muted` | Captions, metadata, ghost nav |
| Ghost | `#C9C7BD` | `--an-ghost` | Scattered ghosted hero words, faint type |
| Border | `#DAD9D2` | `--an-border` | Hairline dividers on cream |
| Coral | `#CC785C` | `--an-coral` | Primary accent: marks, links, active dot |
| Coral bright | `#D97757` | `--an-coral-bright` | Spark glyph, hover |

### Dark / app surface (claude.ai)

| Role | Hex | Usage |
|------|-----|-------|
| App canvas | `#262624` | Main chat area |
| App rail | `#1F1E1D` | Sidebar |
| App raised | `#30302E` | Hover rows, input field |
| Ink on dark | `#F5F4EE` | Primary text (warm white) |
| Muted on dark | `#A8A79E` | Secondary nav, labels |
| Border on dark | `#3A3A37` | Dividers, input outline |
| Coral | `#D97757` | Spark, send accent |

### Tailwind mapping (when no project tokens)

```css
:root {
  --an-bg: #f0efe9;
  --an-bg-light: #faf9f5;
  --an-fg: #191919;
  --an-slate: #3d3d3a;
  --an-muted: #6b6b66;
  --an-ghost: #c9c7bd;
  --an-coral: #cc785c;
  --an-panel: #141413;
}
```

**Rule:** Cream + ink is the whole page. Coral is a spice, not a fill. Dark panels (`#141413`) are objects placed on the cream, with large radius.

---

## Typography

Two faces, deliberate split.

### Font stacks

| Role | Stack | Open substitute |
|------|-------|-----------------|
| Display / UI (sans) | `"Styrene A", "Styrene B", Inter, "Helvetica Neue", Arial, sans-serif` | `Inter` (tight tracking) |
| Reading / product (serif) | `"Copernicus", "Tiempos Text", Georgia, "Source Serif 4", serif` | `"Source Serif 4"` or Georgia |
| Logo wordmark | sans, bold, uppercase, with the `\` slash: `ANTHROP\C` | Inter / Styrene |

claude.ai sets long-form answers in the **serif**; the app chrome (sidebar, buttons) in the **sans**. Match that split.

### Scale

| Level | Font | Pattern |
|-------|------|---------|
| Hero word | Sans | `text-6xl md:text-8xl font-bold lowercase tracking-[-0.02em] leading-[0.95]` |
| Ghost hero word | Sans | same size, `text-[#c9c7bd]` (faint), scattered |
| Section / H2 | Sans | `text-3xl md:text-4xl font-semibold tracking-tight` |
| Serif lede / body-feature | Serif | `text-xl md:text-2xl leading-[1.35]` |
| Body (product / reading) | Serif | `text-[17px] leading-[1.7] text-[#191919]` |
| Body (UI / marketing prose) | Sans | `text-base leading-relaxed text-[#3d3d3a]` |
| Nav / button / label | Sans | `text-sm font-medium` |
| Eyebrow / caption | Sans | `text-xs uppercase tracking-[0.08em] text-[#6b6b66]` |

### Hero composition (the poster)

Big lowercase sans words laid across a wide band, a couple of them ghosted and offset, with a serif paragraph anchored right.

```tsx
<section className="bg-[#f0efe9] px-8 py-24">
  <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12">
    <div className="relative font-sans font-bold lowercase leading-[0.95] tracking-[-0.02em] text-[clamp(48px,9vw,128px)] text-[#191919]">
      <span className="underline decoration-2 underline-offset-[6px]">research</span>
      <span className="ml-4 text-[#c9c7bd]">and</span>
      <div>safety <span className="text-[#c9c7bd]">the</span> <span className="text-[#c9c7bd]">put</span></div>
    </div>
    <p className="font-serif text-2xl leading-[1.35] text-[#191919] self-center">
      AI will have a vast impact on the world. Anthropic is a public benefit corporation...
    </p>
  </div>
</section>
```

---

## Layout tokens

| Token | Value |
|-------|-------|
| `AN_SHELL` | `mx-auto w-full max-w-[1200px] px-6 md:px-10` |
| `AN_SECTION` | `py-16 md:py-24` |
| `AN_PANEL_RADIUS` | `rounded-[28px]` (large dark media panels) |
| `AN_CARD_RADIUS` | `rounded-2xl` (cards) |
| `AN_GAP` | `gap-8 md:gap-12` |

### Dark media panel (the big black rounded block)

A near-full-width dark rectangle with very large top radius, used for video/imagery/feature on the cream.

```tsx
<div className="rounded-[28px] bg-[#141413] text-[#f5f4ee] p-8 md:p-12 min-h-[420px]">...</div>
```

### App shell (claude.ai)

```tsx
<div className="flex min-h-screen bg-[#262624] text-[#f5f4ee]">
  <aside className="w-64 bg-[#1f1e1d] border-r border-[#3a3a37] p-3">{nav}</aside>
  <main className="flex-1">
    <div className="mx-auto max-w-3xl px-6 py-10 font-serif text-[17px] leading-[1.7]">{answer}</div>
  </main>
</div>
```

---

## Component patterns

### Logo wordmark

```tsx
<span className="font-sans text-xl font-bold uppercase tracking-tight">ANTHROP\C</span>
```

The backslash replaces the `I`. On the app it's the serif "Claude" wordmark instead.

### Nav

Sans, medium, ink. Dropdowns with a small chevron. Generous spacing.

```tsx
<nav className="flex items-center gap-8 font-sans text-sm font-medium text-[#191919]">
  <a>Research</a><a>Economic Futures</a>
  <a className="inline-flex items-center gap-1">Learn <span>▾</span></a>
</nav>
```

### Primary button (black pill)

```tsx
<button className="rounded-full bg-[#191919] px-5 py-2.5 font-sans text-sm font-medium text-[#f5f4ee] hover:bg-black">
  Try Claude
</button>
```

A split button pairs it with a square dropdown chip at the same radius family.

### Coral link / mark

```tsx
<a className="text-[#cc785c] underline decoration-1 underline-offset-2 hover:text-[#d97757]">read more</a>
```

### The spark (Claude glyph)

The coral asterisk/burst is the brand mark. Use as a small accent, loading indicator, or section marker - never large flat fills.

```tsx
<span className="text-[#d97757] text-lg">✳</span>
```

### Card on cream

```tsx
<div className="rounded-2xl bg-[#faf9f5] border border-[#dad9d2] p-6">
  <h3 className="font-sans text-lg font-semibold">Title</h3>
  <p className="mt-2 font-serif text-[17px] leading-relaxed text-[#3d3d3a]">...</p>
</div>
```

### App message (serif answer)

```tsx
<div className="font-serif text-[17px] leading-[1.7] text-[#f5f4ee] space-y-5">
  <p><b className="font-semibold">1. Postictal vomiting.</b> After a seizure...</p>
</div>
```

Bold lead-ins inside serif paragraphs are a Claude pattern.

### App input

```tsx
<div className="rounded-2xl bg-[#30302e] border border-[#3a3a37] px-4 py-3 font-sans text-sm text-[#a8a79e]">
  Write a message...
</div>
```

---

## Charts (warm data viz)

- Series: ink `#191919`, warm grays `#6b6b66` / `#c9c7bd` / `#dad9d2`, with **coral `#cc785c`** as the single highlight series.
- Background stays cream; gridlines `#dad9d2`; axis text sans, muted.
- Soft-rounded bars (`borderRadius` 6-8), flat fills, no glow.
- Tooltip: ink `#191919` background, warm-white text.
- On dark panels, flip to warm-white text + `#3a3a37` gridlines, same coral highlight.

---

## Motion & effects

- Calm and slow. Subtle fades, gentle hover (bg/opacity shift), the spark can rotate slowly.
- Large radius + flat fill is the look; avoid heavy drop shadows. A faint shadow under floating dark panels is OK.
- No neon, no glass blur, no aggressive transforms.

---

## Mode selection

| Surface | Background | Type lead | Notes |
|---------|------------|-----------|-------|
| Marketing / landing | Cream `#f0efe9` | bold sans display + serif body | dark rounded media panels, pill buttons, ghost words |
| Product / app (Claude) | Dark warm `#262624` | serif body, sans chrome | sidebar, coral spark, rounded input |
| Reading / docs | Cream light `#faf9f5` | serif body | wide air, hairline dividers |

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Pure `#fff` background or `#000` ink | Anthropic is warm: cream + near-black only |
| Serif for the hero display | Display is bold grotesque sans; serif is for reading |
| All-sans product copy | Long-form/product reading is serif (the Claude tell) |
| Coral as a large fill or multiple accent colors | One coral spice, used sparingly |
| Sharp `rounded-none` panels | Big soft radius is core; dark panels especially |
| Cold blue/indigo tech accent | Stay in the warm clay family |
| Dense bordered cards everywhere | Prefer air + type scale; few rules |
| Heavy neon glow / glassmorphism | Out of register; keep it flat and calm |

---

## Project overrides

If the repo defines `.agents/styles/anthropic.md` or `.agents/styles/anthropic-theme.md`, prefer those tokens and components over this portable spec.
