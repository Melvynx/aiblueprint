# Claude Code Statusline - Project Memory

## Overview

Lightweight, type-safe statusline implementation for Claude Code using Bun and TypeScript. Displays session context, git status, model information, duration, and context usage without premium spend or usage-limit tracking.

## Project Setup & Configuration

### Dependencies

- **Bun**: Runtime
- **picocolors**: Terminal colors
- **@biomejs/biome**: Linting and formatting
- **TypeScript**: Type safety

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

## Architecture

```
src/
├── index.ts              # Main entry point
└── lib/
    ├── types.ts          # TypeScript interfaces
    ├── git.ts            # Git operations
    ├── context.ts        # Payload/transcript context calculation
    ├── render-pure.ts    # Pure rendering logic
    └── formatters.ts     # Display utilities and colors
```

## Data Flow

```
Claude Code hook -> stdin JSON -> index.ts
                                -> get git status
                                -> get context data
                                -> render statusline
                                -> stdout
```

## Component Notes

- `lib/context.ts` calculates context tokens from the hook payload when available, falling back to transcript parsing.
- `lib/git.ts` detects branch and staged/unstaged changes.
- `lib/render-pure.ts` renders output from prepared data and config.
- `src/commands/interactive-config.ts` must stay in sync with `statusline.config.json`.

## Development

```bash
bun run test
bun run statusline:test-fixtures
bun run statusline:config
```

Manual test:

```bash
echo '{ ... }' | bun run statusline:start
```

## Error Handling

The statusline should fail softly:

- Missing transcript -> 0 tokens, 0%
- Git errors -> no-git fallback
- Missing config -> default config
- Invalid stdin -> concise error output

## Critical Requirements

- Keep `statusline.config.json`, `defaults.json`, and `src/commands/interactive-config.ts` aligned.
- Use Bun for runtime and tests.
- Keep this free version lightweight: no spend database, no usage-limit API, no OAuth credential dependency.
