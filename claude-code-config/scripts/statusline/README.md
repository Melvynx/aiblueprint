# Claude Code Statusline

Clean, modular statusline for Claude Code with TypeScript + Bun.

## Features

- 🌿 Git branch with changes (+added -deleted)
- 💰 Session cost and duration
- 🧩 Context tokens used
- 📊 Context percentage (0-100%)
- ⏱️ Five-hour usage limit with reset time

## Structure

```
src/
├── index.ts              # Main entry point
└── lib/
    ├── types.ts          # TypeScript interfaces
    ├── git.ts            # Git status
    ├── context.ts        # Context calculation from transcript
    ├── usage-limits.ts   # Claude API usage limits
    └── formatters.ts     # Formatting utilities
```

## Development

```bash
# Install dependencies
bun install

# Run the statusline (needs stdin JSON)
echo '{ ... }' | bun run start

# View today's spending
bun run spend:today

# View this month's spending
bun run spend:month

# Format code
bun run format

# Lint code
bun run lint
```

## Spend Tracking

The statusline automatically saves session data to `data/spend.json`. You can view your spending with:

```bash
# Today's sessions and cost
bun run spend:today

# This month's sessions grouped by date
bun run spend:month
```

Each session tracks:
- Cost (USD)
- Duration
- Lines added/removed
- Working directory

## Usage in Claude Code

Update your `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun /Users/melvynx/.claude/scripts/statusline/src/index.ts",
    "padding": 0
  }
}
```

## Testing

```bash
echo '{
  "session_id": "test",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path",
  "model": {
    "id": "claude-sonnet-4-5",
    "display_name": "Sonnet 4.5"
  },
  "workspace": {
    "current_dir": "/path",
    "project_dir": "/path"
  },
  "version": "2.0.31",
  "output_style": { "name": "default" },
  "cost": {
    "total_cost_usd": 0.15,
    "total_duration_ms": 300000,
    "total_api_duration_ms": 200000,
    "total_lines_added": 100,
    "total_lines_removed": 50
  }
}' | bun run start
```
