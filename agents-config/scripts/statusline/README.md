# Claude Code Statusline

Lightweight statusline for Claude Code with TypeScript + Bun.

## Features

- Git branch with staged/unstaged indicators
- Current working directory
- Model name and thinking status
- Session duration
- Context tokens and percentage

## Structure

```
src/
├── index.ts              # Main entry point
└── lib/
    ├── types.ts          # TypeScript interfaces
    ├── git.ts            # Git status
    ├── context.ts        # Context calculation from payload/transcript
    └── formatters.ts     # Formatting utilities
```

## Development

```bash
# Install dependencies
bun install

# Run the statusline (needs stdin JSON)
echo '{ ... }' | bun run statusline:start

# Interactive config
bun run statusline:config

# Format code
bun run format

# Lint code
bun run lint
```

## Interactive Config

Explore all configuration options with a live preview:

```bash
bun run statusline:config
```

This opens an interactive menu where you can:
- Toggle any config option with arrow keys and spacebar
- See instant preview of how the statusline changes
- Navigate through all available settings
- Reset to defaults with `R`
- Explore session, context, path, and git display options

**Controls:**
- `↑↓` or `j/k` - Navigate options
- `Space` - Toggle selected option
- `R` - Reset to defaults
- `Q` - Quit

## Configuration

The statusline can be customized via `statusline.config.json`.

### Other Configuration Options

- **Session display**: Duration, tokens, context percentage
- **Git display**: Branch, changes, staged/unstaged files
- **Path display**: Full, truncated, or basename modes
- **Progress bars**: Multiple styles and color schemes

See `statusline.config.json` for all available options and defaults.

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
}' | bun run statusline:start
```
