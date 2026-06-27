---
name: app-icon
description: Generate a premium, vibrant, dimensional iOS + Android app icon for an Expo / React Native app with AI image generation, then post-process it to App Store / Play specs. Use for "create my app icon", "generate the iOS icon", "redo the app logo", "make the launcher icon". Works with ANY image-generation tool (Codex `image_gen`, `gemini-cli` Nano Banana, gpt-image, …).
argument-hint: "[app concept or brand]"
---

# App Icon

Generate a store-quality launcher icon (iOS App Store icon + Android adaptive icon + web favicon) for an Expo / React Native app, then post-process it to meet store requirements.

<aesthetic_target>
The target is a **premium, vibrant, dimensional** icon like top App Store featured apps — NOT a flat pictogram. See `references/` for the north star:

- `references/example-character-mascot.webp` — what this recipe produces for a character app (glossy 3D mascot + heart, full-bleed warm gradient).
- `references/example-symbol-object.webp` — what it produces for a symbol / monochrome brand (glossy 3D spark on a deep ink background — proof a one-color brand still gets a dimensional icon, not a flat glyph).
- `references/inspiration-premium-icons.webp` — external inspiration (soft glossy blob mascot on a vivid gradient tile).

The look every time: **one dimensional hero** (a soft glossy 3D character/mascot, or a bold symbolic object/abstract form) with smooth gradients, soft studio lighting, gentle rim light and a subtle glow, **centered on a full-bleed vivid branded background** that reaches all four edges. Saturated, high-contrast, polished, delightful.

**The #1 failure to avoid:** a flat monochrome pictogram / black-on-white glyph / line icon on a plain white background. If the output looks like an SVG symbol, it is wrong — regenerate.
</aesthetic_target>

<capability_gate>
**Use ANY image-generation tool you have.** Generate the icon yourself; do not just hand the prompt back if you can run a tool.

- **Codex** → the built-in **`image_gen`** tool. Generate, then copy the file into the repo.
- **`gemini-cli` available** (the api2cli CLI — `gemini-cli image generate`) → use it directly; it is excellent for icons (exact command in `<generation_loop>`). One-time auth: `gemini-cli auth set <GOOGLE_API_KEY>`. (Install: `npx api2cli bundle gemini && npx api2cli link gemini`.)
- **Any other raster image tool** (gpt-image, an MCP image tool, Imagen, etc.) → use it with the prompt from `<icon_recipe>`.
- **Truly no image tool reachable** → do NOT fake it (no SVG-to-PNG pipelines — that produces flat, amateur results). Build the final prompt from `<icon_recipe>`, give it to the user to run, then resume at `<post_processing>` with the file they provide.
</capability_gate>

<locate_assets>
Find where this app's icon actually lives before writing anything. Read the Expo config (`app.json`, `app.config.js`, or `app.config.ts`) and use the real paths:

- iOS icon → `expo.icon` (commonly `./assets/icon.png` or `./assets/images/icon.png`)
- Android adaptive icon foreground → `expo.android.adaptiveIcon.foregroundImage` (commonly `./assets/adaptive-icon.png`)
- Android adaptive background color → `expo.android.adaptiveIcon.backgroundColor`
- Web favicon → `expo.web.favicon` (commonly `./assets/favicon.png`)

In a monorepo the app may live under `mobile-app/` or `apps/<name>/` — resolve paths relative to the Expo project root. Below, `<ASSETS>` means that app's resolved assets directory. Pull **brand colors** and **app concept/name** from the project (a brand/site config, the README, or ask the user). Use color *names* in the prompt, never hex.
</locate_assets>

<objective>
| Asset | Target file (typical) | Spec |
| --- | --- | --- |
| iOS app icon | `<ASSETS>/icon.png` | 1024x1024, square, **NO transparency**, **no baked rounded mask** (iOS applies its own) |
| Android adaptive icon | `<ASSETS>/adaptive-icon.png` | foreground layer, subject inside the central ~66% safe circle, padded |
| Web favicon | `<ASSETS>/favicon.png` | 192x192 derived from the icon |
</objective>

<icon_recipe>
Fill the two project blanks — **Subject** (the product's concept/mascot/symbol) and the **Color palette** (named brand colors, never hex) — then send the whole block as ONE prompt to your image tool.

```
Create a 1024x1024 square app icon — premium, vibrant and dimensional, in the style of top App Store featured apps.

Subject: <single hero for <AppName> — a friendly soft 3D character/mascot with simple dot eyes, OR a bold symbolic object/abstract form; instantly readable at small sizes>

The look (north star): one dimensional hero rendered in soft glossy 3D (or rich 2.5D) — smooth color gradients, soft studio lighting, gentle rim light, a subtle soft glow, rounded volumes and real depth — centered on a FULL-BLEED vivid branded background (solid color or smooth gradient) that reaches all four edges. Saturated, high-contrast, polished, delightful. Like a soft glossy jelly/clay form with tasteful highlights.

Background: fill the ENTIRE square edge-to-edge with a bold branded color or smooth gradient (e.g. a vivid blue gradient, or a deep dark backdrop for high contrast). Never plain white, never empty. The background is part of the icon.

Subject treatment: dimensional and glossy — soft rounded 3D forms, smooth gradients, gentle highlights and rim light, a subtle inner glow, clear depth and volume. Rich saturated color. One strong, simple silhouette.

Composition: the hero centered, filling ~60-80% of the canvas with comfortable breathing room; the branded background fills the rest to the edges. One focal point, no clutter.

If the brand is monochrome (one ink + one accent), STILL make it fully dimensional and premium — glossy 3D form, tonal gradients within the brand color, soft lighting, a bold full-bleed background. Never a flat single-color glyph.

Do NOT: flat monochrome pictogram, black-on-white glyph, single-color line/silhouette icon, plain SVG/vector symbol, sticker or clip-art; plain white or empty background; a smaller rounded card/icon floating inside the canvas (no icon-in-icon, no outer margins); baked rounded app-icon corners or device-rounded corners (keep a full square with sharp 90 degree corners — iOS applies its own mask); any text, letters, numbers, monograms or watermark; realistic human faces or photos as the main subject; real or trademarked brand logos; mirror chrome, garish neon, or lens flares.

Color palette: <brand colors as names — e.g. "vivid blue gradient background, soft white-to-sky-blue glossy character with subtle highlights">. High saturation, strong contrast on the home screen.

Technical: square 1:1; background bleeds to all four edges with sharp corners; keep critical details within the central ~70% so an Android circular/rounded mask never clips them; punchy and readable at 60px (blur test).
```

**Archetype** (pick one, internal): a friendly **character/mascot** (simple dot eyes) is a strong default for consumer / social / wellness / AI apps; a **symbolic object or abstract form** fits finance, productivity, dev tools, utilities. Don't force a face onto a utility, and don't flatten a playful app into a glyph.
</icon_recipe>

<generation_loop>
1. **Generate** with your tool. With `gemini-cli` the validated command (Nano Banana Pro) is:
   ```bash
   PROMPT="$(cat <<'EOF'
   <paste the filled icon_recipe prompt here>
   EOF
   )"
   gemini-cli image generate --prompt "$PROMPT" \
     --model gemini-3-pro-image-preview --aspect-ratio 1:1 --image-size 2K \
     --out ./icon-raw.png --images-only --json
   ```
   (`gemini-3-pro-image-preview` = Nano Banana Pro, best for icons; `gemini-2.5-flash-image` is the cheaper fallback. Codex: use the `image_gen` tool with the same prompt.)
2. **Visually inspect** every output: premium and dimensional (glossy 3D, depth)? full-bleed branded background (NOT white)? strong simple silhouette? readable at small size? NO flat-glyph look, NO accidental text/watermark?
3. **Reject and regenerate** anything that drifts flat/monochrome/SVG-like or lands on a white background — tighten the prompt, don't accept "almost".
4. **Safety-filter gotcha:** reword ambiguous prompts to a plain neutral paragraph and retry.
5. **Blur test:** shrink to ~64px — if the mark turns to mush, simplify the silhouette.
</generation_loop>

<post_processing>
Models often **bake rounded corners or a light border** around the tile. Scale up slightly and center-crop so the rounded ring falls off-canvas, leaving a true full-bleed square. `sips` is built into macOS; ImageMagick (`magick`, `brew install imagemagick`) is only needed for Android padding. Replace `<ASSETS>` and `<brand-bg-color>` with the values from `<locate_assets>`.

```bash
# 1. Full-bleed fix: push any baked rounded corners / border off-canvas, then normalize to 1024.
sips -z 1126 1126 icon-raw.png --out /tmp/icon-up.png             # scale up ~10%
sips -c 1024 1024 /tmp/icon-up.png --out /tmp/icon-fullbleed.png  # center-crop to 1024 square
#    (skip step 1 if the generated background already bleeds to sharp corners.)

# 2. iOS icon: enforce 1024 and guarantee NO transparency (App Store rejects alpha).
sips -s format png /tmp/icon-fullbleed.png --out <ASSETS>/icon.png
sips -g hasAlpha <ASSETS>/icon.png   # must say: hasAlpha no
#    If it reports alpha, flatten: magick in.png -background "<brand-bg-color>" -alpha remove -alpha off <ASSETS>/icon.png

# 3. Android adaptive icon: pad the subject into the central ~66% safe circle on a brand background.
magick <ASSETS>/icon.png -resize 66% -background "<brand-bg-color>" -gravity center -extent 1024x1024 <ASSETS>/adaptive-icon.png
#    Make app config match: expo.android.adaptiveIcon.backgroundColor == <brand-bg-color>.
#    No magick? Re-run the recipe adding "leave ~20% padding for the Android adaptive safe zone".

# 4. Favicon + final verification
sips -z 192 192 <ASSETS>/icon.png --out <ASSETS>/favicon.png
sips -g pixelWidth -g pixelHeight -g hasAlpha <ASSETS>/icon.png <ASSETS>/adaptive-icon.png <ASSETS>/favicon.png
```

Remember: **icon and adaptive-icon changes require a native rebuild** (`npx expo run:ios` / `npx expo run:android`, or a new EAS build) — they will NOT appear on hot reload. The favicon is a web asset and reloads normally.
</post_processing>

<render_verification>
File inspection is not enough — confirm the icon on a device/simulator after a native rebuild.

1. Rebuild the dev client (`npx expo run:ios` or `npx expo run:android`).
2. On the home screen confirm: the new art shows (not the old/default), iOS applies a clean rounded mask with **no double-rounding and no white/transparent corner halo**, and the mark is readable at home-screen size.
3. Fail the run if the icon still shows the previous art, a flat glyph, or a corner halo. Fix before reporting completion.
</render_verification>

<failure_modes>
- **Flat monochrome glyph / black-on-white pictogram** (the most common, worst failure) → the prompt leaned minimal/matte; re-emphasize "premium vibrant dimensional, glossy 3D, full-bleed branded background, NOT a flat SVG symbol", and regenerate.
- White/transparent corner halo after the iOS mask → baked rounded corners; run the step-1 scale-up + center-crop, verify `hasAlpha no`, rebuild.
- Generated icon has transparency → App Store rejection; flatten onto the brand bg (`magick ... -alpha remove -alpha off`).
- Android adaptive icon looks cropped at the edges → subject sat outside the central 66% safe circle; increase padding or regenerate with explicit padding.
- Icon unchanged after editing the PNG → no native rebuild; hot reload never updates the launcher icon.
- Prompt rejected by safety filter → reword neutrally, simplify to one plain paragraph.
- Mark turns to mush at small size → too detailed; simplify to a single strong silhouette (blur/64px test).
</failure_modes>
