# Skills Documentation

Reusable Claude Code skills shipped with AIBlueprint. Each skill installs into
`~/.claude/skills/` and is invoked from Claude Code with `/<skill-name>` (or by
matching the situations described in its `description`).

## Installing skills

```bash
# Install every AIBlueprint skill
npx skills@latest add melvynx/aiblueprint

# Install a single skill
npx skills@latest add melvynx/aiblueprint --skill <skill-name>
```

Replace `<skill-name>` with one of the identifiers below (e.g. `app-icon`).

## Free catalog

This catalog is generated from the directories shipped under
`agents-config/skills/`; every entry below is installed by the free CLI setup.

| Skill | Description |
|-------|-------------|
| `agents-manager` | Create and orchestrate Claude Code agents |
| `apex` | Structured implementation workflow |
| `app-icon` | Generate and prepare app icons |
| `appstore-connect` | Manage App Store Connect workflows |
| `audit-memories` | Audit and clean project agent documentation |
| `audit-skills` | Audit installed skill usage, discovery, invocation controls, and scope |
| `environments-manager` | Set up per-worktree environments |
| `grill-me` | Stress-test a plan with focused questions |
| `hooks-manager` | Create and debug Claude Code hooks |
| `rules-manager` | Maintain AGENTS.md and agent rules |
| `skill-manager` | Create, edit, audit, or prune skills |
| `use-style` | Apply named visual style guides |

---

## app-icon

```bash
npx skills@latest add melvynx/aiblueprint --skill app-icon
```

**What it does:** Generates a premium, vibrant, dimensional app icon for an Expo /
React Native app, then post-processes it to App Store / Play Store specs (iOS App
Store icon + Android adaptive icon + web favicon).

**Use it for:** "create my app icon", "generate the iOS icon", "redo the app logo",
"make the launcher icon".

**Key points:**
- Works with any image-generation tool (Codex `image_gen`, `gemini-cli` Nano
  Banana, gpt-image, …).
- Aesthetic target is a **premium, dimensional hero** (glossy 3D mascot or bold
  symbolic object) on a full-bleed vivid branded background — not a flat pictogram.
- Argument hint: `[app concept or brand]`.

---

## appstore-connect

```bash
npx skills@latest add melvynx/aiblueprint --skill appstore-connect
```

**What it does:** Interacts with App Store Connect through the `asc` CLI — apps,
builds, TestFlight, beta testers, reviews, sales/analytics, metadata, IAP, signing,
and submissions. Also builds an Expo / React Native iOS app and ships it to
TestFlight.

**Use it for:** "check my app", "App Store Connect", "TestFlight status", "ship to
TestFlight", "app review", "my app sales", or "asc".

**Key points:**
- Invoke as `appstore-connect testflight` for the full build-and-upload workflow
  (ASC API-key signing to avoid Apple ID 2FA, `eas build --local` by default,
  `--expo` for a cloud build, then `asc publish testflight`).
- `appstore-connect testflight setup` stops after credentials are ready.
- Requires the `asc` CLI; verify auth with `asc auth status` / `asc auth status
  --validate`.
- Argument hint: `[testflight [--expo] [setup]] | <natural-language ASC request>`.

---

## grill-me

```bash
npx skills@latest add melvynx/aiblueprint --skill grill-me
```

**What it does:** Interviews you relentlessly about a plan or design until you reach
a shared understanding, walking down each branch of the decision tree and resolving
dependencies one decision at a time.

**Use it for:** stress-testing a plan, getting grilled on a design, or saying
"grill me".

**Key points:**
- Asks questions one at a time, and provides a recommended answer for each.
- Prefers exploring the codebase over asking when a question can be answered there.

---

## rules-manager

```bash
npx skills@latest add melvynx/aiblueprint --skill rules-manager
```

**What it does:** Creates and maintains agent rules in `AGENTS.md` and
`.agents/rules/`. Keeps rules minimal, specific, and discoverable.

**Use it for:** project rules, conventions, constraints, rule indexes, or requests to
add or optimize agent rules.

**Key points:**
- Two-tier system: `AGENTS.md` is always loaded (the index + universal rules);
  `.agents/rules/*.md` holds modular rule files for focused topics.
- **Invariant:** every file in `.agents/rules/` must be referenced in `AGENTS.md`,
  otherwise it is an orphaned, invisible rule.
- Argument hint: `[init | add <rule-name> | optimize | task description]`.

---

## skill-manager

```bash
npx skills@latest add melvynx/aiblueprint --skill skill-manager
```

**What it does:** Authoring guide for creating or editing skills/rules across Claude
Code, Codex, and Cursor — `SKILL.md`, `.cursor/rules`, `AGENTS.md`, frontmatter,
references, scripts, and discovery rules.

**Use it for:** anything involving skill/rule creation or editing on any of the three
platforms.

**Key points:**
- Pick the platform first, then follow the matching reference:
  - Claude Code → `<scope>/skills/<name>/SKILL.md`
  - Codex → `<scope>/.agents/skills/<name>/SKILL.md` (`agents/openai.yaml` config)
  - Cursor → `.cursor/rules/<name>.md` / `.mdc` (or `AGENTS.md`)
- All platforms share the same idea: a small markdown file with frontmatter, plus
  optional references and scripts; discovery rules and frontmatter fields differ.

---

## apex

```bash
npx skills@latest add melvynx/aiblueprint --skill apex
```

**What it does:** Runs an adaptive **Analyze → Plan → Execute → eXamine**
loop. Apex is included in the free bundle and records resumable checkpoints.
Its plan, review, and runtime proof adapt to the task and risk.

**Use it for:** implementing features, fixing bugs, or migrations that need
scoped execution and evidence for their acceptance criteria.

**Key points:**
- `-a` reduces interaction while preserving the user's authorization boundaries.
- `-x` requests adversarial review; material or high-risk changes require independent review.
- `-v` explicitly requests runtime proof. Relevant existing validation always runs.
- `-r <id>` resumes a validated checkpoint from `.agents/apex/runs/<run-id>/`.
- A GitHub issue is optional. External delivery actions require user authorization.
- Changes invalidate affected checks, which must be rerun before completion.
- See the [complete Apex documentation](https://docs.aiblueprint.dev/advanced/apex)
  for all flags, workflow stages, and evidence requirements.

---

## use-style

```bash
npx skills@latest add melvynx/aiblueprint --skill use-style
```

**What it does:** Applies a named visual style guide before designing or implementing
any UI (landing pages, app shells, components).

**Use it for:** `$use-style <name>`, `/useskill <name>`, "list styles", or referencing
a known style such as `ios-app`, `grid`, `vercel`, `black-grid`, `stripe`,
`linear`, `new-york-times`, `anthropic`, `gumroad`, `raycast`, `dusk`, `luma`,
or `testspirite`.

**Key points:**
- Invocation: explicit (`$use-style grid`, `/useskill list`) or implicit (referencing
  a recognized product/aesthetic like Vercel, Linear, Stripe, Anthropic, Luma…).
- `list` (or no inferable style) makes it print the available styles and ask which to
  use before designing.
- Workflow: read `styles/<name>.md` from the skill directory, then prefer any
  project-level overrides over the portable spec.
