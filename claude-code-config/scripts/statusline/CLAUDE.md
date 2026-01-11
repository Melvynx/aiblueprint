# Claude Code Statusline - Project Memory

## Overview

Clean, type-safe statusline implementation for Claude Code using Bun + TypeScript. Displays real-time session information, git status, context usage, and Claude API rate limits.

## Project Setup & Configuration

### Dependencies

- **Bun**: Runtime (uses `$` for shell commands)
- **@biomejs/biome**: Linting & formatting
- **TypeScript**: Type safety

No external npm packages required - pure Bun APIs.

### Configuration in Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun /Users/melvynx/.claude/scripts/statusline/src/index.ts",
    "padding": 0
  }
}
```

### Authentication

OAuth token stored in macOS Keychain:

- **Service**: `Claude Code-credentials`
- **Format**: JSON with `claudeAiOauth.accessToken`
- **Token type**: `sk-ant-oat01-...` (OAuth token, not API key)
- **Access**: `security find-generic-password -s "Claude Code-credentials" -w`

## Architecture

### Modular Design

The project follows a clean architecture with separated concerns:

```
src/
├── index.ts              # Main entry - orchestrates all components
└── lib/
    ├── types.ts          # TypeScript interfaces (HookInput)
    ├── git.ts            # Git operations (branch, changes)
    ├── context.ts        # Transcript parsing & context calculation
    ├── usage-limits.ts   # Claude OAuth API integration
    └── formatters.ts     # Display utilities & colors
```

### Data Flow

```
Claude Code Hook → stdin JSON → index.ts
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            [Get Git Status]            [Get Context Data]
                    ↓                               ↓
            [Format Branch]             [Get Usage Limits]
                    ↓                               ↓
                    └───────────────┬───────────────┘
                                    ↓
                            [Build Output Lines]
                                    ↓
                            stdout (2 lines)
```

## Component Specifications

### Context Calculation (`lib/context.ts`)

- **Purpose**: Calculate token usage from Claude Code transcript files
- **Algorithm**: Parses `.jsonl` transcript, finds most recent main-chain entry
- **Tokens counted**: `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`
- **Excludes**: Sidechain entries (agent calls), API error messages
- **Output**: `{ tokens: number, percentage: number }` (0-100% of 200k context)

### Usage Limits (`lib/usage-limits.ts`)

- **Purpose**: Fetch Claude API rate limits from OAuth endpoint
- **Auth**: Retrieves OAuth token from macOS Keychain (`Claude Code-credentials`)
- **API**: `https://api.anthropic.com/api/oauth/usage`
- **Data**: Five-hour window utilization + reset time
- **Error handling**: Fails silently, returns null on errors

### Git Status (`lib/git.ts`)

- **Purpose**: Show current branch and uncommitted changes
- **Detection**: Checks both staged and unstaged changes
- **Output**: Branch name + line additions/deletions
- **Display**: `main* (+123 -45)` with color coding

### Formatters (`lib/formatters.ts`)

- **Colors**: ANSI color codes for terminal output
- **Token display**: `62.5K`, `1.2M` format
- **Time formatting**: `3h21m`, `45m` for countdowns
- **Reset time**: Calculates difference between API reset time and now

## Output Specification

### Line 1: Session Info

```
main* (+123 -45) | ~/.claude | Sonnet 4.5
```

### Line 2: Metrics

```
$0.17 (6m) | 62.5K tokens | 31% | 15% (3h27m)
```

**Components:**

- `$0.17` - Session cost (USD)
- `(6m)` - Session duration
- `62.5K tokens` - Context tokens used (from transcript)
- `31%` - Context percentage (tokens / 200k)
- `15%` - Five-hour usage (from Claude API)
- `(3h27m)` - Time until rate limit resets

## Development

### Testing

```bash
# Run test with fixture
bun run test

# Use custom fixture
bun run test fixtures/custom.json

# Manual test
echo '{ ... }' | bun run start
```

### Code Conventions

- **ALWAYS** use camelCase for variables and functions
- Use TypeScript strict mode
- Follow Biome formatting rules

### Error Handling & Performance

**Error Handling** - All components fail silently:

- Missing transcript → 0 tokens, 0%
- API failure → No usage limits shown
- Git errors → "no-git" branch
- Keychain access denied → No usage limits

This ensures statusline never crashes Claude Code.

**Performance Benchmarks:**

- Context calculation: ~10-50ms (depends on transcript size)
- API call: ~100-300ms (cached by Claude API)
- Git operations: ~20-50ms
- Total: < 500ms typical

## Maintenance Guide

### Adding New Metrics

1. Add interface to `lib/types.ts`
2. Create fetcher in `lib/*.ts`
3. Import in `index.ts`
4. Add to `buildSecondLine()`

### Modifying Display

- Colors: Edit `lib/formatters.ts` colors constant
- Layout: Modify `buildFirstLine()` / `buildSecondLine()`
- Formatting: Add functions to `lib/formatters.ts`

## Known Limitations

- macOS only (uses Keychain)
- Requires `git` CLI for git status
- Requires Claude Code OAuth (not API key)
- Transcript must be accessible (permissions)

## Critical Requirements

### Configuration Updates

- **CRITICAL**: When updating `statusline.config.json` or `statusline.config.ts`, you **MUST** update the interactive demo in `src/commands/interactive-config.ts`
- **ALWAYS** run `bun run config` after config changes to verify the interactive demo works correctly
- **REQUIRED**: Keep config file structure in sync with interactive prompts

### Runtime & Dependencies

- **ALWAYS** use Bun for all commands and runtime operations
- Use `bun run <script>` instead of `npm run` or `pnpm run`
- Use `bun install` for dependency management
- **AUTHORIZED LIBRARIES**: `@biomejs/biome` for linting/formatting, third-party libraries like `tiers` are permitted if needed
- **NEVER** add external npm packages without verification - prefer Bun APIs first
