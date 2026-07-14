---
name: use-style
description: Apply named visual style guides to landing pages, app shells, and UI. Use for $use-style, /useskill, list styles, or styles like ios-app, grid, vercel, black-grid, stripe, linear, raycast, gumroad, dusk, or luma.
---

Load and apply a named style before designing or implementing any UI.

## Invocation

- Explicit: `$use-style ios-app`, `$use-style vercel`, `$use-style black-grid`, `/useskill list`, or "use the grid style"
- Implicit: user references NowStack Mobile, Ink & Spark, an iOS app shell, Expo / React Native / NativeWind app UI, `/aiblueprint`, `/agents`, `/aibuilder`, "grid theme", Vercel, Geist, a minimalist dark tool UI, Stripe / fintech / checkout / dashboard UI, Linear / issue tracker / app-shell sidebar UI, NYT / newspaper / editorial / broadsheet / magazine layouts, Anthropic / Claude / warm cream AI-lab pages, Gumroad / neo-brutalist / loud commerce / bold yellow-pink pages, Raycast / glossy dark / glow gradients / floating glass nav / premium product marketing, Dusk / Attio / dark CRM dashboard floating on a twilight backdrop / blue data viz / colorful category pills, Luma / lu.ma / event timeline / calendar / RSVP / discover / a dark consumer events-and-calendar app with photo-led cards, a top teal aurora, and a white pill button, or TestSprite / TestSpirite / calm light dev-tool dashboard / warm paper canvas with one forest-green accent / grouped sidebar + promo rail / isometric line-art empty states

Parse the style name from `$ARGUMENTS` or the message. Treat `ios`, `ios app`, `ios-app`, `iphone app`, `nowstack-mobile`, `nowstack mobile`, and `ink & spark` as `ios-app`. Treat `use-vercel`, `vercel style`, and `current vercel` as `vercel`. Treat `vercel-simple`, `old vercel`, `black grid`, and `black-grid` as `black-grid`. Treat `testsprite`, `test-sprite`, and `test sprite` as `testspirite`. Treat `luma`, `lu.ma`, and `luma.com` as `luma`. Treat `list`, `styles`, `available styles`, and missing style names with no implicit match as a request to list available styles and ask the user to choose before designing. Default to `ios-app` when the user references NowStack Mobile, Ink & Spark, an iOS app shell, Expo, React Native, NativeWind, or OS-native tabs. Default to `grid` for Codelynx product landings. Default to `vercel` when the user references Vercel, the Vercel dashboard, Geist, Vercel's changelog, or black infrastructure marketing with large editorial whitespace. Default to `black-grid` for austere monochrome developer tools, calculators, indexes, or line-driven data products. Default to `linear` when the user references Linear, an issue tracker, or a dense sidebar + list + detail app shell. Default to `new-york-times` when the user references a newspaper, broadsheet, magazine, or serif editorial layout. Default to `anthropic` when the user references Anthropic, Claude, or a warm cream + serif AI-lab aesthetic. Default to `gumroad` when the user references Gumroad, neo-brutalism, hard offset shadows, or a loud yellow/pink bordered look. Default to `raycast` when the user references Raycast, a glossy dark page with glow gradients, a floating glass nav, or premium dark product marketing. Default to `dusk` when the user references Attio, a dark CRM/data dashboard floating on a twilight/aurora backdrop, vivid-blue charts, or colorful category pills. Default to `testspirite` when the user references TestSprite, a calm light dev-tool dashboard, a warm paper canvas with a single forest-green accent, a grouped sidebar with a free-trial/upgrade promo rail, or isometric line-art empty states. Default to `luma` when the user references Luma, lu.ma, an event timeline/feed, a calendar or RSVP/invite app, a discover page, or a dark consumer events UI with photo-led cards, a top teal aurora, and a white pill button.

If the parsed style is `list`, or if no style can be inferred, do not load a style file. Reply with the available styles table below, add one short line asking which style to use, and stop until the user chooses.

## Workflow

1. Read `styles/<name>.md` from this skill directory.
2. Check for project overrides and prefer them over the portable spec:
   - `.agents/styles/<name>.md`
   - `.agents/styles/<name>-theme.md`
   - `.agents/styles/<name>-theme-migration.md` (migration playbooks only)
3. Treat the loaded style as hard constraints for layout, typography, color, borders, motion, and component choice.
4. Reuse existing primitives. In Codelynx repos, import `GridTheme*` components from `grid-theme-primitives.tsx` instead of reinventing patterns.

## Available styles

| Style | File | Vibe |
|-------|------|------|
| `ios-app` | `styles/ios-app.md` | NowStack Mobile Ink & Spark. iOS/Expo app UI with monochrome ink/paper, one yellow `#FFE040` spark, NativeWind tokens, OS-native tabs, flat hairline cards. |
| `grid` | `styles/grid.md` | Blueprint landing. Square geometry, 1px borders, mono data, condensed display type. |
| `vercel` | `styles/vercel.md` | Current Vercel product language. Black canvas, Geist Sans, hairline dashboard structure, dense deployment lists, vast editorial marketing space, restrained semantic color. |
| `black-grid` | `styles/black-grid.md` | Austere monochrome developer tools. Black canvas, Geist + mono, sharp line-defined indexes and calculators, no decoration. |
| `stripe` | `styles/stripe.md` | Stripe fintech UI. Pale `#f6f9fc` canvas, white cards on soft shadows, blurple `#635BFF` accent, green CTA, rounded geometry. |
| `linear` | `styles/linear.md` | Linear app shell. Near-black `#08090a` canvas, dense aligned sidebar + list + detail panes, indigo `#5e6ad2` accent, Inter Display headings, quiet line-defined chrome. |
| `new-york-times` | `styles/new-york-times.md` | Print-newspaper editorial. Paper-white, serif headlines (Cheltenham/Georgia), Franklin sans kickers, blackletter masthead, hairline rules, multi-column grid, red/blue accents only. |
| `anthropic` | `styles/anthropic.md` | Warm AI-lab. Cream `#f0efe9` paper, bold grotesque sans display + reading serif, clay-coral `#cc785c` accent, big soft-rounded dark panels, pill buttons. Light marketing + dark Claude app surfaces. |
| `gumroad` | `styles/gumroad.md` | Loud neo-brutalist commerce. Yellow `#ffc900` + pink `#ff90e8`, thick black borders, hard offset shadows `4px 4px 0 #000`, flat fills, bold geometric sans, pill buttons. Light marketplace + dark dashboard surfaces. |
| `raycast` | `styles/raycast.md` | Glossy dark product marketing. Near-black `#0a0a0a` + red `#ff6363` glow, floating glass nav (`backdrop-blur`), oversized bold pricing, large-radius `rounded-3xl` cards, soft glow over hard shadows. |
| `dusk` | `styles/dusk.md` | Refined dark data app (Attio-style). Rounded near-black window floating on a twilight gradient backdrop, vivid sky-blue `#38bdf8` charts, `#3b6eff` primary, colorful category pills, Inter + mono numbers. |
| `luma` | `styles/luma.md` | Dark consumer events + calendar app (Luma/lu.ma). Near-black `#0a0a0b` canvas with one soft teal aurora at the top, near-borderless `rounded-2xl` photo-led cards, white pill primary buttons, blue `#2f6bff` status pills, gold `#f5b13d` event times, centered timeline column. |
| `testspirite` | `styles/testspirite.md` | Calm light dev-tool app shell (TestSprite). Warm paper-white `#f7f7f3` canvas, one forest-green `#3d7c4e` accent, grouped sidebar + promo rail, soft `rounded-xl` cards on quiet borders, pale-green `#eaf3ea` status pills, isometric line-art empty states. |

Add new styles as `styles/<name>.md` and register them here.

## Output rules

- Match the style vibe precisely. Do not blend with generic SaaS aesthetics.
- Honor the anti-patterns section in the style file.
- When a project spec lists concrete tokens or components, use those over prose approximations.
- For landing pages, scaffold the page shell from the style first, then fill sections.

## Related skills

- `frontend-design` / `frontend-skill`: general UI craft. Defer to `use-style` when a named style is requested.
- `use-feature`: reusable feature and UX implementation patterns that are not visual styles.
- `impeccable`: polish pass after the style is applied.
