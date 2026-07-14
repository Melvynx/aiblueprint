# Vercel Style

Current Vercel product language across the dashboard, marketing homepage, and changelog: exact black canvas, quiet gray hierarchy, Geist typography, hairline structure, and large editorial whitespace.

## Core vibe

- **Premium infrastructure, not a terminal theme.** Precise and technical, but polished enough for product marketing.
- **Black is the canvas.** Use `#000`; lift app rows and cards only to `#0a0a0a` or `#111`.
- **Hairlines create the interface.** Dividers and outlines are subtle `#262626`, never a visible grid motif.
- **Typography carries the page.** Large, light-weight Geist headlines; compact medium labels; mono only for hashes, branches, metrics, and agent copy.
- **Two density modes.** Dashboard surfaces are dense and aligned; marketing surfaces are extremely spacious and editorial.
- **Mostly monochrome.** Color appears only in semantic status, deployment environment, avatars, and rare product imagery.

## Palette

| Role | Value | Usage |
|---|---:|---|
| Canvas | `#000000` | Global page and sidebar |
| Surface | `#0a0a0a` | Rows, cards, inset dashboard regions |
| Hover | `#171717` | Active nav, selected filter, row hover |
| Primary text | `#ededed` | Headlines, names, primary values |
| Secondary text | `#a1a1a1` | Metadata and descriptions |
| Quiet text | `#666666` | Placeholders and low-priority labels |
| Hairline | `#262626` | Borders and separators |
| Strong hairline | `#333333` | Focus and hover outline |
| White action | `#ededed` | Primary button fill |
| Vercel blue | `#0070f3` | Production/environment state only |
| Ready | `#45dec4` | Healthy deployment dot |
| Error | `#f33a4a` | Error or blocked state |

Keep at least 90% of the page black, gray, and white. Never introduce a decorative brand gradient.

## Typography

- Use `Geist, Arial, sans-serif`; use `Geist Mono, SFMono-Regular, monospace` only for technical metadata.
- Marketing display: `clamp(3rem, 6vw, 5.5rem)`, `font-weight: 400`, `line-height: .92`, `letter-spacing: -.055em`.
- Page heading: `text-4xl md:text-6xl`, regular weight, tight tracking.
- Dashboard title and row labels: `14-16px`, medium weight.
- Metadata: `13-14px`, muted; technical metadata may be mono.
- Avoid uppercase everywhere. Reserve spaced uppercase mono for short agent/infrastructure statements.

## Geometry

| Element | Radius | Treatment |
|---|---:|---|
| Dashboard rows and large tables | `0-8px` outer only | Hairline separators; no individual floating cards |
| Search and select controls | `8px` | Black fill, `1px` hairline |
| Secondary buttons | `8px` | Black fill, subtle outline |
| Primary buttons | `8px` | White fill, black text |
| Status/environment chips | `999px` | Compact semantic pills |
| Marketing article cards | `0` | Large near-black slabs, usually no visible radius |

Do not make every element a pill. Pills are for status, compact filters, and identity chips only.

## Dashboard composition

- Use a fixed left sidebar around `240px`, a thin right border, and compact icon + label rows.
- Put workspace switcher at the top and profile/utility controls at the bottom.
- Use a slim top bar with context on the left, centered page title, and agent/product action on the right.
- Place filters in one aligned horizontal row above a dense list or table.
- Rows should be `56-72px` high with stable columns: title, status, environment, project, commit, branch, time, avatar.
- Prefer one continuous bordered list over a collection of floating cards.
- Selected navigation uses `#1f1f1f`; inactive items are gray with no container.

```tsx
<div className="min-h-screen bg-black text-[#ededed]">
  <aside className="fixed inset-y-0 w-60 border-r border-[#262626]">...</aside>
  <main className="ml-60 min-w-0">
    <header className="h-16 border-b border-[#262626]">...</header>
    <section className="p-6">...</section>
  </main>
</div>
```

## Marketing composition

- Use a centered max-width around `1720px` with generous `48-96px` side padding.
- Keep the header sparse: triangle mark, four quiet links, two outlined actions, avatar.
- Hero sections should occupy most of the viewport and use three-part composition: oversized statement, restrained central visual, compact technical support copy.
- Allow dramatic emptiness. Do not fill blank space with generic feature cards.
- Customer marks may form a quiet monochrome baseline near the fold.
- For changelogs/editorial indexes, use a large heading and category navigation, then a strict three-column grid of oversized story cards.
- Featured story cards are tall, flat `#0a0a0a` slabs with title near the top and description/byline anchored near the bottom.

## Signature imagery

- The Vercel triangle may be used as a single focal object.
- Render it monochrome, geometric, and centered; a soft white backlight is allowed behind the mark.
- Glow belongs to the hero object only. Never add ambient purple/blue auroras, glass cards, or glossy gradients.
- Product screenshots should retain true dashboard density instead of being simplified into decorative mockups.

## Components

### Buttons

```tsx
const primary = "rounded-lg bg-[#ededed] px-5 py-2.5 text-sm font-medium text-black hover:bg-white";
const secondary = "rounded-lg border border-[#333] bg-black px-5 py-2.5 text-sm font-medium text-[#ededed] hover:bg-[#111]";
```

### Dashboard filter

```tsx
<button className="flex h-11 items-center gap-3 rounded-lg border border-[#262626] bg-black px-4 text-sm text-[#a1a1a1] hover:border-[#333]">
  <Icon className="size-4" />
  <span>All Environments</span>
</button>
```

### Deployment row

```tsx
<div className="grid min-h-14 grid-cols-[minmax(280px,1fr)_160px_140px_160px_100px_120px_90px_28px] items-center gap-4 border-b border-[#262626] px-4 text-sm last:border-b-0 hover:bg-[#0a0a0a]">
  <span className="truncate text-[#ededed]">fix: harden workflow compatibility</span>
  <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#45dec4]" />Ready</span>
  <span className="w-fit rounded-full border border-[#262626] px-2.5 py-1">Production</span>
  <span className="truncate">project-name</span>
  <code className="text-[#a1a1a1]">f269f37</code>
  <code className="truncate text-[#a1a1a1]">main</code>
  <time className="text-right text-[#a1a1a1]">11h ago</time>
  <Avatar />
</div>
```

### Editorial card

```tsx
<article className="flex min-h-[510px] flex-col bg-[#0a0a0a] p-8">
  <p className="text-sm text-[#a1a1a1]">30 June&nbsp;&nbsp; General</p>
  <h2 className="mt-7 max-w-[18ch] text-4xl font-normal leading-tight tracking-[-0.04em]">Run any Dockerfile on Vercel</h2>
  <div className="mt-auto space-y-7 text-[#a1a1a1]">...</div>
</article>
```

## Motion

- Use `120-180ms` color and border transitions.
- No card lift, spring bounce, parallax, or ornamental motion.
- Loading uses quiet skeleton slabs on `#111`.
- A hero glow may breathe almost imperceptibly; respect reduced motion.

## Responsive behavior

- Collapse the sidebar to a drawer or icon rail below desktop.
- Turn dashboard filter rows into horizontal overflow rather than wrapping unevenly.
- Hide lower-priority table columns progressively; keep title, status, project, and time.
- Marketing heroes stack text, visual, and support copy; preserve generous vertical space.
- Changelog grids move from three columns to one without shrinking headline type excessively.

## Anti-patterns

- Do not add visible graph-paper grids, plus marks, coordinate labels, or blueprint decoration. That is `black-grid`.
- Do not turn the style into a generic rounded-card SaaS dashboard.
- Do not use neon gradients, glassmorphism, heavy shadows, or multiple glows.
- Do not overuse mono or uppercase; current Vercel relies primarily on Geist Sans.
- Do not outline every marketing section. Empty black space is part of the system.
- Do not use blue as a general brand wash. Keep it semantic and sparse.
- Do not replace dense dashboard lists with oversized cards.

## Project overrides

If the repo defines `.agents/styles/vercel.md` or `.agents/styles/vercel-theme.md`, prefer those tokens and components over this portable spec.
