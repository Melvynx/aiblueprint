# Claude Code Security Hooks - Command Validation System

A comprehensive command validation system that protects against harmful shell commands in Claude Code using PreToolUse hooks.

## Overview

This security system automatically validates all Bash commands before execution, blocking dangerous operations like:
- System destruction (rm -rf, dd, mkfs)
- Privilege escalation (sudo, passwd, chmod)
- Command injection (; && || | `)
- Remote code execution (wget|bash, curl|sh)
- Network attacks (nc, nmap, ssh-keygen)
- Sensitive file access (/etc/passwd, /etc/shadow)
- And 50+ other dangerous patterns

## Components

### 1. Validation Script
- **File:** `validate-command.js`
- **Function:** Bun script that validates commands against comprehensive security rules
- **Dependencies:** None (standalone bun script)
- **Exit Codes:** 0 = allow, 1 = block

### 2. Hook Configuration  
- **File:** `settings.json` 
- **Section:** `hooks.PreToolUse`
- **Trigger:** Before any Bash tool execution
- **Action:** Calls validation script with command data

### 3. Command Interface
- **File:** `commands/before-tools.md`
- **Purpose:** Manual testing and management interface
- **Usage:** Run `/before-tools` in Claude Code

### 4. Security Logging
- **File:** `security.log`
- **Format:** JSON logs with timestamps, commands, violations, severity
- **Retention:** Persistent (manual cleanup required)

## How It Works

1. **User triggers Bash command** in Claude Code
2. **PreToolUse hook fires** before command execution
3. **Validation script receives** JSON input with command details
4. **Security rules evaluate** command against threat patterns
5. **Decision made:** Allow (exit 0) or Block (exit 1)  
6. **Event logged** to security.log
7. **Command executes** or error shown to user

## Installation

The system is already installed and active in your Claude Code configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command", 
            "command": "bun /Users/melvynx/.claude/validate-command.js"
          }
        ]
      }
    ]
  }
}
```

## Testing

### Manual Testing

Use the `/before-tools` command in Claude Code for interactive testing, or run tests manually:

```bash
# Test safe command (should pass)
echo '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' | bun validate-command.js

# Test dangerous command (should be blocked) 
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | bun validate-command.js

# Test command injection (should be blocked)
echo '{"tool_name":"Bash","tool_input":{"command":"ls; rm -rf *"}}' | bun validate-command.js
```

### Test Results
```bash
# Safe command output
Command validation passed
[SECURITY] ALLOWED: ls -la

# Dangerous command output (to stderr)
[SECURITY] BLOCKED: rm -rf /
Command validation failed: Critical dangerous command: rm, Dangerous pattern detected: rm\s+.*(-rf|--recursive.*--force)
Severity: CRITICAL
```

## Security Rules Database

### Critical Commands (Always Blocked)
- `rm`, `del`, `format`, `mkfs`, `shred`, `dd`
- `fdisk`, `parted`, `gparted`, `cfdisk`

### Privilege Escalation (Always Blocked)  
- `sudo`, `su`, `passwd`, `chpasswd`, `usermod`
- `chmod`, `chown`, `chgrp`, `setuid`, `setgid`

### Network/Remote Access (Always Blocked)
- `nc`, `netcat`, `nmap`, `telnet`, `ssh-keygen`
- `iptables`, `ufw`, `firewall-cmd`, `ipfw`

### System Services (Always Blocked)
- `systemctl`, `service`, `kill`, `killall`, `pkill`
- `mount`, `umount`, `swapon`, `swapoff`

### Pattern Detection (50+ Regex Rules)
- File system destruction: `/rm\s+.*(-rf|--recursive.*--force)/i`
- Fork bombs: `/:\(\)\{\s*:\|:&\s*\};:/`
- Command injection: `/;\s*(rm|dd|mkfs|format)/i` 
- Remote execution: `/\|\s*(sh|bash|zsh|fish)$/i`
- Sensitive files: `/cat\s+\/etc\/(passwd|shadow|sudoers)/i`
- And many more...

### Shell Metacharacters
Blocks dangerous usage of: `;` `&` `|` `` ` `` `$` `(` `)` `{` `}` `[` `]` `<` `>` `*` `?` `~` `!`

## Security Logging

All validation events are logged to `security.log` in JSON format:

```json
{
  "timestamp": "2025-07-15T04:58:16.099Z",
  "sessionId": null,
  "toolName": "Bash", 
  "command": "rm -rf /",
  "blocked": true,
  "severity": "CRITICAL",
  "violations": [
    "Critical dangerous command: rm",
    "Dangerous pattern detected: rm\\s+.*(-rf|--recursive.*--force)"
  ],
  "source": "claude-code-hook"
}
```

### Log Analysis
```bash
# View recent security events
tail -f security.log

# Count blocked commands by severity
cat security.log | jq '.severity' | sort | uniq -c

# Find all blocked rm commands
cat security.log | jq 'select(.command | contains("rm"))'
```

## Maintenance

### Log Rotation
```bash
# Archive old logs (monthly recommended)
mv security.log security-$(date +%Y%m).log

# Or clear logs (lose audit trail)
> security.log
```

### Rule Updates
Edit `validate-command.js` to modify security rules:
- Add new dangerous commands to `SECURITY_RULES.CRITICAL_COMMANDS`
- Add new regex patterns to `SECURITY_RULES.DANGEROUS_PATTERNS`
- Modify severity levels or validation logic

### Performance
- Script executes in ~50ms per validation
- No noticeable impact on Claude Code performance
- Logs grow ~200 bytes per validation event

## Advanced Configuration

### Whitelist Override
To allow specific dangerous commands in controlled scenarios, modify the `isExplicitlyAllowed()` function:

```javascript
isExplicitlyAllowed(command, allowedPatterns = []) {
    // Add custom whitelist logic here
    if (command === "sudo systemctl restart myapp") {
        return true; // Allow this specific command
    }
    return false;
}
```

### Custom Severity Levels
Modify severity calculation in `validate()` method:

```javascript
// Add custom severity rules
if (command.includes("production")) {
    result.severity = 'CRITICAL'; // Extra protection for production
}
```

### Integration with External Systems
The validation script can be extended to integrate with:
- SIEM systems (Splunk, ELK)
- Alerting platforms (PagerDuty, Slack)
- Audit databases
- Corporate security tools

## Troubleshooting

### Hook Not Working
1. **Check hook configuration:**
   ```bash
   cat settings.json | grep -A 10 "PreToolUse"
   ```

2. **Verify script permissions:**
   ```bash
   ls -la validate-command.js
   chmod +x validate-command.js  # If needed
   ```

3. **Test script directly:**
   ```bash
   echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | bun validate-command.js
   ```

### Performance Issues
- Check log file size: `du -h security.log`
- Rotate logs if >10MB
- Monitor script execution time in Claude Code debug output

### False Positives
If safe commands are being blocked:
1. Check the specific violation in logs
2. Modify regex patterns if too broad
3. Add whitelist exceptions for specific use cases

## Security Considerations

### Limitations
- Only validates Bash commands (other tools bypass validation)
- Regex-based detection can have false positives/negatives
- Local execution means user could disable hooks
- No protection against social engineering

### Best Practices
- Regularly review security logs
- Update threat patterns based on new attack vectors
- Use principle of least privilege in permissions
- Combine with other security layers (user training, system hardening)
- Monitor for attempts to disable or bypass the validation system

### Threat Model
This system protects against:
- ✅ Accidental destructive commands
- ✅ Basic command injection attacks  
- ✅ Common malware/script patterns
- ✅ Privilege escalation attempts
- ❌ Advanced persistent threats
- ❌ Zero-day exploits
- ❌ Social engineering
- ❌ Hardware/firmware attacks

## Support

For issues or enhancements:
1. Check security logs for specific error details
2. Test validation logic manually using test commands
3. Review Claude Code hooks documentation
4. Modify security rules as needed for your environment

## Version History

- **v1.0** - Initial implementation with comprehensive security rules
- **Features:** 50+ threat patterns, JSON logging, Bun execution, PreToolUse integration