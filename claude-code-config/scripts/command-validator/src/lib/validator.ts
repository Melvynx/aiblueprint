import { SAFE_COMMANDS, SECURITY_RULES } from "./security-rules";
import type { ValidationResult } from "./types";

export class CommandValidator {
	validate(command: string, toolName = "Unknown"): ValidationResult {
		const result: ValidationResult = {
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

		if (command.length > 2000) {
			result.isValid = false;
			result.severity = "MEDIUM";
			result.violations.push("Command too long (potential buffer overflow)");
			return result;
		}

		if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(command)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push("Binary or encoded content detected");
			return result;
		}

		const normalizedCmd = command.trim().toLowerCase();
		const cmdParts = normalizedCmd.split(/\s+/);
		const mainCommand = cmdParts[0].split("/").pop() || "";

		if (mainCommand === "source" || mainCommand === "python") {
			return result;
		}

		for (const pattern of SECURITY_RULES.DANGEROUS_PATTERNS) {
			if (pattern.test(command)) {
				result.isValid = false;
				result.severity = "CRITICAL";
				result.violations.push(`Dangerous pattern detected: ${pattern.source}`);
			}
		}

		if (SECURITY_RULES.CRITICAL_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "CRITICAL";
			result.violations.push(`Critical dangerous command: ${mainCommand}`);
		}

		if (SECURITY_RULES.PRIVILEGE_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`Privilege escalation command: ${mainCommand}`);
		}

		if (SECURITY_RULES.NETWORK_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`Network/remote access command: ${mainCommand}`);
		}

		if (SECURITY_RULES.SYSTEM_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`System manipulation command: ${mainCommand}`);
		}

		if (/rm\s+.*-rf\s/.test(command)) {
			const isRmRfSafe = this.isRmRfCommandSafe(command);
			if (!isRmRfSafe) {
				result.isValid = false;
				result.severity = "CRITICAL";
				result.violations.push("rm -rf command targeting unsafe path");
			}
		}

		if (SAFE_COMMANDS.includes(mainCommand) && result.violations.length === 0) {
			return result;
		}

		if (command.includes("&&")) {
			const chainedCommands = this.splitCommandChain(command);
			let allSafe = true;
			for (const chainedCmd of chainedCommands) {
				const trimmedCmd = chainedCmd.trim();
				const cmdParts = trimmedCmd.split(/\s+/);
				const mainCommand = cmdParts[0];

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
						`Chained command violation: ${trimmedCmd} - ${chainResult.violations.join(", ")}`,
					);
					allSafe = false;
				}
			}
			if (allSafe) {
				return result;
			}
		}

		if (command.includes(";") || command.includes("||")) {
			const chainedCommands = this.splitCommandChain(command);
			for (const chainedCmd of chainedCommands) {
				const chainResult = this.validateSingleCommand(
					chainedCmd.trim(),
					toolName,
				);
				if (!chainResult.isValid) {
					result.isValid = false;
					result.severity = chainResult.severity;
					result.violations.push(
						`Chained command violation: ${chainedCmd.trim()} - ${chainResult.violations.join(", ")}`,
					);
				}
			}
			return result;
		}

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

				const cmdStart = command.trim();
				let isSafeExecutable = false;
				for (const safePath of SECURITY_RULES.SAFE_EXECUTABLE_PATHS) {
					if (cmdStart.startsWith(safePath)) {
						isSafeExecutable = true;
						break;
					}
				}

				const pathIndex = command.indexOf(path);
				const beforePath = command.substring(0, pathIndex);
				const redirectBeforePath = />\s*$/.test(beforePath.trim());

				if (!isSafeExecutable && redirectBeforePath) {
					result.isValid = false;
					result.severity = "HIGH";
					result.violations.push(
						`Dangerous operation on protected path: ${path}`,
					);
				}
			}
		}

		return result;
	}

	validateSingleCommand(
		command: string,
		_toolName = "Unknown",
	): ValidationResult {
		const result: ValidationResult = {
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

		if (command.length > 2000) {
			result.isValid = false;
			result.severity = "MEDIUM";
			result.violations.push("Command too long (potential buffer overflow)");
			return result;
		}

		if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(command)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push("Binary or encoded content detected");
			return result;
		}

		const normalizedCmd = command.trim().toLowerCase();
		const cmdParts = normalizedCmd.split(/\s+/);
		const mainCommand = cmdParts[0].split("/").pop() || "";

		if (mainCommand === "source" || mainCommand === "python") {
			return result;
		}

		for (const pattern of SECURITY_RULES.DANGEROUS_PATTERNS) {
			if (pattern.test(command)) {
				result.isValid = false;
				result.severity = "CRITICAL";
				result.violations.push(`Dangerous pattern detected: ${pattern.source}`);
			}
		}

		if (SECURITY_RULES.CRITICAL_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "CRITICAL";
			result.violations.push(`Critical dangerous command: ${mainCommand}`);
		}

		if (SECURITY_RULES.PRIVILEGE_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`Privilege escalation command: ${mainCommand}`);
		}

		if (SECURITY_RULES.NETWORK_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`Network/remote access command: ${mainCommand}`);
		}

		if (SECURITY_RULES.SYSTEM_COMMANDS.includes(mainCommand)) {
			result.isValid = false;
			result.severity = "HIGH";
			result.violations.push(`System manipulation command: ${mainCommand}`);
		}

		if (/rm\s+.*-rf\s/.test(command)) {
			const isRmRfSafe = this.isRmRfCommandSafe(command);
			if (!isRmRfSafe) {
				result.isValid = false;
				result.severity = "CRITICAL";
				result.violations.push("rm -rf command targeting unsafe path");
			}
		}

		if (SAFE_COMMANDS.includes(mainCommand) && result.violations.length === 0) {
			return result;
		}

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

				const cmdStart = command.trim();
				let isSafeExecutable = false;
				for (const safePath of SECURITY_RULES.SAFE_EXECUTABLE_PATHS) {
					if (cmdStart.startsWith(safePath)) {
						isSafeExecutable = true;
						break;
					}
				}

				const pathIndex = command.indexOf(path);
				const beforePath = command.substring(0, pathIndex);
				const redirectBeforePath = />\s*$/.test(beforePath.trim());

				if (!isSafeExecutable && redirectBeforePath) {
					result.isValid = false;
					result.severity = "HIGH";
					result.violations.push(
						`Dangerous operation on protected path: ${path}`,
					);
				}
			}
		}

		return result;
	}

	splitCommandChain(command: string): string[] {
		const commands: string[] = [];
		let current = "";
		let inQuotes = false;
		let quoteChar = "";

		for (let i = 0; i < command.length; i++) {
			const char = command[i];
			const nextChar = command[i + 1];

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
				i++;
			} else if (char === "|" && nextChar === "|") {
				commands.push(current.trim());
				current = "";
				i++;
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

	isRmRfCommandSafe(command: string): boolean {
		const rmRfMatch = command.match(/rm\s+.*-rf\s+([^\s;&|]+)/);
		if (!rmRfMatch) {
			return false;
		}

		const targetPath = rmRfMatch[1];

		if (targetPath === "/" || targetPath.endsWith("/")) {
			return false;
		}

		for (const safePath of SECURITY_RULES.SAFE_RM_PATHS) {
			if (targetPath.startsWith(safePath)) {
				return true;
			}
		}

		if (!targetPath.startsWith("/")) {
			return true;
		}

		return false;
	}
}
