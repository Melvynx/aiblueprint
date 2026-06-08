# Dusk Style

Refined dark data app floating on a dreamy dusk backdrop. Premium CRM dashboard: a rounded near-black window over a twilight sky, vivid blue data viz, colorful category pills, clean Inter. Calm, expensive, data-rich.

**Reference vibe:** Attio (CRM dashboards, reports, company database, inbox).

---

## Core vibe

- **A window, not a page.** The app is a large rounded-corner dark container that *floats* on a photographic dusk/aurora backdrop (twilight gradient + faint stars). Margin of backdrop shows around it.
- **Near-black, layered.** Inside the window: very dark panels with quiet borders. Depth from subtle elevation and the backdrop, not heavy shadows.
- **Vivid blue data.** Bar charts and key accents in a bright sky-blue `#38bdf8`; the primary action button is a saturated blue `#3b6eff`.
- **Colorful data pills.** Category tags carry their own hue (orange, green, blue, purple, pink, teal) as tinted text + border - the one place color runs free.
- **Clean Inter, mono for numbers.** Sans for everything; mono for deltas, `last 30 days`, IDs, tabular figures.
- **Dense but airy.** Sidebar + main app shell, KPI strip, 2-col panel grid. Comfortable spacing, large radius, refined.

---

## Color

Portable palette. Map to project tokens when available.

| Role | Hex | CSS var (suggested) | Usage |
|------|-----|---------------------|-------|
| Window canvas | `#0c0c0e` | `--dk-bg` | App container background |
| Panel | `#151517` | `--dk-panel` | Cards, report panels |
| Panel raised | `#1c1c1f` | `--dk-raised` | Hover, inputs, KPI strip |
| Sidebar | `#0e0e10` | `--dk-rail` | Left navigation |
| Ink | `#f4f4f5` | `--dk-fg` | Headings, primary values |
| Muted ink | `#8a8a90` | `--dk-muted-fg` | Labels, inactive nav, captions |
| Subtle ink | `#5c5c62` | `--dk-subtle-fg` | Meta, placeholders |
| Border | `#232325` | `--dk-border` | Panel borders, dividers |
| Border soft | `rgba(255,255,255,0.06)` | `--dk-border-soft` | Inner hairlines |
| Primary | `#3b6eff` | `--dk-primary` | Primary button, active state, links |
| Data blue | `#38bdf8` | `--dk-data` | Bar charts, the signature data color |
| Positive | `#36c98d` | `--dk-pos` | Up deltas, owned tags |
| Negative | `#f76d6d` | `--dk-neg` | Down deltas |

### Category pill palette (tinted text + border, transparent fill)

| Hue | Hex |
|-----|-----|
| Orange | `#f5933b` |
| Green | `#36c98d` |
| Blue | `#5b9dff` |
| Purple | `#a78bfa` |
| Pink | `#f472b6` |
| Teal | `#2dd4bf` |
| Yellow | `#facc15` |

### The dusk backdrop

Behind the floating window: a twilight gradient (deep navy at top → warm horizon at bottom), optionally a faint starfield. Keep it soft and blurred so the UI stays readable.

```css
background:
  radial-gradient(120% 80% at 50% 0%, #16223f 0%, #20284a 35%, #4a3a5e 70%, #8a5a4e 100%);
/* faint stars: tiny white radial-gradients at low opacity, top third only */
```

### Tailwind mapping (when no project tokens)

```css
:root {
  --dk-bg:#0c0c0e; --dk-panel:#151517; --dk-rail:#0e0e10;
  --dk-fg:#f4f4f5; --dk-muted-fg:#8a8a90; --dk-border:#232325;
  --dk-primary:#3b6eff; --dk-data:#38bdf8;
}
```

**Rule:** The UI stays near-monochrome dark; vivid blue is the data + action color, and category pills are the only multi-hue element. The dusk backdrop supplies the warmth.

---

## Typography

### Font stacks

| Role | Stack |
|------|-------|
| Sans (everything) | `Inter, "SF Pro Text", ui-sans-serif, system-ui, sans-serif` |
| Mono (numbers, deltas, IDs) | `"Geist Mono", "Berkeley Mono", ui-monospace, SFMono-Regular, monospace` |

### Scale

| Level | Pattern |
|-------|---------|
| Page / report title | `text-2xl md:text-3xl font-semibold tracking-tight text-[#f4f4f5]` |
| KPI / metric value | `text-3xl md:text-4xl font-semibold tabular-nums text-[#f4f4f5]` |
| Panel title | `text-sm font-medium text-[#8a8a90]` |
| Body | `text-sm md:text-[15px] text-[#c8c8cc]` |
| Section label (sidebar) | `text-xs font-medium text-[#5c5c62]` (General, Favorites, Searches) |
| Nav item | `text-sm text-[#c8c8cc]` |
| Delta / meta | `font-mono text-xs` (`last 30 days`, `+25%`, `12.5%`) |

Deltas and `last 30 days` are mono; the percentage is colored (`#36c98d` up / `#f76d6d` down). Big numbers use `tabular-nums`.

---

## Layout tokens

| Token | Value |
|-------|-------|
| `DK_BACKDROP` | the dusk gradient on `body`, with `padding` so the window floats |
| `DK_WINDOW` | `rounded-2xl border border-[#232325] bg-[#0c0c0e] overflow-hidden` |
| `DK_SHELL` | sidebar `w-64` + `main flex-1` |
| `DK_SECTION` | `p-6 md:p-8` |
| `DK_PANEL` | `rounded-xl border border-[#232325] bg-[#151517] p-5` |
| `DK_GAP` | `gap-5` |

### Floating window shell

```tsx
<div className="min-h-screen p-4 md:p-8" style={{background:"radial-gradient(120% 80% at 50% 0%,#16223f,#20284a 35%,#4a3a5e 70%,#8a5a4e)"}}>
  <div className="mx-auto flex max-w-[1400px] overflow-hidden rounded-2xl border border-[#232325] bg-[#0c0c0e]">
    <aside className="w-64 shrink-0 border-r border-[#232325] bg-[#0e0e10] p-3">{nav}</aside>
    <main className="flex-1 min-w-0">
      <header className="flex items-center justify-between border-b border-[#232325] px-6 py-3">{breadcrumb + actions}</header>
      <div className="p-6 md:p-8">{content}</div>
    </main>
  </div>
</div>
```

---

## Component patterns

### Sidebar nav

Sections (`General`, `Favorites`, `Searches`) as tiny muted labels, items as icon + label, optional count badge, tiny colored favicon for entities.

```tsx
<a className={cn(
  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
  active ? "bg-[#1c1c1f] text-[#f4f4f5]" : "text-[#c8c8cc] hover:bg-[#1c1c1f]"
)}>
  <Icon className="size-4 text-[#8a8a90]" />
  <span className="flex-1 truncate">Report</span>
  <span className="font-mono text-xs text-[#5c5c62]">99+</span>
</a>
```

### KPI strip

A bordered row split into equal cells (provider icon + name, big number, `last 30 days` + colored delta).

```tsx
<div className="grid grid-cols-2 divide-x divide-[#232325] rounded-xl border border-[#232325] bg-[#151517] md:grid-cols-4">
  <div className="p-5">
    <p className="flex items-center gap-2 text-sm text-[#8a8a90]"><Icon/> ChatGPT</p>
    <p className="mt-3 text-4xl font-semibold tabular-nums">213</p>
    <p class="mt-4 flex items-center justify-between font-mono text-xs">
      <span className="text-[#5c5c62]">last 30 days</span>
      <span className="text-[#f76d6d]">12.5%</span>
    </p>
  </div>
</div>
```

### Report panel

```tsx
<div className="rounded-xl border border-[#232325] bg-[#151517] p-5">
  <p className="text-sm text-[#8a8a90]">Unique Visitors</p>
  <p className="mt-1 text-3xl font-semibold tabular-nums">8,451</p>
  <p className="mt-1 font-mono text-xs"><span className="text-[#36c98d]">12.5%</span> <span className="text-[#5c5c62]">last 30 days</span></p>
  <div className="mt-4 h-64"><canvas/></div>
</div>
```

### Segmented rank bar

A single rounded track split into vivid colored segments, with a dotted legend below.

```tsx
<div className="flex gap-1.5">
  <span className="h-2 rounded-full bg-[#38bdf8]" style={{flex:9.4}} />
  <span className="h-2 rounded-full bg-[#f5933b]" style={{flex:7.8}} />
  <span className="h-2 rounded-full bg-[#facc15]" style={{flex:6.4}} />
  <span className="h-2 rounded-full bg-[#2dd4bf]" style={{flex:3.2}} />
  <span className="h-2 rounded-full bg-[#36c98d]" style={{flex:1.7}} />
</div>
```

### Category pill

Each category owns a hue: colored text + matching border + transparent fill.

```tsx
<span className="inline-flex rounded-md border border-[#f5933b]/40 px-2 py-0.5 text-xs font-medium text-[#f5933b]">
  Project Management
</span>
```

### Owned / status tag

```tsx
<span className="rounded-md border border-[#36c98d]/40 px-1.5 py-0.5 text-[11px] font-medium text-[#36c98d]">Owned</span>
```

### Buttons

| Variant | Classes |
|---------|---------|
| Primary | `rounded-lg bg-[#3b6eff] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#3361f0]` |
| Secondary | `rounded-lg border border-[#232325] bg-[#151517] px-3.5 py-2 text-sm text-[#f4f4f5] hover:bg-[#1c1c1f]` |
| Ask (AI) | secondary + a leading spark `✳` in `#8a8a90`, e.g. `Ask about this "Report"` |

### Data table

```tsx
<div className="grid grid-cols-[1fr_auto_auto] gap-y-3 text-sm">
  <span className="flex items-center gap-2"><Icon/> Ace <OwnedTag/></span>
  <span className="text-right font-mono tabular-nums text-[#c8c8cc]">9.4%</span>
  <span className="text-right font-mono tabular-nums text-[#f4f4f5]">212</span>
</div>
```

---

## Charts (vivid data viz)

- **Bars in sky-blue `#38bdf8`** - the signature. Rounded tops (`borderRadius:6`), flat fill. Many thin bars for time series (30-day) is on-brand.
- Line charts: thin teal/green `#36c98d` or `#38bdf8`, no fill, smooth.
- Multi-series / rank: the category palette (blue, orange, yellow, teal, green).
- Background = panel `#151517`; gridlines off or very faint `#232325`; axis text mono, muted `#5c5c62`.
- Tooltip: `#1c1c1f` bg, `#232325` border, white text, `10px` corners.

```js
const DATA="#38bdf8", POS="#36c98d", GRID="#232325";
const CATS=["#5b9dff","#f5933b","#facc15","#2dd4bf","#36c98d","#a78bfa"];
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.color = "#5c5c62";
// bars: backgroundColor:DATA, borderRadius:6
// grid: { color: GRID } or display:false
// tooltip: { backgroundColor:"#1c1c1f", borderColor:"#232325", borderWidth:1, cornerRadius:10 }
```

---

## Motion & effects

- Calm. Hover = panel/row bg lift to `#1c1c1f`, border to softer white. No bounce.
- The floating window may cast one soft ambient shadow onto the backdrop (`0 30px 80px -30px rgba(0,0,0,.6)`).
- `transition-colors duration-150`. Charts animate in gently.
- No neon glow (that's raycast), no hard offset shadow (that's gumroad), no gradient on the UI chrome - the gradient lives in the backdrop only.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Flat dark filling the whole viewport edge-to-edge | The app is a rounded window floating on the dusk backdrop |
| Monochrome category tags | Category pills are intentionally multi-hue |
| Red glow / neon | That's raycast; dusk is calm with vivid-blue data |
| Hard offset shadows | That's gumroad; use soft ambient depth |
| Gradient on buttons/panels | Gradient belongs to the backdrop only; chrome stays flat dark |
| Serif type | Inter sans throughout; mono for numbers |
| Pure white `#fff` text | Use `#f4f4f5` warm-white on the dark panels |
| Bars in muted gray | The signature is bright sky-blue `#38bdf8` |

---

## Project overrides

If the repo defines `.agents/styles/dusk.md` or `.agents/styles/dusk-theme.md`, prefer those tokens and components over this portable spec.
