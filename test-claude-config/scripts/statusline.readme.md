# Claude Code Statusline with ccusage Integration

A custom statusline script that integrates with [ccusage](https://github.com/ryoppippi/ccusage) to display real-time Claude Code usage statistics, including session costs, daily usage, and token counts.

## Features

- 🌿 **Git branch status** with change indicators (+/-) 
- 📁 **Current directory** name
- 🤖 **Claude model** being used
- 💰 **Session cost** for current conversation 
- 📅 **Daily cost** total
- 🧊 **Block cost** with remaining time
- 🧩 **Token count** for current session (input + output only)

## Requirements

- [ccusage](https://github.com/ryoppippi/ccusage) v15.9.4 or later (for `--id` support)
- `jq` for JSON parsing
- `git` for repository information

## Installation

```bash
# Install ccusage
npm install -g ccusage

# Make script executable
chmod +x statusline-ccusage.sh
```

## Usage

The script expects Claude Code input format via stdin:

```bash
echo '{"session_id":"your-session-id","model":{"display_name":"Claude 3.5 Sonnet"},"workspace":{"current_dir":"/path/to/project"}}' | ./statusline-ccusage.sh
```

## How It Works

### Session Data Retrieval

The script uses the new `ccusage session --id` functionality (added in ccusage v15.9.4) to fetch session data:

```bash
ccusage session --id "$session_id" --json
```

This returns detailed session information including:
- Total cost for the session
- Individual message entries with token counts
- Cache usage statistics

### Token Calculation

**Important**: The script calculates only meaningful conversation tokens:

```bash
# Only input + output tokens (excludes cache tokens)
session_tokens=$(echo "$session_data" | jq -r '.entries | map(.inputTokens + .outputTokens) | add // 0')
```

**Why exclude cache tokens?**
- Cache tokens represent context being stored/reused internally
- They don't represent the actual conversation size
- Including them inflates counts (e.g., 433K vs 2.7K tokens)
- For statusline display, conversation tokens are more meaningful

## Finding Your Claude Code Session ID

### Method 1: From Session Files

Session IDs are stored as `.jsonl` files in your Claude directory:

```bash
# Find recent session files
find ~/.claude -name "*.jsonl" | head -5

# Example output:
# /Users/user/.claude/projects/project-name/428e9ec6-86f3-43c1-a0cd-9a3986d82229.jsonl
```

The session ID is the UUID part: `428e9ec6-86f3-43c1-a0cd-9a3986d82229`

### Method 2: From ccusage Session List

```bash
# List all sessions to see available IDs
ccusage session

# The session names in the first column can sometimes be used as IDs
# But UUID-based IDs are more reliable
```

### Method 3: Test with Known Session

```bash
# Test if a session ID works
ccusage session --id "your-session-id" --json

# Returns session data if valid, or null if not found
```

## Testing the Script

### 1. Test with a Real Session ID

```bash
# Find a session ID
SESSION_ID=$(find ~/.claude -name "*.jsonl" | head -1 | xargs basename -s .jsonl)

# Test the script
echo "{\"session_id\":\"$SESSION_ID\",\"model\":{\"display_name\":\"Claude 3.5 Sonnet\"},\"workspace\":{\"current_dir\":\"$(pwd)\"}}" | ./statusline-ccusage.sh
```

### 2. Test Individual Components

```bash
# Test session data retrieval
ccusage session --id "your-session-id" --json

# Test token calculation
ccusage session --id "your-session-id" --json | jq '.entries | map(.inputTokens + .outputTokens) | add'

# Test daily usage
ccusage daily --json --since "$(date +%Y%m%d)"

# Test active blocks
ccusage blocks --active --json
```

### 3. Expected Output

The statusline should display something like:
```
🌿 main* (+15 -3) | 📁 project-name | 🤖 Claude 3.5 Sonnet | 💰 $0.26 / 📅 $8.03 / 🧊 $8.03 (2h 45m left) | 🧩 2.7K tokens
```

## Troubleshooting

### ccusage Version Issues

Ensure you have the latest version with `--id` support:

```bash
# Check version (needs 15.9.4+)
ccusage --version

# Update if needed
npm update -g ccusage

# Verify --id option exists
ccusage session --help | grep -A5 -B5 "id"
```

### Session ID Not Found

```bash
# Returns null - session doesn't exist
ccusage session --id "invalid-id" --json

# Check if session files exist
ls ~/.claude/projects/*/your-session-id.jsonl
```

### Permission Issues

```bash
# Make script executable
chmod +x statusline-ccusage.sh

# Check file permissions
ls -la statusline-ccusage.sh
```

## Integration with Claude Code

This script is designed to work with Claude Code's statusline feature. Configure it in your Claude Code settings to display real-time usage information during your coding sessions.

## What We Improved

### Before (Custom Logic)
- 50+ lines of complex session file parsing
- Manual JSONL file searching and parsing
- Inconsistent cost calculations
- Included cache tokens (inflated counts)

### After (ccusage Integration)
- ~10 lines using official ccusage API
- Reliable session data via `ccusage session --id`
- Consistent cost calculations matching ccusage
- Only meaningful conversation tokens displayed

The new approach is more maintainable, accurate, and leverages the official ccusage functionality instead of duplicating complex logic.