# Claude Code Statusline

Clean, modular statusline for Claude Code with TypeScript + Bun.

## Features

- 🌿 Git branch with changes (+added -deleted)
- 💰 Session cost and duration
- 🧩 Context tokens used
- 📊 Context percentage (0-100%)
- ⏱️ Five-hour usage limit with reset time
- 📅 Weekly usage limit with configurable threshold
- 📈 Daily usage percentage tracking and statistics

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

# View usage statistics
bun run stats

# Interactive config demo
bun run demo

# Format code
bun run format

# Lint code
bun run lint
```

## Tracking Features

### Spend Tracking

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

### Usage Statistics

Daily usage percentages are automatically tracked in `data/daily-usage.json`. Each 5-hour rate limit period is tracked separately using the `resets_at` timestamp as a unique key.

```bash
bun run stats
```

This shows:
- Average daily usage percentage across all tracked days
- Total days and total 5-hour periods tracked
- Recent 7-day usage history with visual bars
- Per-day statistics: average, max, min across all 5-hour periods
- Data is kept for 90 days

**How it works:**
- Each `resets_at` value represents a unique 5-hour rate limit period
- Multiple 5-hour periods can occur in a single day
- If the API is called multiple times during the same 5-hour period, only the latest value is kept
- Daily statistics show the average, maximum, and minimum usage across all periods in that day

## Interactive Demo

Explore all configuration options with a live preview:

```bash
bun run demo
```

This opens an interactive menu where you can:
- Toggle any config option with arrow keys and spacebar
- See instant preview of how the statusline changes
- Navigate through all available settings
- Reset to defaults with `R`
- Explore session, limits, weekly usage, and git display options

**Controls:**
- `↑↓` or `j/k` - Navigate options
- `Space` - Toggle selected option
- `R` - Reset to defaults
- `Q` - Quit

## Configuration

The statusline can be customized via `statusline.config.ts`. Key configuration options:

### Weekly Usage Display

```typescript
weeklyUsage: {
  enabled: boolean | "90%",  // true: always show, false: never, "90%": show when 5-hour usage >= 90%
  showTimeLeft: boolean,
  percentage: {
    enabled: boolean,
    progressBar: {
      enabled: boolean,
      length: 5 | 10 | 15,
      style: "filled" | "rectangle" | "braille",
      color: "progressive" | "green" | "yellow" | "red"
    }
  }
}
```

**Default:** `enabled: "90%"` - Weekly limits appear when your 5-hour usage reaches 90%

Display format: `W: ⣿⣿⣧⣀⣀⣀⣀⣀⣀⣀ 45% (6d12h)`

### Other Configuration Options

- **Session display**: Cost, tokens, context percentage
- **Limits display**: Five-hour usage limits
- **Git display**: Branch, changes, staged/unstaged files
- **Path display**: Full, truncated, or basename modes
- **Progress bars**: Multiple styles and color schemes

See `statusline.config.ts` for all available options and defaults.

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
