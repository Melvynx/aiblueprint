import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { CachedUsageLimits, UsageLimits } from "./types";

const CACHE_DURATION_MS = 60 * 1000; // 1 minute
const execFileAsync = promisify(execFile);

function getCacheFilePath(): string {
	const projectRoot = join(import.meta.dir, "..", "..", "..", "..");
	return join(projectRoot, "data", "usage-limits-cache.json");
}

export async function getCredentials(): Promise<string | null> {
	return (
		(await getClaudeCodeTokenFromKeychain()) ?? getClaudeCodeTokenFromFile()
	);
}

async function getClaudeCodeTokenFromKeychain(): Promise<string | null> {
	if (process.platform !== "darwin") {
		return null;
	}

	try {
		const { stdout } = await execFileAsync("security", [
			"find-generic-password",
			"-s",
			"Claude Code-credentials",
			"-w",
		]);

		return parseClaudeCodeToken(stdout.trim());
	} catch {
		return null;
	}
}

async function getClaudeCodeTokenFromFile(): Promise<string | null> {
	try {
		const credentialsPath = join(homedir(), ".claude", ".credentials.json");
		if (!existsSync(credentialsPath)) {
			return null;
		}

		const content = await readFile(credentialsPath, "utf-8");
		return parseClaudeCodeToken(content);
	} catch {
		return null;
	}
}

function parseClaudeCodeToken(content: string): string | null {
	if (!content) {
		return null;
	}

	try {
		const credentials = JSON.parse(content);
		return (
			credentials.claudeAiOauth?.accessToken ?? credentials.accessToken ?? null
		);
	} catch {
		return content.startsWith("sk-") ? content : null;
	}
}

export async function fetchUsageLimits(
	token: string,
): Promise<UsageLimits | null> {
	try {
		const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
			method: "GET",
			headers: {
				Accept: "application/json, text/plain, */*",
				"Content-Type": "application/json",
				"User-Agent": "claude-code/2.0.31",
				Authorization: `Bearer ${token}`,
				"anthropic-beta": "oauth-2025-04-20",
				"Accept-Encoding": "gzip, compress, deflate, br",
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		return {
			five_hour: data.five_hour || null,
			seven_day: data.seven_day || null,
		};
	} catch {
		return null;
	}
}

async function loadCache(): Promise<CachedUsageLimits | null> {
	try {
		const cacheFile = getCacheFilePath();
		if (!existsSync(cacheFile)) {
			return null;
		}

		const content = await readFile(cacheFile, "utf-8");
		const cached: CachedUsageLimits = JSON.parse(content);

		const now = Date.now();
		if (now - cached.timestamp < CACHE_DURATION_MS) {
			return cached;
		}

		return null;
	} catch {
		return null;
	}
}

async function saveCache(data: UsageLimits): Promise<void> {
	try {
		const cacheFile = getCacheFilePath();
		const cached: CachedUsageLimits = {
			data,
			timestamp: Date.now(),
		};

		await writeFile(cacheFile, JSON.stringify(cached, null, 2));
	} catch {
		// Fail silently
	}
}

export async function getUsageLimits(): Promise<UsageLimits> {
	try {
		const cached = await loadCache();
		if (cached) {
			return cached.data;
		}

		const token = await getCredentials();

		if (!token) {
			return { five_hour: null, seven_day: null };
		}

		const limits = await fetchUsageLimits(token);

		if (!limits) {
			return { five_hour: null, seven_day: null };
		}

		await saveCache(limits);

		return limits;
	} catch {
		return { five_hour: null, seven_day: null };
	}
}

export type { CachedUsageLimits, UsageLimits } from "./types";
