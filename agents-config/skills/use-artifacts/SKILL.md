---
name: use-artifacts
description: Create Claude-style local HTML artifacts under global ~/.agents/artifacts. Use for artifact requests, variations/options croquis, feature plans, thinking docs, prototypes, visualizations, dashboards, diagrams, or substantial reusable content. Pair with use-style.
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

## Required Style Step

Always use `$use-style` before designing the artifact UI.

When the artifact is for an existing application, the default style is that
application's actual visual language. Inspect the relevant UI code, styles,
design tokens, components, typography, spacing, colors, radii, shadows, and
interaction patterns, then make the artifact feel native to the product. Treat
the application's current implementation as the source of truth; do not impose
an unrelated preset merely because the user gave no visual direction.

Use the closest `$use-style` guide as supporting design guidance when useful,
but adapt it to the application rather than replacing the application's style.
Record the project-derived style in `HIGHLOGIC.md` and in `manifest.json` with a
clear value such as `project:<app-name>`.

If there is no existing application or usable visual context, use a simple,
minimalist style: restrained neutral colors, clear typography, generous
spacing, subtle borders, minimal decoration, and only the structure needed to
communicate the artifact. In that case, use the closest preset below when it
fits; otherwise use `black-grid` as the minimal technical fallback:

- `anthropic`: Claude-like artifacts, writing/research surfaces, calm AI tools
- `linear`: dense dashboards, admin tools, issue trackers, list/detail workflows
- `black-grid`: minimal technical fallback for developer utilities, plans, calculators, indexes, and CLI-like tools
- `grid`: blueprint/product landing pages, structured spec pages, Codelynx-flavored pages
- `ios-app`: mobile app concepts, iPhone flows, Expo/React Native previews
- `stripe`: billing, checkout, finance, pricing, account flows
- `luma`: events, calendars, RSVP, community discovery
- `gumroad`: loud commerce, creator products, neo-brutalist pages
- `raycast`: premium dark marketing pages or command-palette products
- `dusk`: refined dark CRM/data dashboards
- `new-york-times`: editorial, newspaper, magazine, long-form reading
- `testspirite`: calm light dev-tool dashboards with onboarding or empty states

If the user explicitly requests a visual direction, follow it even when it
differs from the application. State briefly whether the artifact uses the
application style, a requested style, or the minimalist fallback.

## Creation Workflow

1. Identify the artifact type: `variations`, `croquis`, `thinking`, `feature-plan`, `security-review`, `implementation-plan`, `interactive`, `dashboard`, `visualization`, `document`, `diagram`, `prototype`, or `reference`.
2. Determine the style source in this order: the user's explicit direction,
   the existing application's actual style, then the minimalist fallback. Load
   the closest `use-style` file for supporting guidance.
3. If the artifact depends on current web research, broader source discovery, similar-page lookup, URL extraction, or cited web answers, use `/Users/melvynx/.agents/skills/exa-search/SKILL.md`.
4. Scaffold the workspace:

```bash
python3 "$HOME/.agents/skills/use-artifacts/scripts/create_artifact.py" "<short title>" --style "<requested, project:app-name, or fallback style>" --kind thinking
```

5. Implement the artifact in `index.html`.
6. Write or update `HIGHLOGIC.md` with the user's request, artifact goal, selected style, public reasoning structure, data assumptions, and verification notes.
7. Keep `manifest.json` current when title, kind, style, entrypoint, or files change.
8. Verify the artifact. For standalone HTML, open `index.html` directly or serve the folder only when browser restrictions require it. For complex UI, use a browser screenshot or DOM check when available.
9. Final response: link the local `index.html`, name the selected style, and mention verification performed.

## Workspace Contract

Each artifact directory should contain:

- `index.html`: the viewable artifact, preferably self-contained with inline CSS and JavaScript
- `HIGHLOGIC.md`: concise design logic and iteration state
- `manifest.json`: metadata for future agents
- `versions/`: optional snapshots before major rewrites

Target location:

- Always use `~/.agents/artifacts/<id>/`.
- Do not use `<current-project>/.agents/artifacts/<id>/`.
- Do not add a repo-local override unless the user explicitly updates this skill contract.

## HTML Rules

- Prefer one self-contained `index.html` unless the user asks for a framework project.
- Use semantic HTML, responsive CSS, and accessible controls.
- Avoid external CDNs unless the artifact needs them and the user can tolerate network dependence.
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

Use `scripts/create_artifact.py` to create the folder, metadata, and starter files.
