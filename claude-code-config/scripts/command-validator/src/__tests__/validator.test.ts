import { describe, expect, it } from "bun:test";
import { CommandValidator } from "../lib/validator";

describe("CommandValidator", () => {
	const validator = new CommandValidator();

	describe("Commands that MUST be ALLOWED (action: allow)", () => {
		const allowedCommands = [
			"ls -la",
			"pwd",
			"git status",
			"git add -A && git commit -m 'Clé API Google gérée côté client'",
			"npm install",
			"rm file.txt",
			"rm -r folder",
			"rm -f file.txt",
			"echo 'éàù accents français'",
			"git commit -m '🚀 emoji test'",
			"cat /etc/passwd",
			"curl http://example.com",
		];

		for (const command of allowedCommands) {
			it(`should ALLOW: ${command}`, () => {
				const result = validator.validate(command);
				expect(result.isValid).toBe(true);
				expect(result.action).toBe("allow");
				expect(result.violations).toHaveLength(0);
			});
		}
	});

	describe("Commands that MUST be DENIED (action: deny) - rm -rf ONLY", () => {
		const deniedCommands = [
			"rm -rf /",
			"rm -rf folder",
			"rm -rf .",
			"rm -rf /tmp/test",
			"rm -fr folder",
			"rm -r -f folder",
			"rm -f -r folder",
			"rm -rf /Users/test/.claude/skills",
			"mkdir test && rm -rf test",
		];

		for (const command of deniedCommands) {
			it(`should DENY: ${command}`, () => {
				const result = validator.validate(command);
				expect(result.isValid).toBe(false);
				expect(result.action).toBe("deny");
				expect(result.severity).toBe("CRITICAL");
				expect(result.violations[0]).toContain("rm -rf is forbidden");
			});
		}
	});

	describe("Commands that MUST ASK permission (action: ask)", () => {
		const askCommands = [
			{ cmd: "sudo apt install", expected: "sudo" },
			{ cmd: "sudo rm something", expected: "sudo" },
			{ cmd: "chmod 777 file.txt", expected: "chmod" },
			{ cmd: "chown root file.txt", expected: "chown" },
			{ cmd: "dd if=/dev/zero of=test.img", expected: "dd" },
			{ cmd: "kill -9 1234", expected: "kill" },
			{ cmd: "killall node", expected: "killall" },
			{ cmd: "su root", expected: "su" },
		];

		for (const { cmd, expected } of askCommands) {
			it(`should ASK for: ${cmd}`, () => {
				const result = validator.validate(cmd);
				expect(result.isValid).toBe(false);
				expect(result.action).toBe("ask");
				expect(result.severity).toBe("HIGH");
				expect(result.violations[0]).toContain(expected);
			});
		}
	});

	describe("Edge cases", () => {
		it("should DENY empty commands", () => {
			const result = validator.validate("");
			expect(result.isValid).toBe(false);
			expect(result.action).toBe("deny");
		});

		it("should ALLOW commands with accented characters", () => {
			const result = validator.validate("git commit -m 'éàùç accents'");
			expect(result.isValid).toBe(true);
			expect(result.action).toBe("allow");
		});

		it("should ALLOW commands with emojis", () => {
			const result = validator.validate("echo '🚀🎉'");
			expect(result.isValid).toBe(true);
			expect(result.action).toBe("allow");
		});
	});
});
