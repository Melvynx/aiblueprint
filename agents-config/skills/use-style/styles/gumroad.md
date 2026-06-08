# Gumroad Style

Loud neo-brutalist commerce. Yellow + pink primaries, thick black borders, hard offset shadows, flat fills, playful illustration. Confident and a little chaotic - built to sell.

**Reference vibe:** gumroad.com (marketplace) and the Gumroad creator dashboard.

---

## Core vibe

- **Loud and flat.** Saturated primaries, no gradients on UI, no soft shadows. Everything is bold and unapologetic.
- **Thick black outlines.** `2-4px` solid black borders define cards, buttons, inputs - the structural language.
- **Hard offset shadow.** The neo-brutalist tell: `4px 4px 0 #000` (or `6px 6px`), no blur. Things look stamped, not floating.
- **Yellow + pink.** Brand yellow `#FFC900` for big surfaces/marketing, pink `#FF90E8` for accents, prices, CTAs, active state.
- **Bold geometric sans.** Heavy grotesque for everything; lowercase wordmark. No serif.
- **Square-ish, but pills for actions.** Cards near-`0` radius with thick borders; nav items and buttons are full pills.
- **Playful illustration.** Flat primary-color cartoons, hand-drawn energy, emoji-adjacent. Personality over polish.
- **Two surfaces.** Loud light/yellow marketplace, and a near-black creator dashboard with pink accents.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Brand yellow | `#FFC900` | `--gr-yellow` | Hero bands, marketing background, highlights |
| Pink | `#FF90E8` | `--gr-pink` | Accent, price tags, CTAs, active nav, links |
| Ink | `#000000` | `--gr-fg` | Text, borders, shadows |
| Paper | `#FFFFFF` | `--gr-bg` | Light surface, cards on yellow/dark |
| Off-white | `#F4F4F0` | `--gr-paper` | Subtle light cards |
| Teal | `#23A094` | `--gr-teal` | Secondary accent / illustration / chart |
| Mint | `#90E8D0` | `--gr-mint` | Light teal tint |
| Purple | `#90A8ED` | `--gr-purple` | Illustration / chart series |
| Orange | `#FF7051` | `--gr-orange` | Warning / illustration / chart |

### Dark / dashboard surface

| Role | Hex | Usage |
|------|-----|-------|
| App canvas | `#161616` | Dashboard background |
| App rail | `#0F0F0F` / `#000` | Sidebar |
| Panel | `#1C1C1C` | Cards, product tiles |
| Panel raised | `#242424` | Hover, inputs |
| Ink on dark | `#FFFFFF` | Primary text |
| Muted on dark | `#A0A0A0` | Secondary text, inactive nav |
| Border on dark | `#2A2A2A` | Dividers, tile borders |
| Pink | `#FF90E8` | Active nav, accents, pill |

### Tailwind mapping (when no project tokens)

```css
:root {
  --gr-yellow: #ffc900;
  --gr-pink: #ff90e8;
  --gr-fg: #000;
  --gr-bg: #fff;
  --gr-teal: #23a094;
  --gr-dark: #161616;
}
```

**Rule:** On light, color is bold and large (yellow bands, pink tags). On dark, the canvas is near-black and pink is the one bright accent. Borders and shadows are always pure black.

---

## Typography

### Font stacks

| Role | Stack | Open substitute |
|------|-------|-----------------|
| Display / UI (sans) | `"Mabry Pro", "ABC Favorit", "Mona Sans", Inter, system-ui, sans-serif` | `"Mona Sans"` or Inter (tight) |
| Mono (rare: code/IDs) | `"Berkeley Mono", ui-monospace, monospace` | ui-monospace |

Geometric grotesque, bold. The `gumroad` wordmark is lowercase, heavy, slightly rounded.

### Scale

| Level | Pattern |
|-------|---------|
| Hero | `text-5xl md:text-7xl font-bold tracking-tight text-black` |
| Section / H2 | `text-2xl md:text-3xl font-bold` |
| Card title | `text-lg font-semibold` |
| Body | `text-base leading-relaxed` |
| Nav / button / label | `text-sm font-medium` |
| Price | `text-sm font-bold` (in the pink ribbon) |
| Wordmark | `text-2xl font-bold lowercase tracking-tight` |

Weight does the work - prefer `font-bold` over light weights. Tracking tight on big sizes.

---

## Layout tokens

| Token | Value |
|-------|-------|
| `GR_SHELL` | `mx-auto w-full max-w-[1200px] px-4 sm:px-6` |
| `GR_SECTION` | `py-10 md:py-14` |
| `GR_BORDER` | `border-2 border-black` (or `border-4` for emphasis) |
| `GR_SHADOW` | `shadow-[4px_4px_0_#000]` (hard, no blur) |
| `GR_CARD_PAD` | `p-5 sm:p-6` |

### Marketplace shell

Yellow top band (search + nav pills), then dark or white product grid below.

```tsx
<div className="min-h-screen bg-[#161616] text-white">
  <header className="bg-[#ffc900] text-black">
    <div className={cn(GR_SHELL, "flex items-center gap-4 py-4")}>
      <span className="text-2xl font-bold lowercase">gumroad</span>
      <input className="flex-1 rounded-full bg-black px-5 py-2.5 text-white" placeholder="Search products" />
      <button className="rounded-full border-2 border-black px-5 py-2 font-medium">Log in</button>
    </div>
    <nav className={cn(GR_SHELL, "flex gap-2 pb-3")}>{pills}</nav>
  </header>
  <main className={cn(GR_SHELL, "py-10")}>{grid}</main>
</div>
```

### Dashboard shell (creator)

Black sidebar + dark canvas. Active item = pink text + pink icon.

```tsx
<div className="flex min-h-screen bg-[#161616] text-white">
  <aside className="w-60 border-r border-[#2a2a2a] bg-black p-3">{nav}</aside>
  <main className="flex-1 p-6 md:p-8">{content}</main>
</div>
```

---

## Borders, radius & shadow

| Context | Radius | Border | Shadow |
|---------|--------|--------|--------|
| Card / tile (light) | `rounded-none` or `rounded-sm` | `border-2 border-black` | `shadow-[4px_4px_0_#000]` |
| Card / tile (dark) | `rounded-md` | `border border-[#2a2a2a]` | none (flat) |
| Button / nav pill | `rounded-full` | `border-2 border-black` (light) | optional hard shadow |
| Input | `rounded-full` (search) or `rounded-md` | `border-2 border-black` | none |
| Price tag | ribbon/flag shape | none | none |

On light surfaces the hard offset shadow is the whole personality - use it on cards, buttons, callouts. On dark, drop the shadow and use thin borders instead.

---

## Component patterns

### Primary button (pink pill)

```tsx
<button className="rounded-full border-2 border-black bg-[#ff90e8] px-6 py-3 font-medium text-black shadow-[4px_4px_0_#000] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000]">
  Start selling
</button>
```

### Secondary / nav pill

```tsx
// active
<button className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white">Design</button>
// inactive
<button className="rounded-full px-4 py-1.5 text-sm font-medium text-black hover:bg-black/10">3D</button>
```

### Product tile (dark)

```tsx
<div className="overflow-hidden rounded-md border border-[#2a2a2a] bg-[#1c1c1c]">
  <div className="aspect-[4/3] bg-[#242424]">{cover}</div>
  <div className="border-t border-[#2a2a2a] p-4">
    <h3 className="font-semibold text-white">Dracula PRO</h3>
    <p className="mt-1 text-sm text-[#a0a0a0]">by Dracula</p>
  </div>
</div>
```

### Price ribbon (the pink flag)

A pink tag with a notched/flag end, black text, bold.

```tsx
<span className="relative inline-block bg-[#ff90e8] px-3 py-1 text-sm font-bold text-black
  [clip-path:polygon(0_0,100%_0,88%_50%,100%_100%,0_100%)]">
  €130.15
</span>
```

### Sidebar nav item (dashboard)

```tsx
<a className={cn(
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
  active ? "text-[#ff90e8]" : "text-white hover:bg-[#242424]"
)}>
  <Icon className="size-5" /> Home
</a>
```

### Onboarding / getting-started card

Bordered dark tile with a flat line-illustration icon and a check when done.

```tsx
<div className="rounded-md border border-[#2a2a2a] bg-[#1c1c1c] p-6 text-center">
  <div className="mx-auto mb-3 text-[#ff90e8]">{illustration}</div>
  <p className="font-semibold text-white">Showtime</p>
  <p className="mt-1 text-sm text-[#a0a0a0]">Create your first product.</p>
</div>
```

### Illustration band

Flat primary-color cartoon, full-bleed inside a bordered black panel. Teal/yellow/pink, hand-drawn energy.

```tsx
<div className="rounded-md border border-[#2a2a2a] overflow-hidden">
  <img className="w-full" src="/illustration.png" alt="" />
</div>
```

---

## Charts (bold flat data viz)

Match the loud, flat personality:

- Series in the brand primaries: pink `#ff90e8`, teal `#23a094`, yellow `#ffc900`, purple `#90a8ed`, orange `#ff7051`. Highlighted series = pink.
- **Flat fills, thick or no bar radius** (`borderRadius: 0-4`). On light, add `borderColor:'#000', borderWidth:2` for the outlined look.
- Light surface: gridlines `#000` at low opacity or `#e5e5e0`; dark surface: gridlines `#2a2a2a`.
- Axis text bold sans; tooltip black background, white text, square corners (or a 2px black-bordered box).
- Doughnut: segments separated by the surface color; bold legend.

```js
const PINK="#ff90e8", TEAL="#23a094", YELLOW="#ffc900", PURPLE="#90a8ed", GRID="#2a2a2a";
Chart.defaults.font.family = "Mona Sans, Inter, system-ui, sans-serif";
// dark: bars backgroundColor:[TEAL, PINK], borderRadius:4
// light: add borderColor:"#000", borderWidth:2
// tooltip: { backgroundColor:"#000", cornerRadius:0 }
```

---

## Motion & effects

- Hover = lift into the shadow: `hover:-translate-y-0.5` with the offset shadow growing (`4px → 6px`). Tactile, stamped.
- Fast, snappy transitions (`transition-transform duration-100`). No slow fades.
- No soft/blurred shadows, no gradients on UI chrome, no glass blur.
- Gradients only inside product cover artwork, never on the UI itself.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Soft blurred shadows (`shadow-lg`, `shadow-xl`) | The look is hard offset `Npx Npx 0 #000` |
| Thin `1px` gray borders on light cards | Light cards use thick `2-4px` black borders |
| Muted / pastel-only palette | Gumroad is saturated and loud (yellow + pink) |
| Serif type | All bold geometric sans |
| Gradients on buttons / backgrounds | Keep UI flat; gradients live in cover art only |
| Light weights for headings | Prefer `font-bold` everywhere |
| Pink as a huge background fill | Pink is accents/tags/CTAs; yellow is the big surface |
| Over-rounded `rounded-2xl` cards | Cards are square-ish; only buttons/nav are full pills |

---

## Project overrides

If the repo defines `.agents/styles/gumroad.md` or `.agents/styles/gumroad-theme.md`, prefer those tokens and components over this portable spec.
