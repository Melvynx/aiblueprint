# Matchers

Matchers are JavaScript regular expressions tested against the tool name. Use `Bash` for one tool, `Write|Edit` for alternatives, `^Bash` for a tool family, `mcp__.*` for all MCP tools, and `mcp__github__.*` for one MCP server. Omitting `matcher` matches every tool for that event.

Patterns are case-sensitive. Validate uncertain patterns in isolation:

```bash
node -e "console.log(/Bash/.test('Bash'))"
```
