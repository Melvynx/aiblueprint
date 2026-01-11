# Scripts - Project Memory

Monorepo containing Claude Code utilities and extensions.

## Structure

```
scripts/
├── auto-rename-session/  # Auto-generates session titles via AI
├── claude-code-ai/       # Shared Claude API helpers
├── command-validator/    # Security validation for bash commands
├── statusline/           # Custom statusline for Claude Code
└── package.json          # Root package with all scripts
```

## Commands

```bash
bun run test              # Run ALL tests (186 tests)
bun run lint              # Lint all packages
```

### Per-Package Commands

| Package | Test | Start |
|---------|------|-------|
| auto-rename-session | `bun run auto-rename:test` | `bun run auto-rename:start` |
| claude-code-ai | `bun run ai:test` | - |
| command-validator | `bun run validator:test` | `bun run validator:cli` |
| statusline | `bun run statusline:test` | `bun run statusline:start` |

## Cross-Platform Support

All packages support macOS, Linux, and Windows (via WSL):
- Use `path.join()` instead of string concatenation
- Use `os.homedir()` instead of `process.env.HOME`
- Use `path.sep` or regex `[/\\]` for path splitting

## Shared Dependencies

- `@ai-sdk/anthropic` + `ai` - Claude API access
- `picocolors` - Terminal colors
- `@biomejs/biome` - Linting/formatting
- `bun:test` - Testing

## Credentials

Claude Code OAuth tokens are retrieved via `claude-code-ai/helper/credentials.ts`:
- macOS: Keychain (`security find-generic-password`)
- Linux/Windows: `~/.claude/.credentials.json`
