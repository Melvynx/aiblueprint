# New York Times Style

Print-newspaper editorial. Serif-driven, hairline rules, multi-column grids, near-zero color. Reads like a broadsheet, not an app.

**Reference vibe:** The New York Times home page, article pages, and opinion section.

---

## Core vibe

- **Editorial, not product.** Authority and reading comfort over UI chrome.
- **Serif headlines.** Display serif for every headline and deck. Sans is for kickers and metadata only.
- **Black ink on paper white.** `#fff` page, `#121212` ink. Color is an accent, almost never a fill.
- **Hairline rules define structure.** Thin black/gray lines separate stories and columns. No cards, no shadows, no radius.
- **Multi-column grid.** A wide main column + a divided sidebar, stories stacked with rules between them.
- **Tight, dense type.** Headlines `leading-none`-ish, generous reading measure for body (`~38ch` per column).
- **Blackletter masthead.** The wordmark is Old English; everything else is Cheltenham/Franklin.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Paper | `#ffffff` | `--nyt-bg` | Page background |
| Wash | `#f7f7f7` | `--nyt-wash` | Rare inset blocks, audio rows |
| Ink | `#121212` | `--nyt-fg` | Headlines, body, rules |
| Slate | `#363636` | `--nyt-slate` | Deck / summary text |
| Muted | `#666666` | `--nyt-muted` | Bylines, credits, "min read" |
| Faint | `#999999` | `--nyt-faint` | Photo credits, timestamps |
| Rule | `#121212` | `--nyt-rule` | Primary hairline dividers |
| Rule light | `#e2e2e2` | `--nyt-rule-light` | Secondary inner dividers |
| Link blue | `#326891` | `--nyt-link` | Text links (hover underline) |
| Subscribe blue | `#567b95` | `--nyt-blue` | Subscribe button fill |
| Live red | `#d0021b` | `--nyt-red` | LIVE markers, market drop, breaking |

### Tailwind mapping (when no project tokens)

```css
:root {
  --nyt-bg: #fff;
  --nyt-fg: #121212;
  --nyt-slate: #363636;
  --nyt-muted: #666;
  --nyt-rule: #121212;
  --nyt-rule-light: #e2e2e2;
  --nyt-link: #326891;
  --nyt-red: #d0021b;
}
```

**Rule:** The page is black-and-white. Red is reserved for LIVE / breaking / market loss. Blue is reserved for links and the subscribe button. Never tint backgrounds.

---

## Typography

The heart of the style. Three faces, strict roles.

### Font stacks

| Role | Stack | Open substitute |
|------|-------|-----------------|
| Headline / deck / body (serif) | `"nyt-cheltenham", Georgia, "Times New Roman", serif` | `"Source Serif 4"` or Georgia |
| Body long-read (serif) | `"nyt-imperial", Georgia, serif` | Georgia |
| Kicker / nav / label / byline (sans) | `"nyt-franklin", "Libre Franklin", Helvetica, Arial, sans-serif` | `"Libre Franklin"` (the open NYT Franklin) |
| Masthead wordmark (blackletter) | `"Old English Text MT", "UnifrakturCook", serif` | `"UnifrakturCook:wght@700"` |

Load via Google Fonts: `Libre+Franklin:wght@400;500;600;700`, `Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700`, `UnifrakturCook:wght@700`.

### Scale

| Level | Font | Pattern |
|-------|------|---------|
| Masthead | Blackletter | `text-4xl md:text-6xl text-center text-[#121212]` |
| Lead headline | Serif | `text-3xl md:text-4xl font-bold leading-[1.05] tracking-[-0.01em]` |
| Story headline | Serif | `text-xl md:text-2xl font-bold leading-tight` |
| Small headline | Serif | `text-lg font-bold leading-snug` |
| Deck / summary | Serif | `text-base md:text-lg leading-snug text-[#363636]` |
| Body | Serif | `text-[17px] leading-[1.6] text-[#121212]` |
| Kicker / section label | Sans | `text-xs font-bold uppercase tracking-[0.05em]` |
| Byline / min read / credit | Sans | `text-xs uppercase tracking-wide text-[#666]` |
| Nav | Sans | `text-sm text-[#363636]` |

### Kickers & labels (the NYT tell)

Small, bold, uppercase, **sans-serif**, often above or inline with a headline. Red for live, ink for sections.

```tsx
<p className="font-sans text-xs font-bold uppercase tracking-wider text-[#d0021b]">Live</p>
<p className="font-sans text-xs font-bold uppercase tracking-wider text-[#121212]">The Headlines</p>
<span className="font-sans text-xs uppercase tracking-wide text-[#666]">4 Min Read</span>
```

---

## Layout tokens

| Token | Value |
|-------|-------|
| `NYT_SHELL` | `mx-auto w-full max-w-[1200px] px-4 sm:px-6` |
| `NYT_SECTION` | `py-6 md:py-8` |
| `NYT_COL_GAP` | `gap-5 md:gap-8` |
| `NYT_MEASURE` | `max-w-[38ch]` (body reading column) |

### Home grid (lead + sidebar)

A wide left region and a rule-divided right rail. The vertical rule between them is the signature.

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
  <div className="lg:border-r lg:border-[#121212] lg:pr-8">{lead}</div>
  <aside className="lg:pl-8">{rail}</aside>
</div>
```

### Story block (image + text columns)

```tsx
<article className="grid grid-cols-1 md:grid-cols-2 gap-5">
  <div>
    <h2 className="font-serif text-2xl font-bold leading-tight">China Builds an Economic Fortress...</h2>
    <p className="mt-2 font-serif text-base leading-snug text-[#363636]">Beijing says the changes are needed...</p>
    <span className="mt-3 block font-sans text-xs uppercase tracking-wide text-[#666]">4 Min Read</span>
  </div>
  <figure>
    <img className="w-full" />
    <figcaption className="mt-1 text-right font-sans text-xs text-[#999]">Jade Gao/AFP — Getty</figcaption>
  </figure>
</article>
```

---

## Rules & dividers (no borders-as-boxes)

Structure comes from lines, never from rounded boxes or shadows.

| Context | Rule |
|---------|------|
| Section top (heavy) | `border-t-2 border-[#121212]` |
| Between stacked stories | `border-t border-[#121212]` |
| Inner / soft separators | `border-t border-[#e2e2e2]` |
| Column divider | `border-r border-[#121212]` |
| Masthead underline | thick rule below nav: `border-b-2 border-[#121212]` |

Stories are separated by hairline rules with vertical padding, **not** wrapped in cards.

```tsx
<div className="divide-y divide-[#121212]">
  {stories.map((s) => <article key={s.id} className="py-6">{...}</article>)}
</div>
```

---

## Masthead & top bar

```tsx
<header>
  <div className="flex items-center justify-between py-2 font-sans text-xs">
    <span>Friday, June 5, 2026</span>
    <nav className="hidden gap-4 sm:flex uppercase tracking-wide text-[#363636]">
      <a className="text-[#121212] font-bold">International</a><a>Canada</a><a>Español</a>
    </nav>
    <span className="text-[#666]">S&P 500 <span className="text-[#d0021b]">-0.98% ↓</span></span>
  </div>
  <h1 className="py-2 text-center font-[blackletter] text-5xl md:text-6xl">The New York Times</h1>
  <nav className="flex justify-center gap-5 border-y-2 border-[#121212] py-3 font-serif text-base">
    <a>U.S.</a><a>World</a><a>Business</a><a>Arts</a>...
  </nav>
</header>
```

- Date left, market/utility right, masthead centered.
- Section nav centered, framed by **two heavy rules** (top + bottom).
- A LIVE strip can sit under the nav: red `LIVE` + sans uppercase headlines, separated by `·`.

---

## Component patterns

### Buttons (subscribe / log in)

```tsx
// Subscribe (filled NYT blue)
<button className="bg-[#567b95] px-4 py-2 font-sans text-xs font-bold uppercase tracking-wide text-white">
  Subscribe for €0.50/week
</button>
// Log in (outline)
<button className="border border-[#121212] px-4 py-2 font-sans text-xs font-bold uppercase tracking-wide text-[#121212]">
  Log in
</button>
```

Square corners. No shadow. Uppercase sans label.

### Text link

```tsx
<a className="text-[#326891] hover:underline">See more updates ›</a>
```

Body links: ink with underline, or NYT blue. Hover always underlines.

### Audio / row item

```tsx
<div className="flex items-center gap-4 border-t border-[#121212] py-5">
  <img className="h-16 w-16 object-cover" />
  <div>
    <p className="font-sans text-xs font-bold uppercase tracking-wide">The Headlines <span className="text-[#666]">Audio</span></p>
    <h3 className="mt-1 font-serif text-xl font-bold leading-snug">Trump's Strategy to Push Out Immigrants...</h3>
    <span className="font-sans text-xs uppercase tracking-wide text-[#666]">14 Min Listen</span>
  </div>
</div>
```

### Photo credit

```tsx
<figcaption className="mt-1 text-right font-sans text-xs text-[#999]">Ryan McGinley</figcaption>
```

### Data / numbers (when an editorial page shows stats)

Use serif for big figures, sans uppercase for the label, a single accent (red for negative, ink for positive). Tabular nums.

```tsx
<div>
  <p className="font-sans text-xs uppercase tracking-wide text-[#666]">Output value</p>
  <p className="font-serif text-4xl font-bold tabular-nums">$977</p>
</div>
```

---

## Charts (editorial data viz)

When charting on this style, keep it print-like:

- Series in **grayscale** (`#121212`, `#666`, `#bbb`, `#e2e2e2`); at most **one** accent (`#d0021b` for the highlighted/negative series).
- Gridlines `#e2e2e2`, axis text sans (`Libre Franklin`) muted.
- Square bars (small or no radius), no glow, flat fills.
- Tooltip: ink background `#121212`, white text.
- Chart titles serif bold; axis labels sans uppercase.

---

## Motion & effects

- Essentially none. This is print.
- Hover: links underline; headlines may shift to `#326891` or stay ink.
- No transforms, no shadows, no fades on scroll, no card lift.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Sans-serif headlines | Headlines are serif; sans is for kickers/labels only |
| Rounded corners on stories/images | Editorial is square; cards break the broadsheet feel |
| `shadow-*`, `ring-*`, gradients | Structure is rules, not depth |
| Tinted/colored backgrounds | Paper stays white; color is accent only |
| Color beyond red (live/loss) + blue (links/subscribe) | One accent each, used sparingly |
| Wrapping stories in bordered cards | Use hairline rules + padding instead |
| Wide body measure (full-width paragraphs) | Keep reading columns near `38ch` |
| Emoji / playful icons | Out of register for a newspaper |

---

## Project overrides

If the repo defines `.agents/styles/new-york-times.md` or `.agents/styles/nyt-theme.md`, prefer those tokens and components over this portable spec.
