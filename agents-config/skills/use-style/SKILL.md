---
name: use-style
description: Apply named visual style guides to landing pages, app shells, and UI. Use for $use-style, /useskill, list styles, or styles like ios-app, grid, vercel, black-grid, stripe, linear, raycast, gumroad, dusk, or luma.
disable-model-invocation: true
user-invocable: true
---

Load a named style before designing or implementing UI. Parse the name from `$ARGUMENTS` or the message. Aliases: `ios`/`iphone`/`nowstack-mobile`/`ink & spark` → `ios-app`; `use-vercel`/`geist` → `vercel`; `old vercel`/`black grid` → `black-grid`; `testsprite`/`test sprite` → `testspirite`; `lu.ma`/`luma.com` → `luma`; `super simple`/`SUPER_SIMPLE` → `super-simple`.

Defaults: NowStack / Expo / NativeWind → `ios-app`. Codelynx product landings → `grid`. Vercel / Geist infrastructure marketing → `vercel`. Austere monochrome tools → `black-grid`. Linear / issue tracker shell → `linear`. Newspaper / magazine → `new-york-times`. Anthropic / Claude cream lab → `anthropic`. Neo-brutalist yellow/pink → `gumroad`. Glossy dark glow marketing → `raycast`. Attio twilight CRM → `dusk`. TestSprite paper dashboard → `testspirite`. Luma / events / RSVP → `luma`.

If the name is `list` or nothing matches, list the styles in `styles/` and stop until the user chooses.

1. Read `styles/<name>.md` from this skill directory.
2. Prefer project overrides: `.agents/styles/<name>.md`, `<name>-theme.md`, `<name>-theme-migration.md`.
3. Treat the loaded style as hard constraints. Reuse existing primitives (Codelynx: `GridTheme*` from `grid-theme-primitives.tsx`).

Match the vibe exactly. Honor the style file's anti-patterns. Scaffold the shell first on landing pages. `impeccable` is the polish pass after the style is applied.
