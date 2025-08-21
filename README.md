# AIBlueprint CLI

A CLI tool for setting up Claude Code configurations with AIBlueprint defaults.

## Quick Start

```bash
# Run immediately without installation
bunx aiblueprint-cli claude-code setup
```

## Installation & Usage

```bash
# Install globally
npm install -g aiblueprint-cli

# Or use with npx/pnpm dlx/bunx
npx aiblueprint-cli claude-code setup
pnpm dlx aiblueprint-cli claude-code setup
bunx aiblueprint-cli claude-code setup
```

## What it does

The setup command will interactively configure your Claude Code environment with:

- **Shell shortcuts** - Add `cc` and `ccc` aliases for quick access
- **Command validation** - Security hook for bash commands  
- **Custom statusline** - Shows git, costs, tokens info
- **AIBlueprint commands** - Pre-configured command templates
- **AIBlueprint agents** - Specialized AI agents
- **Output styles** - Custom output formatting
- **Notification sounds** - Audio alerts for events

### Setup Process

1. Creates `~/.claude/` directory if it doesn't exist
2. Copies selected configurations to your `.claude` folder
3. Updates your `~/.claude/settings.json` with new configurations
4. Installs required dependencies (`bun`, `ccusage`)
5. Adds shell aliases to your shell configuration file

### Shell Shortcuts

After setup, you can use:
- `cc` - Claude Code with permissions skipped
- `ccc` - Claude Code with permissions skipped and continue mode

## Requirements

- Node.js 16+
- macOS or Linux
- Claude Code installed

## Development

```bash
# Install dependencies
bun install

# Build and test locally
bun run build
npm link
aiblueprint claude-code setup

# Development mode
bun run dev claude-code setup
```

## License

MIT
