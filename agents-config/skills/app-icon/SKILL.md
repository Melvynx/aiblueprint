---
name: app-icon
description: Generate a vibrant dimensional iOS and Android app icon, then post-process it for store specs. Use for creating, regenerating, or polishing an Expo or React Native app logo or launcher icon.
disable-model-invocation: true
argument-hint: "[app concept or brand]"
---

Generate the icon yourself with any reachable image tool. Codex: `image_gen`. If `gemini-cli` is available, use it (`gemini-cli auth set <GOOGLE_API_KEY>` if unauthenticated). Do not hand the prompt back when a tool can run. Do not fake it with SVG-to-PNG. If no tool exists, give the filled prompt to the user and resume post-processing with their file.

Read the Expo config and write to its real paths: `expo.icon`, `expo.android.adaptiveIcon.foregroundImage`, `expo.android.adaptiveIcon.backgroundColor`, `expo.web.favicon`. Pull brand colors and the app concept from the project. Use color names in the prompt, never hex.

Targets: iOS `<ASSETS>/icon.png` 1024×1024, no transparency, no baked rounded mask. Android `<ASSETS>/adaptive-icon.png` with the subject inside the central ~66% safe circle. Web `<ASSETS>/favicon.png` 192×192.

Send this as one prompt, filling Subject and Color palette:

```
Create a 1024x1024 square app icon — premium, vibrant and dimensional, in the style of top App Store featured apps.
Subject: <single hero for <AppName> — soft 3D mascot with simple dot eyes, OR a bold symbolic object; readable at small sizes>
Look: one glossy 3D/2.5D hero, studio lighting, rim light, subtle glow, centered on a FULL-BLEED branded background that reaches all four edges.
Composition: hero fills ~60-80%; one focal point; sharp 90° corners; critical detail inside the central ~70%.
Do NOT: flat pictogram, black-on-white glyph, line icon, white/empty background, icon-in-icon, baked rounded corners, text, letters, faces, logos, chrome, neon, flares.
Color palette: <brand color names>. Technical: square 1:1; readable at 60px.
```

Pick mascot for consumer, social, wellness, or AI; symbol or object for finance, productivity, or utilities.

```bash
gemini-cli image generate --prompt "$PROMPT" \
  --model gemini-3-pro-image-preview --aspect-ratio 1:1 --image-size 2K \
  --out ./icon-raw.png --images-only --json
```

`gemini-2.5-flash-image` is the cheaper fallback. Reject flat, monochrome, SVG-like, white-background, or mushy-at-64px output and regenerate. Reword safety-filter rejects into one plain paragraph.

```bash
sips -z 1126 1126 icon-raw.png --out /tmp/icon-up.png
sips -c 1024 1024 /tmp/icon-up.png --out /tmp/icon-fullbleed.png
sips -s format png /tmp/icon-fullbleed.png --out <ASSETS>/icon.png
sips -g hasAlpha <ASSETS>/icon.png
magick <ASSETS>/icon.png -resize 66% -background "<brand-bg-color>" -gravity center -extent 1024x1024 <ASSETS>/adaptive-icon.png
sips -z 192 192 <ASSETS>/icon.png --out <ASSETS>/favicon.png
```

Skip the scale-up crop if the background already bleeds to sharp corners. If `hasAlpha` is yes: `magick in.png -background "<brand-bg-color>" -alpha remove -alpha off <ASSETS>/icon.png`. Match `expo.android.adaptiveIcon.backgroundColor` to that color. Without `magick`, regenerate with "~20% padding for the Android adaptive safe zone".

Icon and adaptive-icon changes need a native rebuild (`npx expo run:ios` or `npx expo run:android`). Fail the run if the home screen still shows the old art, a flat glyph, or a corner halo.
