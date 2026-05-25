# OpenAI Codex Skills

Official docs: https://developers.openai.com/codex/skills
Examples: https://github.com/openai/skills

## Layout

```
skill-name/
├── SKILL.md            # required
├── agents/
│   └── openai.yaml     # optional: UI metadata, MCP deps, default prompt
├── assets/             # icons referenced by openai.yaml, output templates
├── references/         # loaded on demand
└── scripts/            # executable code
```

## Storage locations (scan order)

| Scope    | Path                            | Use                                  |
| :------- | :------------------------------ | :----------------------------------- |
| REPO     | `$CWD/.agents/skills`           | Skill scoped to working folder       |
| REPO     | `$CWD/../.agents/skills`        | Shared across nested module          |
| REPO     | `$REPO_ROOT/.agents/skills`     | Repo-wide for everyone               |
| USER     | `~/.agents/skills`              | Personal, any repo                   |
| ADMIN    | `/etc/codex/skills`             | Machine/container-wide               |
| SYSTEM   | bundled with Codex              | Built-ins                            |

Codex walks CWD up to repo root collecting `.agents/skills` at each level. Symlinks are followed. Same `name` in two scopes is NOT merged - both appear in the selector.

## SKILL.md (required, minimal)

```markdown
---
name: skill-name
description: Explain exactly when this skill should and should not trigger.
---

Imperative instructions for Codex.
```

Only `name` and `description` are required. The description is what triggers implicit invocation - front-load the use case and trigger words. Codex caps the initial skill list at ~2% of context (or ~8000 chars); descriptions get shortened first, so the important phrases must come first.

## Invocation

- **Explicit**: user types `$skill-name` in CLI/IDE, or `/skills` to browse.
- **Implicit**: Codex picks the skill when the user's prompt matches the description.

To block implicit picking (e.g., for side-effecting skills), set `policy.allow_implicit_invocation: false` in `openai.yaml`. `$skill-name` still works.

---

# `agents/openai.yaml` - the optional UX layer

`openai.yaml` is product-specific config the **harness** reads, not the model. It controls how the skill appears in the Codex app/IDE (icon, name, color, blurb), how it can be invoked, and what MCP servers it needs to function. The skill still works without it - this layer makes it feel native.

## When to add it

- **Skip** for a personal, instruction-only skill in your own repo. SKILL.md alone is fine.
- **Add it** when you want the skill to look polished in the Codex app skill picker (real icon, brand color, friendly name).
- **Required** if the skill needs an MCP server (Figma, Notion, Linear, GitHub, etc.) to function - that's how Codex knows to connect.
- **Required** if you want to disable implicit invocation for safety.

## Full schema with constraints

```yaml
interface:
  display_name: "Optional user-facing name"
  short_description: "Optional user-facing description"
  icon_small: "./assets/small-400px.png"
  icon_large: "./assets/large-logo.svg"
  brand_color: "#3B82F6"
  default_prompt: "Use $skill-name to draft a concise weekly status update."

policy:
  allow_implicit_invocation: false

dependencies:
  tools:
    - type: "mcp"
      value: "github"
      description: "GitHub MCP server"
      transport: "streamable_http"
      url: "https://api.githubcopilot.com/mcp/"
```

**Top-level rules**

- Quote every string value. Leave keys unquoted.
- Paths in `icon_small` / `icon_large` are relative to the skill directory. Convention: put icons under `./assets/`.

### `interface` fields (UI metadata)

| Field               | Purpose                                       | Notes                                                                                |
| :------------------ | :-------------------------------------------- | :----------------------------------------------------------------------------------- |
| `display_name`      | Human-facing title in skill lists/chips       | Keep short. Don't repeat the `name` slug.                                            |
| `short_description` | One-line blurb for skill picker               | **25-64 chars**. Skim-readable.                                                      |
| `icon_small`        | Small icon path                               | Use `./assets/<file>`. PNG or SVG. Used in chips/lists.                              |
| `icon_large`        | Large logo path                               | Used on the skill detail card.                                                       |
| `brand_color`       | Hex color for UI accents                      | Format `"#RRGGBB"`. Picks badge / pill color.                                        |
| `default_prompt`    | Example prompt inserted when invoking         | **Must mention the skill as `$skill-name`** (e.g., "Use `$weekly-status` to draft…") |

### `policy` field

- `allow_implicit_invocation` (default: `true`). Set to `false` for skills with side effects (deploy, post, write). Users can still trigger with `$skill-name`.

### `dependencies.tools` (MCP)

Only `type: "mcp"` is supported today. Each entry:

| Field         | Required | Description                                                              |
| :------------ | :------- | :----------------------------------------------------------------------- |
| `type`        | yes      | Always `"mcp"` for now                                                   |
| `value`       | yes      | Server identifier. Must match `[mcp_servers.<value>]` in `config.toml`   |
| `description` | yes      | Human-readable purpose                                                   |
| `transport`   | yes      | Always `"streamable_http"` for remote MCP servers                        |
| `url`         | yes      | HTTPS endpoint of the MCP server                                         |

---

## Wiring an MCP-backed skill end-to-end

Two files have to agree:

**1. Skill declares the dependency** (`<skill>/agents/openai.yaml`)

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "figma"
      description: "Figma MCP server for design-to-code"
      transport: "streamable_http"
      url: "https://mcp.figma.com/mcp"
```

**2. User configures the server** (`~/.codex/config.toml`)

```toml
rmcp_client = true   # required feature flag for remote MCP

[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
# optional:
# http_headers = { "X-Figma-Region" = "us" }
# startup_timeout_sec = 10
# tool_timeout_sec = 30
```

The token itself lives in the environment:

```bash
export FIGMA_OAUTH_TOKEN="…"
```

Restart Codex after editing `config.toml` or the env var.

**Real-world reference table**

| Skill                          | MCP `value` | URL                          | Env var               |
| :----------------------------- | :---------- | :--------------------------- | :-------------------- |
| `figma`                        | `figma`     | `https://mcp.figma.com/mcp`  | `FIGMA_OAUTH_TOKEN`   |
| `notion-knowledge-capture`     | `notion`    | `https://mcp.notion.com/mcp` | `NOTION_OAUTH_TOKEN`  |
| `notion-meeting-intelligence`  | `notion`    | `https://mcp.notion.com/mcp` | `NOTION_OAUTH_TOKEN`  |
| `notion-spec-to-implementation`| `notion`    | `https://mcp.notion.com/mcp` | `NOTION_OAUTH_TOKEN`  |

---

## Enable/disable a skill without deleting

`~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/absolute/path/to/skill/SKILL.md"
enabled = false
```

Restart Codex after editing.

## Distribution

For sharing beyond one repo, bundle as a **plugin**. Plugins can hold one or more skills plus MCP server config and app mappings. `.agents/skills/` is for local authoring; plugins are for distribution. `$skill-installer <name>` pulls curated skills locally.

---

## Recipes

### Pure instruction-only skill (no UI polish, no MCP)

```
weekly-status/
└── SKILL.md
```

```markdown
---
name: weekly-status
description: Draft a concise weekly status update. Use when the user asks to "write my weekly status", "summarize the week", or "draft a standup update".
---

Draft a 4-bullet status:
1. Shipped this week (link PRs)
2. In progress with current blockers
3. Coming next week
4. Asks / decisions needed

Keep each bullet under 20 words. No emoji. No filler.
```

### Polished skill with branded UI

```
weekly-status/
├── SKILL.md
├── agents/openai.yaml
└── assets/
    ├── small-400px.png
    └── large-logo.svg
```

```yaml
interface:
  display_name: "Weekly Status"
  short_description: "Draft a concise weekly status update"
  icon_small: "./assets/small-400px.png"
  icon_large: "./assets/large-logo.svg"
  brand_color: "#7C3AED"
  default_prompt: "Use $weekly-status to draft this week's update from my recent PRs."
```

### Side-effecting skill (block implicit)

```yaml
interface:
  display_name: "Deploy Production"
  short_description: "Ship the current branch to prod"
  brand_color: "#DC2626"
  default_prompt: "Use $deploy-prod to release the current branch."

policy:
  allow_implicit_invocation: false   # user must type $deploy-prod
```

### MCP-backed skill (Figma example)

```yaml
interface:
  display_name: "Figma"
  short_description: "Implement designs from Figma nodes"
  icon_small: "./assets/figma-small.svg"
  icon_large: "./assets/figma.png"
  brand_color: "#F24E1E"
  default_prompt: "Use $figma to implement the selected node."

dependencies:
  tools:
    - type: "mcp"
      value: "figma"
      description: "Figma design context"
      transport: "streamable_http"
      url: "https://mcp.figma.com/mcp"
```

Skill body then calls the MCP tools in a deterministic sequence (e.g., for Figma: `get_design_context` → `get_metadata` if truncated → `get_screenshot` for parity).

---

## Common mistakes

- **Description is a label, not a trigger.** "Figma helper" → "Use when the user asks to implement a Figma design, build UI from a Figma node, or convert a Figma URL to code."
- **Forgot to quote string values** in YAML. Unquoted hex colors / URLs blow up parsing.
- **`default_prompt` doesn't reference `$skill-name`**. Per the schema constraint, it must.
- **MCP `value` mismatch.** The string in `openai.yaml` must match the `[mcp_servers.<value>]` block in `config.toml` exactly.
- **Forgot `rmcp_client = true`** in `config.toml` - MCP connections silently fail.
- **Bearer token has quotes.** `bearer_token_env_var` resolves to the raw env value; if you wrap it in quotes when exporting, OAuth errors out.
- **Adding `openai.yaml` for a personal skill that nobody else sees.** It's overhead. Skip it.
- **Putting README/CHANGELOG/INSTALL files next to SKILL.md.** Codex doesn't read them, they're clutter.

## Best practices

- One job per skill. Split rather than bloat.
- Instructions over scripts unless determinism matters.
- Imperative steps with explicit inputs and outputs.
- Re-read the `description`: would it actually match the prompts you have in mind? Test against 3 real phrasings.
- Keep `short_description` skim-readable (25-64 chars).
- Pre-size icons before shipping: small ~400px, large ~1024px square. Match `brand_color` to the icon for cohesion.
