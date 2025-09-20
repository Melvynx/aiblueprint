# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Test

- `bun run build` - Compiles TypeScript to JavaScript in dist/ folder and sets executable permissions
- `bun run dev` - Run CLI directly in development mode without building
- `bun run dev-test` - Test setup command with temporary folder (removes test-claude-config first)
- `bun run test-local` - Creates npm link for local testing of the CLI
- **`bun test:run`** - Run tests in non-interactive mode (CRITICAL: use test:run to avoid interactive mode)

### Release

- `bun run release` - Automated release using release-it (version bump, build, git tag, npm publish)
- `bun run prepublishOnly` - Runs automatically before npm publish to ensure build

## Project Architecture

This is a CLI tool built with TypeScript and Bun that sets up Claude Code configurations with AIBlueprint defaults.

### Core Structure

- **Entry Point**: `src/cli.ts` - Commander.js CLI setup with main command structure
- **Commands**: `src/commands/setup.ts` - Main setup logic for configuring Claude Code
- **Config Source**: `claude-code-config/` - Contains all the configuration templates to be copied

### Key Components

**CLI Command Structure**:

- `aiblueprint claude-code setup` - Main setup command
- Options: `-f/--folder` (custom install path), `-s/--skip` (skip interactive prompts)

**Setup Process** (`src/commands/setup.ts`):

1. Interactive feature selection using `@clack/prompts`
2. Copies configuration files from `claude-code-config/` to `~/.claude/` (or custom folder)
3. Updates `~/.claude/settings.json` with new hooks and configurations
4. Installs dependencies (`bun`, `ccusage`) if needed
5. Sets up shell aliases (`cc`, `ccc`) in shell config files

**Configuration Features**:

- **Shell Shortcuts**: Aliases for Claude Code with permissions skipped
- **Command Validation**: Pre-tool-use hooks for bash command security
- **Custom Statusline**: Shows git info, costs, and token usage via ccusage
- **AIBlueprint Commands**: Pre-configured command templates
- **AIBlueprint Agents**: Specialized AI agents for different tasks
- **Output Styles**: Custom output formatting
- **Notification Sounds**: Audio alerts for events

### Important Files

- `package.json` - ESM module with Bun as runtime, Commander.js for CLI
- `tsconfig.json` - Modern TypeScript config with ESNext target and bundler resolution
- `claude-code-config/` - Contains all templates (agents, commands, scripts, etc.)

### Dependencies

- **Runtime**: `@clack/prompts`, `commander`, `fs-extra`, `chalk`
- **Build**: Uses Bun for building and runtime
- **External**: Requires `bun` and `ccusage` to be installed globally for full functionality

### Platform Support

- macOS (primary) - Uses `.zshenv` for shell shortcuts
- Linux - Supports bash/zsh via `.bashrc`/`.zshrc`
- Windows - Limited support (shell shortcuts not available)

## Critical Workflow

- **AFTER EVERY MODIFICATION**: Always run `bun test:run` to verify changes
- **CRITICAL**: Use `test:run` specifically to avoid interactive mode
- **NEVER** skip tests after code changes
- **NEVER** manually test CLI commands - ALWAYS use the test workflow to verify functionality
- **REQUIRED**: Use tests to validate behavior instead of manual command execution

## Important : BEFORE EDITING

Read the docs of Claude. Example : you need to add a "hook" commands, read first : https://docs.claude.com/en/docs/claude-code/hooks

Do the same for each commands you want to update.
