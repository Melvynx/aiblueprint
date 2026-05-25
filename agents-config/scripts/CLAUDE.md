# Scripts - Project Memory

Lightweight script bundle for Claude Code utilities.

## Structure

```
scripts/
├── statusline/           # Custom statusline for Claude Code
└── package.json          # Root package with all scripts
```

## Commands

```bash
bun run test              # Run statusline tests
bun run lint              # Lint scripts
```

### Per-Package Commands

| Package | Test | Start |
|---------|------|-------|
| statusline | `bun run statusline:test` | `bun run statusline:start` |

## Cross-Platform Support

All packages support macOS, Linux, and Windows (via WSL):
- Use `path.join()` instead of string concatenation
- Use `os.homedir()` instead of `process.env.HOME`
- Use `path.sep` or regex `[/\\]` for path splitting

## Shared Dependencies

- `picocolors` - Terminal colors
- `@biomejs/biome` - Linting/formatting
- `bun:test` - Testing
