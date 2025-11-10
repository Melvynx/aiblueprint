# Command Validator

A secure command validation package for Claude Code's PreToolUse hook. This package validates bash commands before execution to prevent dangerous operations.

## Features

- **Comprehensive Security Rules**: Blocks dangerous commands (rm -rf /, dd, mkfs, etc.)
- **Pattern Matching**: Detects malicious patterns like fork bombs, backdoors, and data exfiltration
- **Path Protection**: Prevents writes to system directories (/etc, /usr, /bin, etc.)
- **Command Chaining**: Validates chained commands (&&, ||, ;)
- **Fully Tested**: 82+ tests with Vitest ensuring reliable validation

## Installation

```bash
bun install
```

## Usage

### As a Claude Code Hook

The validator is configured as a PreToolUse hook in Claude Code settings:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bun /Users/melvynx/.claude/scripts/command-validator/src/cli.ts"
          }
        ]
      }
    ]
  }
}
```

### Programmatic Usage

```typescript
import { CommandValidator } from "./src/lib/validator";

const validator = new CommandValidator();
const result = validator.validate("rm -rf /");

if (!result.isValid) {
  console.log(`Blocked: ${result.violations.join(", ")}`);
  console.log(`Severity: ${result.severity}`);
}
```

## Testing

```bash
# Run all tests
bun test

# Run tests with UI
bun test:ui
```

## Test Coverage

The test suite includes:

### Safe Commands (Must Allow)
- Standard utilities: ls, git, npm, pnpm, node, python
- File operations: cat, cp, mv, mkdir, touch
- Safe command chains with &&

### Dangerous Commands (Must Block)
- System destruction: rm -rf /, dd, mkfs, fdisk
- Privilege escalation: sudo, chmod, chown, passwd
- Network attacks: nc, nmap, telnet
- Malicious patterns: fork bombs, backdoors, log manipulation
- Sensitive file access: /etc/passwd, /etc/shadow, /etc/sudoers

### Special Cases
- rm -rf safety: Allows deletions in safe paths (/Users/melvynx/Developer/, /tmp/)
- Protected paths: Blocks dangerous operations on /etc, /usr, /bin, etc.
- Binary content detection
- Command length limits

## Architecture

```
src/
├── cli.ts                 # CLI entry point (used by Claude Code hook)
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── security-rules.ts  # Security rules database
│   └── validator.ts       # Core validation logic
└── __tests__/
    └── validator.test.ts  # Comprehensive test suite
```

## Security Rules

### Critical Commands
- `del`, `format`, `mkfs`, `shred`, `dd`, `fdisk`, `parted`

### Privilege Escalation
- `sudo`, `su`, `passwd`, `chpasswd`, `usermod`, `chmod`, `chown`

### Network Commands
- `nc`, `netcat`, `nmap`, `telnet`, `ssh-keygen`, `iptables`

### System Manipulation
- `systemctl`, `service`, `kill`, `killall`, `mount`, `umount`

### Protected Paths
- `/etc/`, `/usr/`, `/sbin/`, `/boot/`, `/sys/`, `/proc/`, `/dev/`, `/root/`

## Security Logs

Security events are logged to `data/security.log` inside the package directory. The log file contains:
- Timestamp
- Session ID
- Tool name
- Command (truncated to 500 chars)
- Blocked/allowed status
- Severity level
- Violations detected

The `data/` folder is gitignored to prevent committing sensitive log data.

## Development

```bash
# Run linter
bun run lint

# Format code
bun run format

# Type check
bunx tsc --noEmit
```

## License

MIT
