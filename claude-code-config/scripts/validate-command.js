#!/usr/bin/env bun

/**
 * Claude Code "Before Tools" Hook - Command Validation Script
 *
 * This script validates commands before execution to prevent harmful operations.
 * It receives command data via stdin and returns exit code 0 (allow) or 1 (block).
 *
 * Usage: Called automatically by Claude Code PreToolUse hook
 * Manual test: echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | bun validate-command.js
 */

// Comprehensive dangerous command patterns database
const SECURITY_RULES = {
  // Critical system destruction commands
  CRITICAL_COMMANDS: [
    "del",
    "format",
    "mkfs",
    "shred",
    "dd",
    "fdisk",
    "parted",
    "gparted",
    "cfdisk",
  ],

  // Privilege escalation and system access
  PRIVILEGE_COMMANDS: [
    "sudo",
    "su",
    "passwd",
    "chpasswd",
    "usermod",
    "chmod",
    "chown",
    "chgrp",
    "setuid",
    "setgid",
  ],

  // Network and remote access tools
  NETWORK_COMMANDS: [
    "nc",
    "netcat",
    "nmap",
    "telnet",
    "ssh-keygen",
    "iptables",
    "ufw",
    "firewall-cmd",
    "ipfw",
  ],

  // System service and process manipulation
  SYSTEM_COMMANDS: [
    "systemctl",
    "service",
    "kill",
    "killall",
    "pkill",
    "mount",
    "umount",
    "swapon",
    "swapoff",
  ],

  // Dangerous regex patterns
  DANGEROUS_PATTERNS: [
    // File system destruction - block rm -rf with absolute paths (checked separately)
    /rm\s+.*-rf\s*\/\s*$/i, // rm -rf ending at root directory
    /rm\s+.*-rf\s*\/etc/i, // rm -rf in /etc
    /rm\s+.*-rf\s*\/usr/i, // rm -rf in /usr
    /rm\s+.*-rf\s*\/bin/i, // rm -rf in /bin
    /rm\s+.*-rf\s*\/sys/i, // rm -rf in /sys
    /rm\s+.*-rf\s*\/proc/i, // rm -rf in /proc
    /rm\s+.*-rf\s*\/boot/i, // rm -rf in /boot
    /rm\s+.*-rf\s*\/home\/[^\/]*\s*$/i, // rm -rf entire home directory
    /rm\s+.*-rf\s*\.\.+\//i, // rm -rf with parent directory traversal
    /rm\s+.*-rf\s*\*.*\*/i, // rm -rf with multiple wildcards
    /rm\s+.*-rf\s*\$\w+/i, // rm -rf with variables (could be dangerous)
    />\s*\/dev\/(sda|hda|nvme)/i,
    /dd\s+.*of=\/dev\//i,
    /shred\s+.*\/dev\//i,
    /mkfs\.\w+\s+\/dev\//i,

    // Fork bomb and resource exhaustion
    /:\(\)\{\s*:\|:&\s*\};:/,
    /while\s+true\s*;\s*do.*done/i,
    /for\s*\(\(\s*;\s*;\s*\)\)/i,

    // Command injection (but allow general chaining - we'll validate each command separately)
    // /;\s*(rm|dd|mkfs|format)/i,  // Commented out - handled by individual command validation
    // /&&\s*(rm|dd|mkfs|format)/i, // Commented out - handled by individual command validation
    // /\|\|\s*(rm|dd|mkfs|format)/i, // Commented out - handled by individual command validation

    // Remote code execution
    /\|\s*(sh|bash|zsh|fish)$/i,
    /(wget|curl)\s+.*\|\s*(sh|bash)/i,
    /(wget|curl)\s+.*-O-.*\|\s*(sh|bash)/i,

    // Command substitution with dangerous commands
    /`.*rm.*`/i,
    /\$\(.*rm.*\)/i,
    /`.*dd.*`/i,
    /\$\(.*dd.*\)/i,

    // Sensitive file access
    /cat\s+\/etc\/(passwd|shadow|sudoers)/i,
    />\s*\/etc\/(passwd|shadow|sudoers)/i,
    /echo\s+.*>>\s*\/etc\/(passwd|shadow|sudoers)/i,

    // Network exfiltration
    /\|\s*nc\s+\S+\s+\d+/i,
    /curl\s+.*-d.*\$\(/i,
    /wget\s+.*--post-data.*\$\(/i,

    // Log manipulation
    />\s*\/var\/log\//i,
    /rm\s+\/var\/log\//i,
    /echo\s+.*>\s*~?\/?\.bash_history/i,

    // Backdoor creation
    /nc\s+.*-l.*-e/i,
    /nc\s+.*-e.*-l/i,
    /ncat\s+.*--exec/i,
    /ssh-keygen.*authorized_keys/i,

    // Crypto mining and malicious downloads
    /(wget|curl).*\.(sh|py|pl|exe|bin).*\|\s*(sh|bash|python)/i,
    /(xmrig|ccminer|cgminer|bfgminer)/i,

    // Hardware direct access
    /cat\s+\/dev\/(mem|kmem)/i,
    /echo\s+.*>\s*\/dev\/(mem|kmem)/i,

    // Kernel module manipulation
    /(insmod|rmmod|modprobe)\s+/i,

    // Cron job manipulation
    /crontab\s+-e/i,
    /echo\s+.*>>\s*\/var\/spool\/cron/i,

    // Environment variable exposure
    /env\s*\|\s*grep.*PASSWORD/i,
    /printenv.*PASSWORD/i,
  ],

  // Paths that should never be written to
  PROTECTED_PATHS: [
    "/etc/",
    "/usr/",
    "/bin/",
    "/sbin/",
    "/boot/",
    "/sys/",
    "/proc/",
    "/dev/",
    "/root/",
  ],

  // Safe paths where rm -rf is allowed
  SAFE_RM_PATHS: [
    "/Users/melvynx/Developer/",
    "/tmp/",
    "/var/tmp/",
    process.cwd() + "/", // Current working directory
  ],
};

// Allowlist of safe commands (when used appropriately)
const SAFE_COMMANDS = [
  "ls",
  "dir",
  "pwd",
  "whoami",
  "date",
  "echo",
  "cat",
  "head",
  "tail",
  "grep",
  "find",
  "wc",
  "sort",
  "uniq",
  "cut",
  "awk",
  "sed",
  "git",
  "npm",
  "pnpm",
  "node",
  "bun",
  "python",
  "pip",
  "source",
  "cd",
  "cp",
  "mv",
  "mkdir",
  "touch",
  "ln",
];

class CommandValidator {
  constructor() {
    this.logFile = "/Users/melvynx/.claude/security.log";
  }

  /**
   * Main validation function
   */
  validate(command, toolName = "Unknown") {
    const result = {
      isValid: true,
      severity: "LOW",
      violations: [],
      sanitizedCommand: command,
    };

    if (!command || typeof command !== "string") {
      result.isValid = false;
      result.violations.push("Invalid command format");
      return result;
    }

    // Normalize command for analysis
    const normalizedCmd = command.trim().toLowerCase();
    const cmdParts = normalizedCmd.split(/\s+/);
    const mainCommand = cmdParts[0];

    // Allow source and python commands unconditionally
    if (mainCommand === "source" || mainCommand === "python") {
      return result; // Always allow
    }

    // Check against critical commands
    if (SECURITY_RULES.CRITICAL_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "CRITICAL";
      result.violations.push(`Critical dangerous command: ${mainCommand}`);
    }

    // Check privilege escalation commands
    if (SECURITY_RULES.PRIVILEGE_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`Privilege escalation command: ${mainCommand}`);
    }

    // Check network commands
    if (SECURITY_RULES.NETWORK_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`Network/remote access command: ${mainCommand}`);
    }

    // Check system commands
    if (SECURITY_RULES.SYSTEM_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`System manipulation command: ${mainCommand}`);
    }

    // Check for rm -rf commands first (special handling)
    if (/rm\s+.*-rf\s/.test(command)) {
      const isRmRfSafe = this.isRmRfCommandSafe(command);
      if (!isRmRfSafe) {
        result.isValid = false;
        result.severity = "CRITICAL";
        result.violations.push("rm -rf command targeting unsafe path");
      }
    }

    // Check dangerous patterns (skip rm -rf patterns as they're handled above)
    for (const pattern of SECURITY_RULES.DANGEROUS_PATTERNS) {
      if (pattern.test(command) && !/rm\s+.*-rf/.test(pattern.source)) {
        result.isValid = false;
        result.severity = "CRITICAL";
        result.violations.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Allow && chaining for safe commands like source and python
    if (command.includes("&&")) {
      const chainedCommands = this.splitCommandChain(command);
      let allSafe = true;
      for (const chainedCmd of chainedCommands) {
        const trimmedCmd = chainedCmd.trim();
        const cmdParts = trimmedCmd.split(/\s+/);
        const mainCommand = cmdParts[0];

        // Allow source and python commands in && chains
        if (
          mainCommand === "source" ||
          mainCommand === "python" ||
          SAFE_COMMANDS.includes(mainCommand)
        ) {
          continue;
        }

        const chainResult = this.validateSingleCommand(trimmedCmd, toolName);
        if (!chainResult.isValid) {
          result.isValid = false;
          result.severity = chainResult.severity;
          result.violations.push(
            `Chained command violation: ${trimmedCmd} - ${chainResult.violations.join(
              ", "
            )}`
          );
          allSafe = false;
        }
      }
      if (allSafe) {
        return result; // Allow safe && chains
      }
    }

    // Check other command chaining (; and ||)
    if (command.includes(";") || command.includes("||")) {
      const chainedCommands = this.splitCommandChain(command);
      for (const chainedCmd of chainedCommands) {
        const chainResult = this.validateSingleCommand(
          chainedCmd.trim(),
          toolName
        );
        if (!chainResult.isValid) {
          result.isValid = false;
          result.severity = chainResult.severity;
          result.violations.push(
            `Chained command violation: ${chainedCmd.trim()} - ${chainResult.violations.join(
              ", "
            )}`
          );
        }
      }
      return result;
    }

    // Check for protected path access (but allow common redirections like /dev/null)
    for (const path of SECURITY_RULES.PROTECTED_PATHS) {
      if (command.includes(path)) {
        // Allow common safe redirections
        if (
          path === "/dev/" &&
          (command.includes("/dev/null") ||
            command.includes("/dev/stderr") ||
            command.includes("/dev/stdout"))
        ) {
          continue;
        }
        result.isValid = false;
        result.severity = "HIGH";
        result.violations.push(`Access to protected path: ${path}`);
      }
    }

    // Additional safety checks
    if (command.length > 2000) {
      result.isValid = false;
      result.severity = "MEDIUM";
      result.violations.push("Command too long (potential buffer overflow)");
    }

    // Check for binary/encoded content
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(command)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push("Binary or encoded content detected");
    }

    return result;
  }

  /**
   * Validate a single command (without chaining logic to avoid recursion)
   */
  validateSingleCommand(command, toolName = "Unknown") {
    const result = {
      isValid: true,
      severity: "LOW",
      violations: [],
      sanitizedCommand: command,
    };

    if (!command || typeof command !== "string") {
      result.isValid = false;
      result.violations.push("Invalid command format");
      return result;
    }

    // Normalize command for analysis
    const normalizedCmd = command.trim().toLowerCase();
    const cmdParts = normalizedCmd.split(/\s+/);
    const mainCommand = cmdParts[0];

    // Allow source and python commands unconditionally in single command validation too
    if (mainCommand === "source" || mainCommand === "python") {
      return result; // Always allow
    }

    // Check against critical commands
    if (SECURITY_RULES.CRITICAL_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "CRITICAL";
      result.violations.push(`Critical dangerous command: ${mainCommand}`);
    }

    // Check privilege escalation commands
    if (SECURITY_RULES.PRIVILEGE_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`Privilege escalation command: ${mainCommand}`);
    }

    // Check network commands
    if (SECURITY_RULES.NETWORK_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`Network/remote access command: ${mainCommand}`);
    }

    // Check system commands
    if (SECURITY_RULES.SYSTEM_COMMANDS.includes(mainCommand)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push(`System manipulation command: ${mainCommand}`);
    }

    // Check for rm -rf commands first (special handling)
    if (/rm\s+.*-rf\s/.test(command)) {
      const isRmRfSafe = this.isRmRfCommandSafe(command);
      if (!isRmRfSafe) {
        result.isValid = false;
        result.severity = "CRITICAL";
        result.violations.push("rm -rf command targeting unsafe path");
      }
    }

    // Check dangerous patterns (skip rm -rf patterns as they're handled above)
    for (const pattern of SECURITY_RULES.DANGEROUS_PATTERNS) {
      if (pattern.test(command) && !/rm\s+.*-rf/.test(pattern.source)) {
        result.isValid = false;
        result.severity = "CRITICAL";
        result.violations.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check for protected path access
    for (const path of SECURITY_RULES.PROTECTED_PATHS) {
      if (command.includes(path)) {
        if (
          path === "/dev/" &&
          (command.includes("/dev/null") ||
            command.includes("/dev/stderr") ||
            command.includes("/dev/stdout"))
        ) {
          continue;
        }
        result.isValid = false;
        result.severity = "HIGH";
        result.violations.push(`Access to protected path: ${path}`);
      }
    }

    // Additional safety checks
    if (command.length > 2000) {
      result.isValid = false;
      result.severity = "MEDIUM";
      result.violations.push("Command too long (potential buffer overflow)");
    }

    // Check for binary/encoded content
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(command)) {
      result.isValid = false;
      result.severity = "HIGH";
      result.violations.push("Binary or encoded content detected");
    }

    return result;
  }

  /**
   * Split command chain into individual commands
   */
  splitCommandChain(command) {
    // Simple splitting on && ; ||
    // This is basic - doesn't handle complex quoting, but good enough for basic validation
    const commands = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      const nextChar = command[i + 1];

      // Handle quotes
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
        current += char;
      } else if (inQuotes) {
        current += char;
      } else if (char === "&" && nextChar === "&") {
        commands.push(current.trim());
        current = "";
        i++; // skip next &
      } else if (char === "|" && nextChar === "|") {
        commands.push(current.trim());
        current = "";
        i++; // skip next |
      } else if (char === ";") {
        commands.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      commands.push(current.trim());
    }

    return commands.filter((cmd) => cmd.length > 0);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(command, toolName, result, sessionId = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId,
      toolName,
      command: command.substring(0, 500), // Truncate for logs
      blocked: !result.isValid,
      severity: result.severity,
      violations: result.violations,
      source: "claude-code-hook",
    };

    try {
      // Write to log file
      const logLine = JSON.stringify(logEntry) + "\n";
      await Bun.write(this.logFile, logLine, { createPath: true, flag: "a" });

      // Also output to stderr for immediate visibility
      console.error(
        `[SECURITY] ${
          result.isValid ? "ALLOWED" : "BLOCKED"
        }: ${command.substring(0, 100)}`
      );
    } catch (error) {
      console.error("Failed to write security log:", error);
    }
  }

  /**
   * Check if rm -rf command targets a safe path
   */
  isRmRfCommandSafe(command) {
    // Extract the path from rm -rf command
    const rmRfMatch = command.match(/rm\s+.*-rf\s+([^\s;&|]+)/);
    if (!rmRfMatch) {
      return false; // Couldn't parse path, block for safety
    }

    const targetPath = rmRfMatch[1];

    // Block if targeting root or ending at root
    if (targetPath === "/" || targetPath.endsWith("/")) {
      return false;
    }

    // Check if path starts with any safe prefix
    for (const safePath of SECURITY_RULES.SAFE_RM_PATHS) {
      if (targetPath.startsWith(safePath)) {
        return true;
      }
    }

    // Check if it's a relative path (safer)
    if (!targetPath.startsWith("/")) {
      return true;
    }

    // Block all other absolute paths
    return false;
  }

  /**
   * Check if command matches any allowed patterns from settings
   */
  isExplicitlyAllowed(command, allowedPatterns = []) {
    for (const pattern of allowedPatterns) {
      // Convert Claude Code permission pattern to regex
      // e.g., "Bash(git *)" becomes /^git\s+.*$/
      if (pattern.startsWith("Bash(") && pattern.endsWith(")")) {
        const cmdPattern = pattern.slice(5, -1); // Remove "Bash(" and ")"
        const regex = new RegExp(
          "^" + cmdPattern.replace(/\*/g, ".*") + "$",
          "i"
        );
        if (regex.test(command)) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  const validator = new CommandValidator();

  try {
    // Read hook input from stdin
    const stdin = process.stdin;
    const chunks = [];

    for await (const chunk of stdin) {
      chunks.push(chunk);
    }

    const input = Buffer.concat(chunks).toString();

    if (!input.trim()) {
      console.error("No input received from stdin");
      process.exit(1);
    }

    // Parse Claude Code hook JSON format
    let hookData;
    try {
      hookData = JSON.parse(input);
    } catch (error) {
      console.error("Invalid JSON input:", error.message);
      process.exit(1);
    }

    const toolName = hookData.tool_name || "Unknown";
    const toolInput = hookData.tool_input || {};
    const sessionId = hookData.session_id || null;

    // Only validate Bash commands for now
    if (toolName !== "Bash") {
      console.log(`Skipping validation for tool: ${toolName}`);
      process.exit(0);
    }

    const command = toolInput.command;
    if (!command) {
      console.error("No command found in tool input");
      process.exit(1);
    }

    // Validate the command
    const result = validator.validate(command, toolName);

    // Log the security event
    await validator.logSecurityEvent(command, toolName, result, sessionId);

    // Output result and exit with appropriate code
    if (result.isValid) {
      console.log("Command validation passed");
      process.exit(0); // Allow execution
    } else {
      // Instead of blocking, ask user for confirmation
      const confirmationMessage = `⚠️  Potentially dangerous command detected!\n\nCommand: ${command}\nViolations: ${result.violations.join(
        ", "
      )}\nSeverity: ${
        result.severity
      }\n\nDo you want to proceed with this command?`;

      const hookOutput = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: confirmationMessage,
        },
      };

      console.log(JSON.stringify(hookOutput));
      process.exit(0); // Exit with 0 to trigger user prompt
    }
  } catch (error) {
    console.error("Validation script error:", error);
    // Fail safe - block execution on any script error
    process.exit(2);
  }
}

// Execute main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(2);
});
