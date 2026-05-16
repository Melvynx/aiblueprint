# Scripts - Project Memory

Houses the statusline script for Claude Code.

## Structure

```
scripts/
├── statusline/           # Custom statusline for Claude Code
└── package.json          # Root package
```

## Commands

```bash
bun run test              # Run statusline tests
bun run lint              # Lint
```

### Per-Package Commands

| Package | Test | Start |
|---------|------|-------|
| statusline | `bun run statusline:test` | `bun run statusline:start` |

## Cross-Platform Support

The statusline supports macOS, Linux, and Windows (via WSL):
- Use `path.join()` instead of string concatenation
- Use `os.homedir()` instead of `process.env.HOME`
- Use `path.sep` or regex `[/\\]` for path splitting
