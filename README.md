# AIBlueprint CLI

A comprehensive CLI tool for supercharging Claude Code with security, productivity, and workflow automation features. Transform your Claude Code experience with pre-configured commands, security hooks, intelligent status displays, and specialized AI agents.

> [!NOTE]
> If you encounter permission errors when running the commands below, add `sudo` before the command.

## 🚀 Quick Start

### Option 1: Install as Claude Code Plugin (Recommended)

```bash
# Add the AIBlueprint marketplace
/plugin marketplace add melvynx/aiblueprint

# Install the base plugin
/plugin install aibp-base@AIBlueprint

# Or install directly from GitHub
/plugin install github:melvynx/aiblueprint
```

### Option 2: Use the CLI Tool

```bash
# Run immediately without installation
bunx aiblueprint-cli@latest claude-code setup

# Or install globally and use
npm install -g aiblueprint-cli
aiblueprint claude-code setup
```

## 📋 Table of Contents

- [Plugin Installation](#-plugin-installation)
- [CLI Installation & Usage](#-cli-installation--usage)
- [Command Reference](#command-reference)
- [Available Features](#available-features)
- [Configuration System](#configuration-system)
- [Templates Catalog](#templates-catalog)
- [Installation Targets](#installation-targets)
- [Security Features](#security-features)
- [Development](#development)

## 🔌 Plugin Installation

### Install from Claude Code Plugin Marketplace

The easiest way to get started is by installing AIBlueprint as a Claude Code plugin:

```bash
# Step 1: Add the AIBlueprint marketplace
/plugin marketplace add melvynx/aiblueprint

# Step 2: Install the aibp-base plugin
/plugin install aibp-base@AIBlueprint

# Alternative: Install directly from GitHub
/plugin install github:melvynx/aiblueprint
```

### What Gets Installed

The `aibp-base` plugin includes:
- ✅ **16 Custom Commands** - `/commit`, `/create-pull-request`, `/deep-code-analysis`, etc.
- ✅ **3 Specialized Agents** - explore-codebase, Snipper, websearch
- ✅ **Security Hooks** - Command validation and TypeScript processing
- ✅ **Custom Statusline** - Git status, cost tracking, and token usage
- ✅ **Notification Sounds** - Audio alerts for task completion

### Plugin Management

```bash
# List installed plugins
/plugin list

# Update plugin to latest version
/plugin update aibp-base

# Remove plugin
/plugin uninstall aibp-base

# View marketplace plugins
/plugin marketplace list
```

### Plugin vs CLI Tool

**Plugin Installation (Recommended)**:
- ✅ Automatic updates via marketplace
- ✅ No CLI tool installation needed
- ✅ Direct integration with Claude Code
- ✅ Easy to manage and update

**CLI Tool Installation**:
- ✅ More control over installation
- ✅ Custom folder locations
- ✅ Interactive feature selection
- ✅ Symlink management for other tools

## 💾 CLI Installation & Usage

### Installation Methods

```bash
# Global installation
npm install -g aiblueprint-cli
bun install -g aiblueprint-cli

# Run without installation
npx aiblueprint-cli@latest claude-code setup
pnpm dlx aiblueprint-cli@latest claude-code setup
bunx aiblueprint-cli@latest claude-code setup
```

### Basic Usage

```bash
# Interactive setup with feature selection
bunx aiblueprint-cli@latest claude-code setup

# Non-interactive setup (install all features)
bunx aiblueprint-cli@latest claude-code setup --skip

# Install to custom directory
bunx aiblueprint-cli@latest claude-code setup --folder ./custom-claude-config

# Install to project directory
cd your-project
bunx aiblueprint-cli@latest claude-code setup  # Creates .claude/ in project root
```

## 🎯 Command Reference

### Main Commands

| Command | Description | Options |
|---------|-------------|---------|
| `bunx aiblueprint-cli@latest claude-code setup` | Interactive setup with feature selection | `-f, --folder <path>` (alias for --claudeCodeFolder), `--claudeCodeFolder <path>`, `--codexFolder <path>`, `--openCodeFolder <path>`, `--factoryAiFolder <path>`, `-s, --skip` |
| `bunx aiblueprint-cli@latest claude-code symlink` | Create symlinks between CLI tools (Codex, OpenCode, FactoryAI) | `--claudeCodeFolder <path>`, `--codexFolder <path>`, `--openCodeFolder <path>`, `--factoryAiFolder <path>` |
| `bunx aiblueprint-cli@latest claude-code statusline` | Setup custom statusline with git status, costs, and token usage | `-f, --folder <path>` |
| `bunx aiblueprint-cli@latest claude-code add hook <type>` | Install specific hook | `-f, --folder <path>` |
| `bunx aiblueprint-cli@latest claude-code add commands [name]` | List or install commands | `-f, --folder <path>` |

### Command Examples

```bash
# Setup with options
bunx aiblueprint-cli@latest claude-code setup --skip                    # Install all features
bunx aiblueprint-cli@latest claude-code setup --folder ~/.my-claude     # Custom location
bunx aiblueprint-cli@latest claude-code setup --claudeCodeFolder ~/.claude --codexFolder ~/.codex  # Separate folders

# Add specific hooks
bunx aiblueprint-cli@latest claude-code add hook post-edit-typescript   # TypeScript processing hook

# Manage commands
bunx aiblueprint-cli@latest claude-code add commands                    # List all available commands
bunx aiblueprint-cli@latest claude-code add commands commit             # Install commit command
bunx aiblueprint-cli@latest claude-code add commands deep-code-analysis # Install analysis command

# Create symlinks between CLI tools
bunx aiblueprint-cli@latest claude-code symlink                         # Interactive symlink manager
bunx aiblueprint-cli@latest claude-code symlink --factoryAiFolder ~/.factory  # With custom paths

# Setup statusline
bunx aiblueprint-cli@latest claude-code statusline                      # Quick statusline setup
bunx aiblueprint-cli@latest claude-code statusline --folder ~/.my-claude # Custom location
```

### Hook Types Available

- `post-edit-typescript` - Automatic TypeScript file processing (Prettier + ESLint + type checking)

### Installation Behavior

The CLI intelligently determines where to install configurations:

1. **Project Local** (`.claude/` in project root) - When run in a Git repository
2. **Global** (`~/.claude/`) - When not in a Git repository or with custom folder
3. **Custom Path** - When using `--folder` option

## ✨ Available Features

### 🛡️ Shell Shortcuts
- **`cc`** - Claude Code with permissions skipped (`claude --dangerously-skip-permissions`)
- **`ccc`** - Claude Code with continue mode (`claude --dangerously-skip-permissions -c`)
- Platform support: macOS (`.zshenv`), Linux (`.bashrc`/`.zshrc`)

### 🔒 Command Validation
- **700+ line security system** protecting against dangerous bash commands
- **Real-time validation** before command execution via PreToolUse hooks
- **Smart detection** of privilege escalation, destructive operations, and command injection
- **Comprehensive logging** to `~/.claude/security.log` with severity levels

### 📊 Custom Statusline
- **Git integration** - Branch status, changes, and repository info
- **Cost tracking** - Session costs, daily limits, and token usage via ccusage
- **Real-time updates** - Command-triggered statusline refresh
- **Colored output** - Visual indicators for different status types
- **Quick setup** - Install with one command: `pnpm dlx aiblueprint-cli claude-code statusline`

### 🤖 AIBlueprint Commands (16 Available)

**Development Workflow**
- `commit` - Fast conventional commits with immediate push
- `create-pull-request` - Auto-generated PR creation with templates
- `fix-pr-comments` - Systematic PR review comment resolution
- `run-tasks` - Execute GitHub issues with full EPCT workflow

**Code Analysis & Research**
- `deep-code-analysis` - Comprehensive codebase investigation with research
- `explain-architecture` - Pattern analysis with ASCII diagrams
- `cleanup-context` - Memory optimization and duplicate removal

**Utilities & Automation**
- `claude-memory` - Context management for long sessions
- `watch-ci` - Automated CI/CD monitoring and failure fixing
- `prompt-command` / `prompt-agent` - Template creation utilities
- `epct` - Systematic Explore-Plan-Code-Test methodology

### 🎭 AIBlueprint Agents (3 Specialized)

- **explore-codebase** (yellow) - Comprehensive code discovery and analysis
- **Snipper** (blue) - Rapid code modification specialist with minimal output
- **websearch** (yellow) - Quick web research with authoritative sources

### 🔊 Notification Sounds
- **Finish sound** - Audio alert for completed operations (macOS afplay)
- **Need-human sound** - Audio alert for attention requests
- **Volume control** - Configurable audio levels

### 🔗 Symlink Management
- **Multi-tool integration** - Create symlinks between Claude Code, Codex, OpenCode, and FactoryAI
- **Interactive selection** - Choose source, content type (commands/agents), and destinations
- **Smart validation** - Prevents overwriting non-symlink directories and validates paths
- **Bidirectional sync** - Sync commands and agents in any direction
- **Supported tools:**
  - **Claude Code** - Commands + Agents (`~/.claude/`)
  - **Codex** - Commands only (`~/.codex/prompts`)
  - **OpenCode** - Commands only (`~/.config/opencode/command`)
  - **FactoryAI** - Commands + Droids/Agents (`~/.factory/`)

## ⚙️ Configuration System

### Settings.json Structure

The CLI automatically manages your `~/.claude/settings.json` with:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/.claude/scripts/statusline/src/index.ts",
    "padding": 0
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "bun ~/.claude/scripts/validate-command.js"}]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{"type": "command", "command": "bun ~/.claude/hooks/hook-post-file.ts"}]
      }
    ]
  }
}
```

### GitHub Integration

- **Remote-first approach** - Always downloads latest configurations from GitHub
- **Automatic fallback** - Uses local files when GitHub is unavailable
- **Version independence** - Get updates without CLI updates
- **Rate limiting aware** - Handles GitHub API limitations gracefully

## 📚 Templates Catalog

### Commands by Category

<details>
<summary><strong>Development Workflow (4 commands)</strong></summary>

| Command | Tools | Purpose |
|---------|-------|---------|
| `commit` | `Bash(git :*)` | Quick conventional commits with immediate push |
| `create-pull-request` | `Bash(git :*)`, `Bash(gh :*)` | PR creation with auto-generated descriptions |
| `fix-pr-comments` | `Bash(gh :*)`, `Read`, `Edit` | Systematic PR review resolution |
| `run-tasks` | `Bash(gh :*)`, `Bash(git :*)` | GitHub issue execution with EPCT |

</details>

<details>
<summary><strong>Analysis & Research (2 commands)</strong></summary>

| Command | Tools | Purpose |
|---------|-------|---------|
| `deep-code-analysis` | `Task`, `WebSearch`, `mcp__context7__*` | Comprehensive codebase investigation |
| `explain-architecture` | `Read`, `Glob`, `Grep`, `Task` | Architectural pattern analysis |

</details>

<details>
<summary><strong>Maintenance & Optimization (2 commands)</strong></summary>

| Command | Tools | Purpose |
|---------|-------|---------|
| `cleanup-context` | `TodoWrite`, `MultiEdit`, `Glob` | Memory bank optimization |
| `watch-ci` | `Bash(gh :*)`, `Bash(sleep :*)` | Automated CI monitoring |

</details>

<details>
<summary><strong>Utilities (8 commands)</strong></summary>

| Command | Tools | Purpose |
|---------|-------|---------|
| `claude-memory` | `Read`, `Write`, `Edit`, `Glob` | CLAUDE.md file management |
| `epct` | `Task` | Explore-Plan-Code-Test methodology |
| `prompt-command` | `Read`, `Write`, `Edit` | Command template creation |
| `prompt-agent` | `Read`, `Write`, `Edit` | Agent template creation |

</details>

### Hooks Available

| Hook | Language | Purpose | Triggers |
|------|----------|---------|----------|
| `post-edit-typescript` | TypeScript/Bun | File processing after edits | Edit, Write, MultiEdit on .ts/.tsx |

### Scripts & Utilities

| Script | Language | Purpose |
|--------|----------|---------|
| `validate-command.js` | Bun/JavaScript | Security validation for bash commands |
| `statusline-ccusage.sh` | Bash | Git status and usage tracking display |

## 🎯 Installation Targets

### Local Project Installation (Recommended)

When run in a Git repository, creates `.claude/` in your project root:

```bash
cd your-project/
bunx aiblueprint-cli@latest claude-code setup
# Creates: your-project/.claude/
```

**Benefits:**
- Project-specific configurations
- Team collaboration ready
- Version control friendly
- Isolated environments

### Global Installation

When not in a Git repository, uses global directory:

```bash
cd ~/
bunx aiblueprint-cli@latest claude-code setup
# Creates: ~/.claude/
```

**Benefits:**
- System-wide configurations
- Works across all projects
- Persistent settings

### Custom Path Installation

Use `--folder` for specific locations:

```bash
bunx aiblueprint-cli@latest claude-code setup --folder ./custom-config
bunx aiblueprint-cli@latest claude-code setup --folder /opt/claude-config
```

## 🔐 Security Features

### Command Validation System

The security system protects against dangerous operations:

**Critical Commands Blocked:**
- `rm -rf` (with path validation)
- `dd`, `mkfs`, `fdisk` (disk operations)
- `chmod 777`, `chown -R` (permission changes)
- `curl | bash`, `wget | sh` (remote execution)
- `sudo` operations (privilege escalation)

**Security Logging:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "command": "rm -rf /",
  "severity": "CRITICAL",
  "action": "BLOCKED",
  "reason": "Destructive command with critical path"
}
```

**Safe Paths Allowed:**
- `./`, `~/`, relative paths
- `node_modules/`, `.git/`, common safe directories
- Temporary directories (`/tmp/`, `/var/tmp/`)

### Hook-Based Protection

- **PreToolUse validation** - Commands checked before execution
- **Real-time analysis** - Pattern matching and rule evaluation
- **User confirmation** - Interactive prompts for questionable commands
- **Comprehensive rules** - 50+ security patterns and checks

## 🛠️ Development

### Local Development Setup

```bash
# Clone and setup
git clone <repository>
cd aiblueprint-cli
bun install

# Development mode
bun run dev claude-code setup
bun run dev claude-code add commands

# Testing
bun run test:run                    # Run test suite
bun run dev-test                    # Test with temporary config
```

### Build and Release

```bash
# Build for distribution
bun run build                       # Compiles to dist/cli.js

# Local testing
bun run test-local                  # Creates npm link
aiblueprint claude-code setup       # Test globally

# Release (automated)
bun run release                     # Version bump, build, tag, publish
```

### Project Structure

```
src/
├── cli.ts                          # Main CLI entry point
├── commands/
│   ├── setup.ts                    # Main setup command
│   ├── addHook.ts                  # Hook installation
│   └── addCommand.ts               # Command installation
└── utils/
    ├── claude-config.ts            # Configuration utilities
    ├── file-installer.ts           # GitHub/local fallback
    └── github.ts                   # GitHub API integration

claude-code-config/                 # Template repository
├── commands/                       # Command templates
├── hooks/                          # Hook scripts
├── agents/                         # Agent configurations
├── scripts/                        # Utility scripts
└── song/                           # Notification sounds
```

### Testing Commands

```bash
# Test all major workflows
bun run dev claude-code setup --skip
bun run dev claude-code add hook post-edit-typescript
bun run dev claude-code add commands
bun run dev claude-code add commands commit

# Test with custom paths
bun run dev claude-code setup --folder ./test-config
```

## 📋 Requirements

### System Requirements
- **Runtime**: Node.js 16+ or Bun
- **Platform**: macOS (full support), Linux (partial), Windows (limited)
- **Dependencies**: Git (for repository detection)

### Claude Code Requirements
- **Claude Code**: Latest version installed
- **Permissions**: Ability to modify `~/.claude/settings.json`

### Optional Dependencies
- **bun**: Enhanced script execution and hooks
- **ccusage**: Advanced statusline with cost tracking
- **gh CLI**: GitHub integration for PR/issue commands
- **prettier**, **eslint**: TypeScript hook functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun run test:run`
5. Submit a pull request

### Adding New Templates

1. Add template files to `claude-code-config/`
2. Update metadata with YAML frontmatter
3. Test installation: `bun run dev claude-code add commands <name>`
4. Document in README

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Created by AIBlueprint** - Enhancing Claude Code for modern development workflows.

Need help? [Open an issue](https://github.com/melvynx/aiblueprint/issues) or check our [documentation](https://docs.aiblueprint.dev).