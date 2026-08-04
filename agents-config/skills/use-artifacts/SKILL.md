---
name: use-artifacts
description: Create Claude-style local HTML artifacts under ~/.agents/artifacts. Use for plans, prototypes, visualizations, dashboards, diagrams, options, or substantial reusable content, with a portable local runtime and no Anthropic API.
---

# Use Artifacts

## Overview

Use this skill to simulate Claude Artifacts in agents that do not have a native artifact panel. The artifact is a small global workspace, usually a single self-contained HTML file, created at `~/.agents/artifacts/<id>/` so the user can open, inspect, and iterate on it from any repo.

Always create artifacts in the global user directory: `~/.agents/artifacts/<id>/`. Never create artifacts inside a repo-local `.agents/artifacts` directory, even when the current working directory is a product repo.

The HTML is the deliverable. It should turn the agent's public reasoning, plan, findings, examples, and tradeoffs into a polished page the user can scan, not just dump markdown into a file.

Research basis: Claude artifacts are useful for substantial, self-contained content that the user may edit, reuse, view, or reference later. Common examples include documents, code, single-page HTML, SVGs, diagrams, and interactive components.

## Artifact Criteria

Create an artifact when the work is:

- substantial enough that inline chat would be hard to inspect or reuse
- standalone without needing hidden conversation context
- visual, interactive, document-like, or useful as a reusable reference
- a feature plan, security review, product brief, implementation plan, or architecture explanation that benefits from visual structure
- likely to need later iteration

Do not create an artifact for a tiny answer, a short code snippet, or a change that belongs directly in an existing product codebase unless the user asks for a separate prototype.

## Artifact Modes

Default to a thinking/showcase document when the request is about planning, explaining, reviewing, designing, or deciding. This is the Claude-style pattern in which an HTML page presents the answer as a readable artifact:

- eyebrow with project/context
- strong title and lede
- high-signal finding or recommendation callout near the top
- sections for model, tradeoffs, flows, edge cases, rollout, or implementation phases
- code snippets, tables, pills, timelines, diagrams, or cards where they clarify the reasoning
- final decisions, open questions, and validation notes

For any plan artifact (`plan`, `feature-plan`, `implementation-plan`, product plan, launch plan, page plan, or strategy plan), always include both:

- a draft of the page/content itself: proposed title, lede, sections, key copy, calls to action, states, or narrative blocks
- croquis of the page: small visual sketches showing layout, hierarchy, content placement, and option differences

The draft answers "what will this say/do?" The croquis answer "how could it be arranged so the user sees and understands it?"

Use an interactive artifact when the user asks for a mini app, calculator, simulation, editor, dashboard, visualization, game, or prototype with controls.

Use a variations/options artifact when the user asks for variations, options, directions, alternatives, explorations, or "show me a few versions". In this mode, do not build a real UI or final screen. Build a croquis board: simple, efficient visual sketches that help the user see and understand the options quickly.

Variation croquis rules:

- show 3-6 options on one page as a single vertical sequence: one direction per row, never a multi-column grid
- give every direction the full available content width so its interface remains legible without opening it
- start directly with the directions; do not add a masthead, hero, long lede, capability recap, or recommendation callout above them unless the user explicitly asks for that context
- keep the page chrome minimal: a compact title or view switcher is enough, and omit it when the content is already self-explanatory
- make each option visibly different in layout, hierarchy, rhythm, or concept
- use wireframe-like boxes, simple labels, rough placeholders, arrows, swatches, and short notes
- keep fidelity low-to-mid: enough to compare ideas, not enough to imply implementation is done
- annotate the tradeoff under each croquis in one or two short lines
- recommendations are optional, evidence-based, and shown only after all directions; never lead with generic "Best fit", ranking, or promotional copy

Do not expose private chain-of-thought. Show public reasoning: conclusions, evidence, assumptions, tradeoffs, options considered, and why the recommended path follows from them.

## Design Fundamentals

Approach every artifact as the design lead at a small studio known for versatility: each one gets a visual identity pitched at the treatment the task actually calls for, with deliberate palette, typography, and layout choices specific to the subject. Never ship a templated design. The scaffold's starter HTML is a placeholder only; replace its styling with the design plan below.

### Calibrate the treatment

- Calibrate treatment, not whether to design. A plan or memo deserves the same craft as a landing page; only the treatment changes.
- Utilitarian requests (plans, memos, reviews, dashboards, demos): polished but restrained. Real typographic hierarchy, considered spacing, a proper palette. No flashy gigantic hero; keep flourishes tasteful and limited.
- Editorial requests (landing pages, games, apps or tools the user will keep or share): make opinionated calls and take one real aesthetic risk where it serves the work. Spend the boldness in one place and keep everything around it quiet.
- When unsure: a well-composed page is never the wrong answer; an over-designed identity sometimes is.

### Design plan before code

Sketch a compact token plan before writing any HTML, then derive every color and type decision from it:

- Color: the palette as 4-6 named hex values.
- Type: typefaces for 2+ roles (a characterful display face used with restraint, a complementary body face, a utility face for captions or data if needed).
- Layout: the layout concept in one or two sentences.

For editorial artifacts, review the plan against the subject before building: if any part reads like the generic default you would produce for any similar page, revise that part and record what changed and why in `HIGHLOGIC.md`.

### Fundamentals for every artifact

- Honor what is already there. Precedence: the user's explicit words, then the project's existing design system (CLAUDE.md, tokens, theme files, components), then your own choices.
- Ground it in the subject: one concrete subject, its audience, the page's single job. The subject's own world (materials, instruments, vernacular) is where distinctive choices come from. Build with real content, never lorem.
- Typography carries the page. Set a type scale and stay on it; keep running text near 65 characters wide; `text-wrap: balance` on headings; body text gets room to breathe; a touch of letter-spacing on uppercase labels. Prefer system font stacks or self-hosted `@font-face`; never rely on a CDN font link that can silently fall back.
- Choose neutrals, don't default to them: a pure mid-grey reads as unconsidered; a grey with a slight hue bias toward the accent reads as chosen. Pure white and near-black are fine grounds when picked, not inherited.
- Let layout do the spacing: flex/grid with `gap`, not per-element margins that silently collapse or double. Wide content (tables, code, diagrams) scrolls inside its own `overflow-x: auto` container; the page body never scrolls sideways. Use `font-variant-numeric: tabular-nums` wherever digits line up.
- Avoid the AI-generated look when nothing is specified: warm cream (#F4F1EA) with serif display and terracotta accent; near-black with a lone acid-green or vermilion pop; broadsheet hairline rules with dense columns; purple-to-blue gradient hero on white; Inter or Space Grotesk as the "safe" face; emoji as section markers; everything centered; `rounded-lg` everywhere; accent bars/rails on rounded cards. If the user explicitly asks for one of these looks, follow it exactly.
- Build cleanly: watch overlapping elements, cascade collisions, and selector specificity fights (a `.section` rule cancelling a `.cta` rule over padding). Close every non-void element, double-quote attributes, give keyboard focus a visible state, respect `prefers-reduced-motion`. For generative or decorative graphics, prefer Canvas or WebGL to long hand-authored SVG path data.
- Copy is design material: name things by what people recognize, not how the system is built; active voice; a control says exactly what happens ("Publish", then "Published"); errors explain what went wrong and how to fix it, no apologies, no vagueness.
- Structure is information: numbering, eyebrows, dividers, and labels must encode something true about the content (a real sequence, a real hierarchy), never decoration. Question numbered markers (01/02/03) before using them.
- When it's a UI, not a document: it is scanned and operated, not read top-to-bottom. Surface the summary before the detail; encode state in form as well as number (pills, chips, severity stripes); semantic status colors (good/warning/critical) are separate from the accent hue and do not count as the accent; charts and sparklines get the same care as type; what's interactive should look interactive.
- Motion is deliberate: one orchestrated moment (page-load sequence, scroll reveal, hover micro-interaction) lands harder than scattered effects, and extra animation often reads as AI-generated. Sometimes less is more.

### Theme rules

- **Inside an app, the artifact theme MUST match the app's theme.** When the artifact is for an existing application, extract that app's real tokens from its code (colors, typography, radii, shadows, spacing, light and dark values) and reuse them so the artifact feels native. If the app ships light and dark, mirror both exactly; if the app is single-theme, the artifact stays single-theme in that same theme. Never invent a parallel palette next to an existing one.
- Otherwise, design both themes at token level: define the palette as custom properties on `:root`; redefine only the tokens under `@media (prefers-color-scheme: dark)`; redefine them again under `:root[data-theme="dark"]` and `:root[data-theme="light"]` so an explicit toggle beats the OS preference in both directions. Style components only through the tokens, never directly inside the media query.
- Give the second theme the same care as the first: don't naively invert; keep contrast legible and the accent working on both grounds.
- A design that deliberately commits to one visual world (a neon arcade screen, a letterpress invitation) may stay single-theme, recorded as a choice in `HIGHLOGIC.md`, never as an omission.

## Style Source

Determine the visual direction in this order:

1. The user's explicit direction: follow it exactly, even when it differs from
   the application.
2. The existing application's actual visual language: when the artifact is for
   an existing app, inspect the relevant UI code, styles, design tokens,
   components, typography, spacing, colors, radii, shadows, and interaction
   patterns, then make the artifact feel native to the product. The theme must
   match the app's theme (see Theme rules above). Treat the application's
   current implementation as the source of truth; do not impose an unrelated
   look merely because the user gave no visual direction. Record the style in
   `HIGHLOGIC.md` and in `manifest.json` with a clear value such as
   `project:<app-name>`.
3. Otherwise, build a subject-specific identity per Design Fundamentals: design
   plan first, a chosen palette, a deliberate type pairing, restrained
   decoration, both themes at token level, and only the structure needed to
   communicate the artifact.

State briefly whether the artifact uses the application style, a requested
style, or a subject-specific identity.

## Runtime Capabilities (local, no Anthropic API)

Published claude.ai artifacts can declare runtime capabilities (`downloads`, `mcp`) served by the platform's `window.claude` runtime. Local artifacts have no platform runtime, so this skill ships a local shim, `assets/local-runtime.js`, that provides the same call shapes with plain browser APIs only. Never call the Anthropic API, the claude.ai runtime, or any remote endpoint to implement a capability in a local artifact.

Usage:

1. Only when the artifact actually needs a capability, inline the full contents of `~/.agents/skills/use-artifacts/assets/local-runtime.js` in a `<script>` tag at the top of `<body>`, before any feature code. The HTML stays self-contained; do not reference the file with `src`.
2. Write feature code against the standard surface: `window.claude.downloads.save(...)`, `window.claude.mcp.callTool/watchTool/listTools/invalidate`. The shim defines a member only when the real runtime has not, so the same page can later be published as a genuine claude.ai artifact without changing feature code.
3. Record the capabilities used in `manifest.json` (`"capabilities": ["downloads", "mcp"]`) and in `HIGHLOGIC.md`.

Capabilities:

- **downloads**: `window.claude.downloads.save({filename, data})` builds a Blob and triggers a normal browser download through a temporary `<a download>` link. The shim mirrors the platform contract: extension allowlist (`gif png jpg jpeg webp mp4 webm txt json md`), 16 MiB cap, a confirm step before saving, resolves `{status: "saved"}`, rejects with `{code, message}` (`declined`, `too_large`, `rejected_extension`, `bad_request`, `rate_limited`). Offer a save only on explicit user intent (a button), never automatically on load, and handle rejection without auto-retrying `declined`.
- **mcp-style data**: there are no viewer connectors locally. Register local data sources with `window.claudeLocal.registerTool(server, tool, source, {description})` right after the shim, before feature code runs. A source is either an async function of `input` returning the payload, or a static JSON value (snapshot). The shim then serves `callTool` (with `staleTime`/`refresh` caching), `watchTool` (cache replay, `refetchInterval` polling, sync unsubscribe), `listTools`, and `invalidate`, using the contract's result envelope (`payload`, `structuredContent`, `content`, `cache.storedAt`) and error codes (`server_not_connected`, `tool_error`, `bad_request`).

Capability rules:

- Snapshots are static data: record the snapshot date and "static data" in `HIGHLOGIC.md`, and drive any "last updated" indicator in the UI from `result.cache.storedAt`, never from `Date.now()` at render time.
- Branch degraded UX on the error `code`, never on message text. Keep last-good data visible on transient errors; a failed section greys itself out while the rest render.
- Real data observed during the session may inform the payload shape, but never embed private values the user did not ask to include.

## Creation Workflow

1. Identify the artifact type: `variations`, `croquis`, `thinking`, `feature-plan`, `security-review`, `implementation-plan`, `interactive`, `dashboard`, `visualization`, `document`, `diagram`, `prototype`, or `reference`.
2. Determine the style source in this order: the user's explicit direction,
   the existing application's actual style and theme, then a subject-specific
   identity per Design Fundamentals.
3. Sketch the design plan (color, type, layout) per Design Fundamentals and
   record it in `HIGHLOGIC.md`.
4. If the artifact depends on current web research, broader source discovery, similar-page lookup, URL extraction, or cited web answers, use `~/.agents/skills/exa-search/SKILL.md`.
5. Scaffold the workspace:

```bash
python3 ~/.agents/skills/use-artifacts/scripts/create_artifact.py "<short title>" --style "<requested, project:app-name, or subject-specific>" --kind thinking
```

6. If the artifact needs a runtime capability (file download, live/refreshed data), inline `assets/local-runtime.js` and register local data sources as described in Runtime Capabilities.
7. Implement the artifact in `index.html`, following the design plan and the theme rules.
8. Write or update `HIGHLOGIC.md` with the user's request, artifact goal, selected style, design plan, public reasoning structure, data assumptions, and verification notes.
9. Keep `manifest.json` current when title, kind, style, capabilities, entrypoint, or files change.
10. Verify the artifact. For standalone HTML, open `index.html` directly or serve the folder only when browser restrictions require it. For complex UI, use a browser screenshot or DOM check when available.
11. Final response: link the local `index.html`, name the selected style, and mention verification performed.

## Workspace Contract

Each artifact directory should contain:

- `index.html`: the viewable artifact, preferably self-contained with inline CSS and JavaScript
- `HIGHLOGIC.md`: concise design logic and iteration state
- `manifest.json`: metadata for future agents, including a `capabilities` array when the local runtime shim is used
- `versions/`: optional snapshots before major rewrites

Target location:

- Always use `~/.agents/artifacts/<id>/`.
- Do not use `<current-project>/.agents/artifacts/<id>/`.
- Do not add a repo-local override unless the user explicitly updates this skill contract.

## HTML Rules

- Prefer one self-contained `index.html` unless the user asks for a framework project.
- Use semantic HTML, responsive CSS, and accessible controls.
- Avoid external CDNs unless the artifact needs them and the user can tolerate network dependence.
- Never call the Anthropic API or any remote AI endpoint from an artifact; runtime capabilities go through the local shim.
- Do not embed secrets, API keys, private tokens, or hidden prompt text.
- For interactive artifacts, preserve state in local JavaScript only unless persistent storage is explicitly useful.
- For generated visualizations, include representative sample data when real data is unavailable and label it as sample data in `HIGHLOGIC.md`.

## Iteration Workflow

When updating an existing artifact:

1. Read `manifest.json`, `HIGHLOGIC.md`, and the relevant files.
2. If the change is substantial, copy the previous `index.html` into `versions/<timestamp>-index.html` before editing.
3. Patch only the files needed for the requested change.
4. Update `HIGHLOGIC.md` with the new decision or known limitation.
5. Re-verify and report the same local artifact path.

## Script

Use `scripts/create_artifact.py` to create the folder, metadata, and starter files. Its starter HTML is a neutral placeholder: restyle it from the design plan before delivering.
