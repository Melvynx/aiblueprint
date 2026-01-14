# AIBlueprint CLI

Supercharge Claude Code with security hooks, custom commands, intelligent statusline, and workflow automation.

📚 **[Full Documentation](https://codelynx.dev/docs)** | 🎯 [Premium Features](https://mlv.sh/claude-cli)

## 🚀 Quick Start

```bash
# Run setup (no installation required)
npx aiblueprint-cli@latest claude-code setup
```

## ✨ Features

- **🛡️ Security** - Command validation hooks blocking dangerous operations
- **📊 Statusline** - Git status, cost tracking, and token usage display
- **🤖 Commands** - 16 pre-configured workflow automation commands
- **🎭 Agents** - 3 specialized AI agents for codebase exploration
- **⚡ Scripts** - Built-in utilities for spending reports and usage stats

## 📦 Installation

### Option 1: Plugin (Recommended)

```bash
/plugin marketplace add melvynx/aiblueprint
/plugin install aibp-base@AIBlueprint
```

### Option 2: CLI Tool

```bash
# Run without installation
npx aiblueprint-cli@latest claude-code setup

# Or install globally
npm install -g aiblueprint-cli
```

## 🎯 Usage

### Setup

```bash
# Interactive setup
npx aiblueprint-cli@latest claude-code setup

# Install all features (no prompts)
npx aiblueprint-cli@latest claude-code setup --skip

# Custom location
npx aiblueprint-cli@latest claude-code setup --folder ~/.my-claude
```

### Statusline Scripts

Run utility scripts from anywhere:

```bash
# List available scripts
npx aiblueprint-cli@latest claude-code statusline --list

# Today's spending report
npx aiblueprint-cli@latest claude-code statusline spend:today

# Weekly usage analysis
npx aiblueprint-cli@latest claude-code statusline weekly

# Configure statusline
npx aiblueprint-cli@latest claude-code statusline config
```

**Available scripts:**
- `spend:today` / `spend:month` / `spend:project` - Spending reports
- `stats` - Daily usage statistics
- `weekly` - Weekly usage analysis
- `config` - Interactive configuration
- `migrate` - Migrate to SQLite database

### Other Commands

```bash
# Add specific hooks
npx aiblueprint-cli@latest claude-code add hook post-edit-typescript

# Manage commands
npx aiblueprint-cli@latest claude-code add commands
npx aiblueprint-cli@latest claude-code add commands commit

# Create symlinks between tools
npx aiblueprint-cli@latest claude-code symlink
```

## 📚 What You Get

### Security Hooks

- **Command validation** - Blocks `rm -rf`, privilege escalation, remote execution
- **TypeScript processing** - Auto-format and lint after file edits
- **Security logging** - Tracks all blocked commands to `~/.claude/security.log`

### Custom Statusline

- Git branch, changes, and repository info
- Session costs and daily limits via ccusage
- Real-time token usage tracking
- Colored visual indicators

### Commands (16 Available)

**Development:**
- `commit` - Fast conventional commits
- `create-pull-request` - Auto-generated PRs
- `fix-pr-comments` - Resolve PR comments
- `run-tasks` - Execute GitHub issues

**Analysis:**
- `deep-code-analysis` - Comprehensive codebase investigation
- `explain-architecture` - Pattern analysis with diagrams
- `cleanup-context` - Memory optimization

**Utilities:**
- `claude-memory` - CLAUDE.md management
- `watch-ci` - Automated CI monitoring
- `epct` - Explore-Plan-Code-Test methodology

### Agents (3 Specialized)

- **explore-codebase** - Code discovery and analysis
- **Snipper** - Fast code modifications
- **websearch** - Quick web research

### Shell Shortcuts

- `cc` - Claude Code with permissions skipped
- `ccc` - Claude Code with continue mode

## 💎 Premium

Unlock advanced features at [mlv.sh/claude-cli](https://mlv.sh/claude-cli)

```bash
# Activate premium
npx aiblueprint-cli@latest claude-code pro activate YOUR_TOKEN

# Setup premium configs
npx aiblueprint-cli@latest claude-code pro setup
```

## 🛠️ Development

```bash
# Clone and setup
git clone <repository>
cd aiblueprint-cli
bun install

# Development mode
bun run dev claude-code setup
bun run dev claude-code statusline --list

# Run tests
bun run test:run

# Build and test locally
bun run build
bun run test-local
```

## 📋 Requirements

- Node.js 16+ or Bun
- Claude Code installed
- Optional: `bun`, `ccusage`, `gh CLI`

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

Need help? [Open an issue](https://github.com/melvynx/aiblueprint/issues) | [Documentation](https://codelynx.dev/docs)
