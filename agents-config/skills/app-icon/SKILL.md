---
name: app-icon
description: Generate a polished iOS + Android app icon for an Expo / React Native app with AI image generation, then post-process it to App Store / Play specs. Use for "create my app icon", "generate the iOS icon", "redo the app logo", "make the launcher icon". Requires an image-generation tool (Codex imagegen / gpt-image); without one it builds the prompt for you to run, then resumes at post-processing.
argument-hint: "[app concept or brand]"
---

# App Icon

Generate a store-quality launcher icon (iOS App Store icon + Android adaptive icon + web favicon) for an Expo / React Native app, then post-process it to meet store requirements.

<capability_gate>
**This workflow requires an image-generation tool** (Codex's `imagegen` skill backed by gpt-image, or any model/agent that can generate raster images).

- **Codex**: invoke the `imagegen` skill with the prompt below. Generated files land in `~/.codex/generated_images/<session-id>/ig_*.png` — copy them into the repo.
- **Agent WITHOUT image generation (e.g. Claude Code without an image tool)**: do NOT fake it (no SVG-to-PNG pipelines — that produces flat, amateur results). Instead: build the final prompt from the recipe below, give it to the user to run in their image tool of choice, then resume at the Post-Processing phase with the file they provide.
</capability_gate>

<locate_assets>
Find where this app's icon actually lives before writing anything. Read the Expo config (`app.json`, `app.config.js`, or `app.config.ts`) and use the real paths:

- iOS icon → `expo.icon` (commonly `./assets/icon.png` or `./assets/images/icon.png`)
- Android adaptive icon foreground → `expo.android.adaptiveIcon.foregroundImage` (commonly `./assets/adaptive-icon.png`)
- Android adaptive background color → `expo.android.adaptiveIcon.backgroundColor`
- Web favicon → `expo.web.favicon` (commonly `./assets/favicon.png`)

In a monorepo the app may live under `mobile-app/` or `apps/<name>/` — resolve paths relative to the Expo project root, not the repo root. Below, `<ASSETS>` means that app's resolved assets directory.

Pull the **brand colors** and **app concept/name** from the project (a brand/site config, the README, or just ask the user). Use color *names* in the prompt, never hex.
</locate_assets>

<objective>
| Asset | Target file (typical) | Spec |
| --- | --- | --- |
| iOS app icon | `<ASSETS>/icon.png` | 1024x1024, square, **NO transparency**, **no baked rounded mask** (iOS applies its own) |
| Android adaptive icon | `<ASSETS>/adaptive-icon.png` | foreground layer, subject inside the central ~66% safe circle, padded |
| Web favicon | `<ASSETS>/favicon.png` | 192x192 derived from the icon |
</objective>

<icon_recipe>
A layered prompt that avoids the common app-icon failure modes (baked rounded tiles, logo plates, accidental text, drop-shadow "floating card" look, unwanted mascots). Fill the two project blanks — **Subject** (the product's core concept/mascot/symbol) and the **Color palette** (named brand colors, never hex) — then send the entire block as one prompt to the image model.

Counter-intuitive but critical: tell the model it is **NOT** making an app-icon tile. Models bake in rounded-square plates, outer margins, and drop shadows the moment they hear "app icon". You want a full-bleed square subject filling 92-98% of the canvas; iOS applies its own mask afterward.

```
Create a 1024x1024 square symbol illustration.

Subject: <single centered mark for <AppName> — the product's core concept/mascot/symbol, highly readable at small sizes>

Context: standalone symbol/illustration for general use, not an app launcher icon or UI mockup.
Do not design or imply an app icon, logo plate, badge, or rounded-square container, even if the words "app icon" or "logo" appear.
Do not draw an icon inside a larger canvas. No outer margins, padding, or separate card background.
Do not draw any rounded-square tile, card, or container behind the subject.
The canvas itself is a perfect square with sharp 90° corners; do not simulate rounded-corner app icon masks or device-rounded corners.
No global drop shadows, long cast shadows, outer glows, or halos around the subject or canvas.
No UI mockups. No borders, frames, stickers, app plates, or device chrome.
No text/typography (letters, numbers, monograms). No watermark.
Not a full photo/portrait/real-world scene. No realistic human faces as the main subject.
Do not copy or imitate real brand logos, trademarked shapes, or recognizable brand marks.

Archetype (internal decision, do not mention in the output):
Choose exactly ONE archetype: object_icon, abstract_form_icon, hybrid_icon, or character_icon. Characters are optional and must only be used when clearly appropriate; never the default.
- object_icon: a single physical/symbolic object without a face (finance, productivity, utilities, dev tools, dashboards, system apps).
- abstract_form_icon: pure form/metaphor without literal objects or faces (AI tools, design tools, analytics, experimental products).
- hybrid_icon: an object with subtle life cues (no face), friendly but restrained (health, lifestyle).
- character_icon: a friendly expressive character with a face (kids, games, beginner education, wellness, fun social).

Concept:
Design a single, intentional visual element that represents the app. Avoid generic logos and the most literal/obvious metaphor; choose a clear but slightly unexpected metaphor.
Creativity means unusual material choices, unexpected-but-clear metaphors, expressive lighting, playful proportions, premium texture decisions. It does NOT mean always adding eyes/faces or always making it cute.

Material:
Default to an illustration-friendly matte finish (painted polymer, ceramic, paper, or flat vector). Avoid glass/chrome/neon unless explicitly requested. Material choice should communicate the product category.

Composition:
Main subject fills 92-98% of the canvas. Strong silhouette. No unnecessary elements.

Lighting:
Soft, controlled lighting. Minimal specular highlights. No bloom/glow/lens flares. No "3D glass icon" look.

Overall feel:
Modern, bold, subject-first illustration (not an app icon layout). Creative without being childish. Readable at small sizes. Clean illustration / 2D or 2.5D, matte finish, subtle shading only.

Color palette: <brand colors as names — e.g. "warm peach background, deep ink subject">. Clean contrast on both light and dark backgrounds.

Technical constraints:
Square 1:1 aspect ratio.
Main subject fills 92-98% of the canvas (zoom in; avoid excessive empty space).
Center/balance the silhouette. Keep critical details within ~5-8% safe area.
Android-safe: keep critical details within the central ~70% (silhouette may extend).
Background extends to all four edges of the square canvas with straight (non-rounded) corners; keep it clean (low-detail, low-noise).
Default-look guardrail: avoid inflated glass/chrome/neon/glow/sparkles/lens flare/exaggerated shine unless explicitly requested.

Quality filters (internal):
Reject if: it reads like a photo/portrait/full scene; it becomes a mascot by default; too many elements hurt clarity; a face appears without choosing character_icon; any rounded-square/card/tile background or app-icon container appears behind the subject.
Accept if: instant read at small size; strong silhouette; intentional material; clean contrast on both light and dark backgrounds.

Icon QA (internal): blur test (~64px), small-size readability, wallpaper contrast, one focal point.
```

**Optional style preset.** Lock a look as a HARD constraint (it wins any conflict) by appending a dominant style block before the technical constraints. Useful named looks: `minimalism`, `glassy`, `geometric`, `gradient`, `flat`, `material`, `clay`, `kawaii`. Example for `minimalism`:

```
STYLE SYSTEM: MINIMALISM (dominant — if anything conflicts, the style wins)
Cultural DNA: Swiss design, Apple, Braun, Dieter Rams, Functionalism.
Visual traits: max 3 colors; simple primary silhouettes; large negative space; no textures; no effects.
Mandatory: readable at very small sizes; works in monochrome; single dominant symbol.
Forbidden: gradients, shadows, 3D effects, decorative details, textures.
```

Non-negotiable for iOS (enforced in Post-Processing, not the prompt): the saved `icon.png` must have **no baked rounded corners** (iOS applies the mask), **no transparency** (App Store rejects alpha in the marketing icon), and stay **readable at 60px**.
</icon_recipe>

<generation_loop>
1. Generate the icon (1-3 candidates if the concept is open).
2. **Visually inspect every output** (open/read the images): strong silhouette? readable at small size? no baked rounded-square tile / no drop-shadow card? no accidental text or watermark? no transparency artifacts?
3. Reject and regenerate what fails — refine the prompt, don't accept "almost".
4. **Safety-filter gotcha**: a prompt can be rejected for ambiguous wording with harmless content. Reword to simple, neutral, single-paragraph phrasing and retry.
5. **Blur test:** shrink to ~64px — if the mark turns to mush, the concept is too detailed; simplify the silhouette.
</generation_loop>

<post_processing>
macOS uses `sips` (built in) + ImageMagick (`magick`, `brew install imagemagick`). Replace `<ASSETS>` and `<brand-bg-color>` with the values from `<locate_assets>`.

```bash
# 1. iOS icon: enforce 1024x1024 and strip alpha (App Store requirement)
sips -z 1024 1024 icon-raw.png --out /tmp/icon-1024.png
magick /tmp/icon-1024.png -background "<brand-bg-color>" -alpha remove -alpha off <ASSETS>/icon.png
# (no ImageMagick? `sips -s format jpeg /tmp/icon-1024.png --out /tmp/icon.jpg` then back to png also strips alpha)

# 2. Android adaptive icon: pad the subject into the central ~66% safe circle on a brand background.
#    Scaling the full-bleed icon to ~66% places the SUBJECT inside the safe zone; the brand-bg extent fills the rest.
magick <ASSETS>/icon.png -resize 66% -background "<brand-bg-color>" -gravity center -extent 1024x1024 <ASSETS>/adaptive-icon.png
#    Then make sure app config matches: expo.android.adaptiveIcon.backgroundColor == <brand-bg-color>.
#    (For a cleaner result you can instead re-run the recipe with "leave ~20% padding for Android adaptive safe zone".)

# 3. Favicon + verification
sips -z 192 192 <ASSETS>/icon.png --out <ASSETS>/favicon.png
sips -g pixelWidth -g pixelHeight -g hasAlpha <ASSETS>/icon.png <ASSETS>/adaptive-icon.png <ASSETS>/favicon.png
# icon.png MUST report hasAlpha: no
```

Remember: **icon and adaptive-icon changes require a native rebuild** (`npx expo run:ios` / `npx expo run:android`, or a new EAS build) — they will NOT appear on hot reload. The favicon is a web asset and reloads normally.
</post_processing>

<render_verification>
File inspection is not enough for the launcher icon — confirm it on a device/simulator after a native rebuild.

1. Rebuild the dev client so the new icon is bundled (`npx expo run:ios` or `npx expo run:android`).
2. On the home screen, confirm: the icon shows the new art (not the old/default), iOS applies a clean rounded mask with no double-rounding or visible alpha edge, and the mark is readable at home-screen size.
3. Fail the run if the icon still shows the previous art or a transparent/white corner halo. Fix before reporting completion.
</render_verification>

<failure_modes>
- Generated icon has transparency or baked rounded corners → App Store rejection; strip alpha (`-alpha remove`), regenerate without any tile/mask.
- iOS shows a white/transparent corner halo → alpha was not stripped; re-run the `magick ... -alpha remove -alpha off` step and rebuild.
- Android adaptive icon looks cropped at the edges → subject sat outside the central 66% safe circle; increase padding (lower the `-resize` percentage) or regenerate with explicit padding.
- Icon unchanged after editing the PNG → no native rebuild; hot reload never updates the launcher icon.
- Flat/amateur output → prompt missed the "subject-first illustration, not an app icon layout" + matte/material anchors, or fell back to a generic logo.
- Prompt rejected by safety filter → reword neutrally, simplify to one plain paragraph; content was almost certainly fine.
- Mark turns to mush at small size → too detailed; simplify to a single strong silhouette (blur/64px test).
</failure_modes>
