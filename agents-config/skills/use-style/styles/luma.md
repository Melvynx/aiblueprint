# Luma Style

Polished consumer event + calendar app. Pure-black canvas with one soft teal aurora at the very top, near-borderless rounded dark cards, photo-led event covers, white pill buttons, a single blue status accent, and gold event-time labels. Friendly, premium, social.

**Reference vibe:** Luma (lu.ma) - events timeline, calendars, discover, account settings.

---

## Core vibe

- **Black, not gray-dark.** The canvas is near-pure black `#0a0a0b`. Cards lift one subtle step (`#161618`) with whisper-thin `rgba(255,255,255,.08)` borders. Depth comes from fill steps, not shadows.
- **One aurora, top only.** A soft desaturated teal/blue glow washes the top ~30% of the page, fading to black. The rest of the UI is flat black. Nowhere else gets a gradient.
- **White pill primary button.** The signature CTA is a solid white button with near-black text (`Save Changes`, `Next`, `Enable 2FA`). Secondary actions are quiet dark-gray fills. This white-on-black button is the most recognizable Luma element.
- **Photo-led.** Event cover images (square-ish, `rounded-xl`) carry the visual weight of every list row and calendar card. Design assuming rich imagery on the right of each card.
- **Two chromatic accents, used sparingly.** A medium blue `#2f6bff` for status pills (`Invited`), links, and the active timeline dot; a warm gold `#f5b13d` for event start-times. Everything else is monochrome.
- **Big, friendly, rounded.** Large radii (`rounded-2xl` cards, `rounded-full` pills/avatars/toggles), bold tight-tracked headings, generous spacing. Geometric-humanist sans, never sharp or corporate.
- **Timeline as spine.** The events feed is a left date-rail (`Jun 22 / Monday`) + a dot + a dotted vertical connector + the card. This timeline is the core layout primitive.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Canvas | `#0a0a0b` | `--lu-bg` | Page background (near-black) |
| Surface | `#161618` | `--lu-surface` | Cards, event rows, inputs, panels |
| Surface raised | `#202024` | `--lu-raised` | Hover, secondary buttons, segmented track |
| Surface high | `#2a2a2e` | `--lu-high` | Active segment, input prefix box |
| Ink | `#f7f7f8` | `--lu-fg` | Headings, titles, primary values |
| Body | `#c6c6cb` | `--lu-body` | Body copy, host names |
| Muted ink | `#8c8c93` | `--lu-muted-fg` | Labels, dates, captions, inactive nav |
| Subtle ink | `#5e5e65` | `--lu-subtle-fg` | Meta, placeholders, faint icons |
| Border | `rgba(255,255,255,0.08)` | `--lu-border` | Card outlines, dividers, inputs |
| Border soft | `rgba(255,255,255,0.05)` | `--lu-border-soft` | Inner hairlines, timeline connector |
| White button | `#ffffff` | `--lu-white` | Primary CTA fill |
| White button ink | `#0a0a0a` | `--lu-white-fg` | Text on the white button |
| Blue | `#2f6bff` | `--lu-blue` | Status pill (`Invited`), links, active dot |
| Gold | `#f5b13d` | `--lu-gold` | Event start-time label |
| Positive | `#3ecf8e` | `--lu-pos` | Going / confirmed status |
| Error | `#f76d6d` | `--lu-error` | Destructive, declined |

### The top aurora

A soft teal-blue radial glow at the top edge that fades to black. Keep it low-saturation and short - it is ambient, not a hero gradient.

```css
background:
  radial-gradient(90% 32% at 50% 0%,
    rgba(40, 82, 96, 0.55) 0%,
    rgba(22, 44, 54, 0.18) 45%,
    transparent 72%),
  #0a0a0b;
background-attachment: fixed;
```

### Tailwind mapping (when no project tokens)

```css
:root {
  --lu-bg:#0a0a0b; --lu-surface:#161618; --lu-raised:#202024; --lu-high:#2a2a2e;
  --lu-fg:#f7f7f8; --lu-body:#c6c6cb; --lu-muted-fg:#8c8c93; --lu-subtle-fg:#5e5e65;
  --lu-border:rgba(255,255,255,.08);
  --lu-blue:#2f6bff; --lu-gold:#f5b13d;
}
```

| Tailwind | Value |
|----------|-------|
| `bg-[#0a0a0b]` | Canvas |
| `bg-[#161618]` | Card / surface |
| `bg-[#202024]` | Hover / secondary button |
| `text-[#f7f7f8]` | Primary ink |
| `text-[#8c8c93]` | Muted |
| `border-white/[0.08]` | Structure |
| `bg-white text-[#0a0a0a]` | Primary CTA |
| `text-[#2f6bff]` | Blue accent / link |
| `text-[#f5b13d]` | Event-time gold |

**Rule:** Keep 95% of the UI monochrome on black. Blue is for status + links, gold is for event times, white fill is for the one primary button. Never introduce a third UI accent hue (multi-color belongs only to real cover photos).

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (everything) | `"Inter", "SF Pro Display", ui-sans-serif, system-ui, -apple-system, sans-serif` |
| Mono (rare: IDs, codes) | `"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace` |

Luma's face reads as a friendly geometric-humanist sans. Inter (or SF Pro Display) is the portable match. No serif anywhere. Numbers/dates use `tabular-nums`.

### Scale

| Level | Pattern |
|-------|---------|
| Page title (`Events`, `Settings`) | `text-3xl md:text-4xl font-bold tracking-tight text-[#f7f7f8]` |
| Section heading (`Your Profile`, `Following`) | `text-lg md:text-xl font-semibold text-[#f7f7f8]` |
| Event / card title | `text-lg md:text-xl font-semibold tracking-tight text-[#f7f7f8]` |
| Timeline date | `text-base font-semibold text-[#f7f7f8]` + `text-sm text-[#8c8c93]` (weekday) |
| Host / body | `text-sm md:text-[15px] text-[#c6c6cb]` |
| Event time (lead) | `text-sm text-[#8c8c93]` then `· ` then `text-sm font-medium text-[#f5b13d]` |
| Label / meta / location | `text-sm text-[#8c8c93]` |
| Field label | `text-[13px] font-medium text-[#8c8c93]` |

### Weight & tracking

- Page + card titles: `font-bold`/`font-semibold` (600-700), `tracking-tight`.
- Body, hosts, labels: `font-normal`/`font-medium`, sentence case.
- No uppercase letter-spaced labels (that's grid/linear). Luma labels are sentence-case muted gray.

---

## Layout tokens

| Token | Value |
|-------|-------|
| `LU_PAGE` | the top-aurora background on `body`; content `max-w-[860px] mx-auto px-4 md:px-6` |
| `LU_NAV` | `flex items-center gap-6 py-4` (icon + label tabs, top of page) |
| `LU_CARD` | `rounded-2xl border border-white/[0.08] bg-[#161618] p-4 md:p-5` |
| `LU_ROW` | timeline row: `grid grid-cols-[112px_1fr] gap-4` (date rail + card) |
| `LU_GAP` | `space-y-3` within a day, `space-y-10` between days |
| `LU_THUMB` | `size-24 md:size-28 rounded-xl object-cover` (event cover) |
| `LU_PILL` | `rounded-full px-2.5 py-1 text-xs font-medium` |

### Page shell

Centered single column (Luma is not a sidebar app). Icon nav on top, big title, optional segmented toggle on the right, then the timeline/content.

```tsx
<body className="min-h-screen text-[#f7f7f8]"
  style={{background:"radial-gradient(90% 32% at 50% 0%, rgba(40,82,96,.55), rgba(22,44,54,.18) 45%, transparent 72%), #0a0a0b"}}>
  <header className="mx-auto max-w-[860px] px-4 md:px-6">
    <nav className="flex items-center gap-6 py-4 text-sm">
      <a className="flex items-center gap-2 font-medium text-[#f7f7f8]"><Ticket className="size-4"/> Events</a>
      <a className="flex items-center gap-2 text-[#8c8c93] hover:text-[#f7f7f8]"><Calendar className="size-4"/> Calendars</a>
      <a className="flex items-center gap-2 text-[#8c8c93] hover:text-[#f7f7f8]"><Compass className="size-4"/> Discover</a>
    </nav>
  </header>
  <main className="mx-auto max-w-[860px] px-4 md:px-6 py-6">
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Events</h1>
      <SegmentedToggle />
    </div>
    {timeline}
  </main>
</body>
```

---

## Component patterns

### Top nav tab

Line icon + label. Active = white; inactive = muted, brightens on hover. No underline, no pill.

```tsx
<a className={cn("flex items-center gap-2 text-sm",
  active ? "font-medium text-[#f7f7f8]" : "text-[#8c8c93] hover:text-[#f7f7f8]")}>
  <Ticket className="size-4" /> Events
</a>
```

### Segmented toggle (`Upcoming` / `Past`)

A rounded-full dark track; the active segment is a lighter fill.

```tsx
<div className="inline-flex rounded-full bg-[#202024] p-0.5 text-sm">
  <button className="rounded-full bg-[#2a2a2e] px-4 py-1.5 font-medium text-[#f7f7f8]">Upcoming</button>
  <button className="rounded-full px-4 py-1.5 text-[#8c8c93] hover:text-[#f7f7f8]">Past</button>
</div>
```

### Timeline row (the signature)

Left date-rail with a dot + dotted vertical connector; right is the event card.

```tsx
<div className="grid grid-cols-[112px_1fr] gap-4">
  <div className="relative pt-1">
    <p className="text-base font-semibold leading-tight">Jun 22</p>
    <p className="text-sm text-[#8c8c93]">Monday</p>
    {/* dot + dotted connector */}
    <span className="absolute -right-[10px] top-2 size-2.5 rounded-full bg-[#2f6bff] ring-4 ring-[#0a0a0b]" />
    <span className="absolute -right-[5px] top-5 bottom-[-40px] border-l border-dashed border-white/15" />
  </div>
  <EventCard />
</div>
```

### Event card

Time row (muted lead `·` gold start), title, host (avatar + name), location (pin), footer (status pill + avatar stack), cover image on the right.

```tsx
<article className="rounded-2xl border border-white/[0.08] bg-[#161618] p-4 md:p-5">
  <div className="flex gap-4">
    <div className="min-w-0 flex-1">
      <p className="text-sm text-[#8c8c93]">
        3:30 AM <span className="mx-1">·</span>
        <span className="font-medium text-[#f5b13d]">Jun 21, 6:30 PM PDT</span>
      </p>
      <h3 className="mt-1.5 text-lg md:text-xl font-semibold tracking-tight">Founder DJ Party</h3>
      <p className="mt-2 flex items-center gap-2 text-sm text-[#c6c6cb]">
        <img className="size-5 rounded-full" /> By Founders on Tap
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#8c8c93]">
        <MapPin className="size-4" /> San Francisco, United States
      </p>
      <div className="mt-3 flex items-center gap-2">
        <StatusPill>Invited</StatusPill>
        <AvatarStack count={132} />
      </div>
    </div>
    <img className="size-24 md:size-28 shrink-0 rounded-xl object-cover" />
  </div>
</article>
```

### Status pill (`Invited`)

The one blue chip. Variants reuse `pos`/`error`/muted on the same shape.

```tsx
<span className="rounded-full bg-[#2f6bff] px-2.5 py-1 text-xs font-medium text-white">Invited</span>
// going:   bg-[#3ecf8e]/15 text-[#3ecf8e]
// pending: bg-[#202024] text-[#8c8c93]
```

### Avatar stack + overflow count

Overlapping round avatars (ringed in the canvas color) ending in a `+N` chip.

```tsx
<div className="flex items-center">
  <div className="flex -space-x-2">
    {avatars.map(a => <img className="size-6 rounded-full ring-2 ring-[#0a0a0b]" />)}
  </div>
  <span className="ml-2 rounded-full bg-[#202024] px-2 py-0.5 text-xs text-[#8c8c93]">+132</span>
</div>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary (white pill) | `rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90` |
| Secondary (dark) | `rounded-full bg-[#202024] px-4 py-2 text-sm font-medium text-[#f7f7f8] hover:bg-[#2a2a2e]` |
| Ghost / icon | `rounded-full p-2 text-[#8c8c93] hover:bg-[#202024] hover:text-[#f7f7f8]` |
| Link | `text-sm font-medium text-[#2f6bff] hover:opacity-90` |
| Calendar action | secondary + trailing `→`, e.g. `View Calendar →` |

Primary buttons often carry a small leading glyph (sparkle/sign icon), matching Luma's `Save Changes`.

### Calendar / following card

Rounded app-icon, name, `View Calendar →`, then an upcoming-events list (title + date).

```tsx
<div className="flex gap-4 rounded-2xl border border-white/[0.08] bg-[#161618] p-4">
  <div className="w-44 shrink-0">
    <img className="size-12 rounded-xl" />
    <p className="mt-2 font-semibold leading-tight">Bond AI - SF & Bay Area</p>
    <button className="mt-2 rounded-full bg-[#202024] px-3 py-1.5 text-xs text-[#f7f7f8] hover:bg-[#2a2a2e]">View Calendar →</button>
  </div>
  <div className="min-w-0 flex-1 space-y-3">
    <p className="text-xs text-[#8c8c93]">Upcoming Events</p>
    <div>
      <p className="text-sm font-medium">HUD Frontier / RSI RL Hackathon</p>
      <p className="text-xs tabular-nums text-[#8c8c93]">Sat, Jun 20, 11:00 AM</p>
    </div>
  </div>
</div>
```

### Field label + input

Label sits *above* a dark rounded input. Sentence-case, muted.

```tsx
<label className="block">
  <span className="mb-1.5 block text-[13px] font-medium text-[#8c8c93]">First Name</span>
  <input className="w-full rounded-xl border border-white/[0.08] bg-[#161618] px-3.5 py-2.5 text-sm text-[#f7f7f8] placeholder:text-[#5e5e65] focus:border-[#2f6bff]/60 focus:outline-none focus:ring-2 focus:ring-[#2f6bff]/20" />
</label>
```

### Prefix-segmented input

A high-fill prefix box (`@`, `instagram.com/`) fused to the input - Luma's social-links pattern.

```tsx
<div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618]">
  <span className="grid place-items-center bg-[#2a2a2e] px-3 text-sm text-[#8c8c93]">instagram.com/</span>
  <input className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#f7f7f8] focus:outline-none" placeholder="username" />
</div>
```

### Settings row (label + desc + action)

Bordered row: icon + title + sub on the left, white/secondary action button on the right. Used for `Password & Security`, `Emails`.

```tsx
<div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#161618] p-4">
  <div className="flex items-start gap-3">
    <Lock className="mt-0.5 size-4 text-[#8c8c93]" />
    <div>
      <p className="text-sm font-semibold text-[#f7f7f8]">Account Password</p>
      <p className="text-sm text-[#8c8c93]">You have not set up a password.</p>
    </div>
  </div>
  <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a] hover:opacity-90">Set Password</button>
</div>
```

### Underline tabs (`Account` / `Preferences` / `Payment`)

Active tab = white ink + a short bottom bar; inactive = muted.

```tsx
<div className="flex gap-6 border-b border-white/[0.08] text-sm">
  <button className="relative pb-3 font-medium text-[#f7f7f8]">
    Account <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#f7f7f8]" />
  </button>
  <button className="pb-3 text-[#8c8c93] hover:text-[#f7f7f8]">Preferences</button>
</div>
```

### Onboarding / welcome card

Icon thumb + title + description, page dots bottom-left, white `Next` button bottom-right.

```tsx
<div className="flex items-center gap-5 rounded-2xl border border-white/[0.08] bg-[#161618] p-5">
  <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#202024]"><CalendarIcon /></div>
  <div className="flex-1">
    <p className="text-lg font-semibold">Welcome to Luma Calendar</p>
    <p className="mt-1 text-sm text-[#8c8c93]">Easily share and manage your events.</p>
    <div className="mt-4 flex items-center justify-between">
      <div className="flex gap-1.5">{dots}</div>
      <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0a0a0a]">Next</button>
    </div>
  </div>
</div>
```

### Empty state

Quiet centered glyph + title + one muted sub line; no illustration weight.

```tsx
<div className="rounded-2xl border border-white/[0.08] bg-[#161618] p-6 text-center">
  <p className="text-sm font-semibold text-[#f7f7f8]">No Calendars</p>
  <p className="mt-1 text-sm text-[#8c8c93]">You are not an admin of any calendars.</p>
</div>
```

---

## Borders, radius & elevation

| Context | Radius | Border | Fill |
|---------|--------|--------|------|
| Card / event row / panel | `rounded-2xl` (16px) | `border-white/[0.08]` | `#161618` |
| Input / settings row | `rounded-xl` (12px) | `border-white/[0.08]` | `#161618` |
| Button / pill / toggle / avatar | `rounded-full` | none (white/dark fill) | white or `#202024` |
| Event cover image | `rounded-xl` (12px) | none | photo |
| App-icon thumb | `rounded-xl` (12px) | none | image / `#202024` |

No drop shadows on cards - elevation is the fill step from `#0a0a0b` → `#161618` plus the hairline border. The top aurora is the only ambient light.

---

## Motion & effects

- **Calm and quick.** `transition-colors`/`transition-opacity duration-150`. Hover = fill lift (`#202024` → `#2a2a2e`), muted text → white, white button → `opacity-90`.
- Focus: 2px blue ring `ring-[#2f6bff]/20` + blue-tinted border on inputs.
- No neon glow (raycast), no hard offset shadow (gumroad), no floating-window backdrop (dusk). The aurora is a flat top wash, not animated.
- Cards/rows may fade-slide in on load; no scale-bounce.

---

## When to use

| Surface | Fit |
|---------|-----|
| Event feed / timeline, calendar list, discover | Strong fit |
| Account / settings, profile, billing forms | Strong fit |
| Onboarding cards, RSVP / invite surfaces | Strong fit |
| Consumer social/community product (dark) | Strong fit |
| Dense analytics dashboard (KPIs, charts) | Poor fit - use `dusk` |
| 3-pane issue tracker | Use `linear` |
| Marketing hero / landing page | Use `raycast`, `grid`, or `vercel-simple` |

Luma is for **dark consumer event/calendar/account app shells** built around a centered column and photo-led cards.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Mid-gray `#111`/`#18181b` canvas | Luma's canvas is near-pure black `#0a0a0b`; cards are the lighter step |
| Gradient on cards or buttons | The only gradient is the top aurora; chrome stays flat |
| Colored primary buttons | The primary CTA is a white pill with near-black text |
| Heavy `shadow-lg` elevation | Depth is the fill step + hairline border, never drop shadows |
| Sharp `rounded-none` / small radius | The look is large, friendly radius (16px cards, full pills) |
| A third UI accent hue | Only blue (status/links) + gold (times); other color is real cover photos |
| Uppercase letter-spaced labels | Luma labels are sentence-case muted gray |
| Sidebar app shell | Luma is a centered single column, not a sidebar layout |
| Text-only event rows | Every event/calendar row is anchored by a cover image |
| Serif type | Inter / geometric-humanist sans throughout |

---

## Project overrides

If the repo defines `.agents/styles/luma.md` or `.agents/styles/luma-theme.md`, prefer those tokens and components over this portable spec.
