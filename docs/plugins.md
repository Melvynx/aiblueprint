# Claude Code Plugins & Marketplaces

## Plugin Directory Structure

A Claude Code plugin follows this structure:

```
your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required manifest file
├── commands/                # Slash commands (.md files)
├── agents/                  # Specialized agents (.md files)
├── hooks/                   # Hook configurations (.json)
├── .mcp.json               # MCP server definitions
├── scripts/                # Utility scripts
└── LICENSE
```

## Plugin Manifest (`plugin.json`)

**Required fields:**
- `name`: Unique identifier (kebab-case)
- `version`: Semantic version (e.g., "1.0.0")

**Optional metadata:**
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Brief plugin purpose",
  "author": "Your Name <email@example.com>",
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/user/repo",
  "license": "MIT",
  "keywords": ["cli", "tools"],
  "commands": ["./additional-commands"],
  "agents": ["./additional-agents"],
  "hooks": "./hooks/config.json",
  "mcpServers": "./.mcp.json"
}
```

**Important rules:**
- All paths relative to plugin root
- Paths must start with `./`
- Use `${CLAUDE_PLUGIN_ROOT}` for dynamic references

## Creating Your Own Marketplace

**1. Create marketplace.json** in `.claude-plugin/`:

```json
{
  "name": "my-marketplace",
  "owner": {
    "name": "Your Team",
    "email": "team@example.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./plugins/plugin-name",
      "description": "Plugin description",
      "version": "1.0.0"
    }
  ]
}
```

**2. Host on Git** (GitHub recommended)

**3. Users can add with:**
```bash
/plugin marketplace add owner/repo
/plugin install plugin-name@marketplace-name
```

## Debugging

```bash
claude --debug  # View plugin loading details
```

## Plugin Sources

Plugin entries in marketplace.json support multiple source types:

- **Relative paths**: `"source": "./plugins/plugin-name"`
- **GitHub repositories**: `"source": "github:owner/repo"`
- **Git repositories**: `"source": "https://github.com/owner/repo.git"`

## Best Practices

- Provide clear plugin descriptions
- Maintain consistent versioning (semantic versioning)
- Include comprehensive metadata in plugin.json
- Test marketplace configuration before distribution
- Use `${CLAUDE_PLUGIN_ROOT}` for portable path references
- Make scripts executable when needed
