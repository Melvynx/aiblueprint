# AIBlueprint CLI

Supercharge Claude Code and Codex with security hooks, reusable skills, a lightweight statusline, and workflow automation.

📚 **[Full Documentation](https://codelynx.dev/docs)** | 🎯 [Premium Features](https://mlv.sh/claude-cli)

## 🚀 Quick Start

```bash
# Run setup (no installation required)
npx aiblueprint-cli@latest agents setup
```

## ✨ Features

- **🛡️ Security** - Command validation hooks blocking dangerous operations
- **📊 Statusline** - Git status and session context display
- **🤖 Skills** - 30+ reusable workflow skills
- **🎭 Agents** - 3 specialized AI agents for codebase exploration
- **⚡ Scripts** - Built-in statusline utilities

## 📦 Installation

### Option 1: Plugin (Recommended)

```bash
/plugin marketplace add melvynx/aiblueprint
/plugin install aibp-base@AIBlueprint
```

### Option 2: CLI Tool

```bash
# Run without installation
npx aiblueprint-cli@latest agents setup

```

## 🎯 Usage

### Setup

```bash
# Interactive setup
npx aiblueprint-cli@latest agents setup

# Install all features (no prompts)
npx aiblueprint-cli@latest agents setup --skip

# Custom location
npx aiblueprint-cli@latest agents setup --folder ~/.my-claude
```

### Statusline

Install a lightweight Claude Code statusline:

```bash
npx aiblueprint-cli@latest agents setup
```

### Other Commands

```bash
# Add specific hooks
npx aiblueprint-cli@latest agents add hook post-edit-typescript

# Create symlinks between tools
npx aiblueprint-cli@latest agents symlink

# Centralize global skills and agents in ~/.agents
npx aiblueprint-cli@latest agents unify

# Choose what to centralize interactively
npx aiblueprint-cli@latest agents unify -i

# Unify project-local .claude/.cursor config into .agents
npx aiblueprint-cli@latest agents unify projects

# Unify only selected project categories
npx aiblueprint-cli@latest agents unify projects --agents-md --skills --rules

# Recover sessions from saved configs and backups
npx aiblueprint-cli@latest agents config unify sessions
```

## 📚 What You Get

### Security Hooks

- **Command validation** - Blocks `rm -rf`, privilege escalation, remote execution
- **TypeScript processing** - Auto-format and lint after file edits
- **Security logging** - Tracks all blocked commands to `~/.claude/security.log`

### Custom Statusline

- Git branch, changes, and repository info
- Session context and duration
- Colored visual indicators

### Workflow Skills

The free configuration ships the skills listed in the catalog below. The CLI
installs every directory under `agents-config/skills/`.

### Agents (3 Specialized)

- **explore-codebase** - Code discovery and analysis
- **Snipper** - Fast code modifications
- **websearch** - Quick web research

### Shell Shortcuts

- `cc` - Claude Code with permissions skipped
- `ccc` - Claude Code with continue mode
- `cx` - Codex
- `cxc` - Codex continue mode for the current directory

### Skills

Install skills directly into `~/.claude/skills/`:

```bash
# Install all skills
npx skills@latest add melvynx/aiblueprint

# Install a single skill
npx skills add Melvynx/aiblueprint --skill app-icon

# Install multiple skills
npx skills add Melvynx/aiblueprint --skill rules-manager
npx skills add Melvynx/aiblueprint --skill skill-manager
```

**Available skills:**

| Skill | Description |
|-------|-------------|
| `agents-manager` | Create and orchestrate Claude Code agents |
| `apex` | Structured implementation workflow |
| `app-icon` | Generate and prepare app icons |
| `appstore-connect` | Manage App Store Connect workflows |
| `audit-memories` | Manually audit and clean project agent documentation |
| `audit-skills` | Manually audit skill usage, invocation controls, duplicates, and scope |
| `grill-me` | Stress-test a plan with focused questions |
| `hooks-manager` | Create and debug Claude Code hooks |
| `environments-manager` | Set up per-worktree agent environments |
| `rules-manager` | Create and maintain agent rule files |
| `skill-manager` | Manage skills and rules across Claude Code, Codex, and Cursor |
| `use-style` | Apply named UI style guides before implementation |

## 🤖 Assistant Pro

Install the latest complete skill bundle from the private
[`assistant-pro-skills`](https://github.com/Melvynx/assistant-pro-skills)
repository:

```bash
npx aiblueprint-cli@latest assistants pro setup
```

The command asks for the Assistant Pro access key when needed, installs the
versioned `all` bundle into `~/.agents/skills`, creates Claude Code and Codex
skill symlinks, adds the shared directory to Hermes, and exposes the same skills
to OpenClaw through its native `~/.agents/skills` discovery.

## 💎 Agents Config Pro

Unlock advanced features at [mlv.sh/claude-cli](https://mlv.sh/claude-cli)

```bash
# Setup premium configs (prompts for your token if needed)
npx aiblueprint-cli@latest agents pro setup

# Or activate first if you prefer
npx aiblueprint-cli@latest agents pro activate YOUR_TOKEN
```

## 🛠️ Development

```bash
# Clone and setup
git clone <repository>
cd aiblueprint-cli
bun install

# Development mode
bun run dev agents setup
bun run dev agents statusline --list

# Run tests
bun run test:run

# Build and test locally
bun run build
bun run test-local
```

## 📋 Requirements

- Node.js 16+ or Bun
- Claude Code installed
- Optional: `bun`, `gh CLI`
- Python 3 for `assistants pro setup`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test:run`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Created by AIBlueprint** - [mlv.sh/claude-cli](https://mlv.sh/claude-cli)

Need help? [Open an issue](https://github.com/melvynx/aiblueprint/issues) | [Documentation](https://docs.aiblueprint.dev)
