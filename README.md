# AIBlueprint CLI

A CLI tool for setting up Claude Code configurations with AIBlueprint defaults.

## Development

### Setup

```bash
# Install dependencies (includes release-it)
bun install
```

### Testing & Development

```bash
# Build the CLI
bun run build

# Test locally with npm link
npm link

# Test the CLI
aiblueprint claude-code setup

# Or test directly with node
node dist/cli.js claude-code setup

# Test with custom folder (for development)
mkdir ./test-claude-config
node dist/cli.js claude-code -f ./test-claude-config setup

# Run in development mode
bun run dev claude-code setup
```

### Publishing

#### Automated Release (Recommended)

```bash
# This will automatically:
# 1. Increment version
# 2. Build the project
# 3. Create git tag
# 4. Publish to npm
bun run release
```

#### Manual Release

```bash
# Build first
bun run build

# Then publish
npm publish
```

### Scripts

- `bun run build` - Build the TypeScript to JavaScript
- `bun run dev` - Run in development mode
- `bun run release` - Automated release with version bump and publish
- `bun run test-local` - Test locally with npm link

## Usage

### Installation

```bash
# Install globally
npm install -g aiblueprint-cli

# Or use with npx/pnpm dlx
npx aiblueprint-cli claude-code setup
pnpm dlx aiblueprint-cli claude-code setup
```

### Setup Claude Code Configuration

```bash
aiblueprint claude-code setup
```

This will interactively set up your Claude Code environment with:

- **Shell shortcuts** - Add `cc` and `ccc` aliases for quick access
- **Command validation** - Security hook for bash commands
- **Custom statusline** - Shows git, costs, tokens info
- **AIBlueprint commands** - Pre-configured command templates
- **AIBlueprint agents** - Specialized AI agents
- **Output styles** - Custom output formatting
- **Notification sounds** - Audio alerts for events

## What it does

The setup command will:

1. Create `~/.claude/` directory if it doesn't exist
2. Copy selected configurations to your `.claude` folder
3. Update your `~/.claude/settings.json` with new configurations
4. Install required dependencies (`bun`, `ccusage`)
5. Add shell aliases to your shell configuration file

## Shell Shortcuts

After setup, you can use:
- `cc` - Claude Code with permissions skipped
- `ccc` - Claude Code with permissions skipped and continue mode

## Requirements

- Node.js 16+
- macOS or Linux
- Claude Code installed

## License

MIT
