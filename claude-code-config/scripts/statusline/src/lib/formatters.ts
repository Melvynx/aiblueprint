import type { StatuslineConfig } from "../../statusline.config";

export const colors = {
	GRAY: "\x1b[0;90m",
	LIGHT_GRAY: "\x1b[0;37m",
	RESET: "\x1b[0m",
} as const;

export function formatPath(path: string, _mode: "full"): string {
	const home = process.env.HOME || "";
	if (home && path.startsWith(home)) {
		return `~${path.slice(home.length)}`;
	}
	return path;
}

function formatTokens(tokens: number): string {
	if (tokens >= 1000000) {
		const value = Math.round(tokens / 1000000);
		return `${value}${colors.GRAY}m${colors.LIGHT_GRAY}`;
	}
	if (tokens >= 1000) {
		const value = Math.round(tokens / 1000);
		return `${value}${colors.GRAY}k${colors.LIGHT_GRAY}`;
	}
	return tokens.toString();
}

export function formatSession(
	tokens: number,
	percentage: number,
	config: StatuslineConfig["session"],
): string {
	const items: string[] = [];

	if (config.showTokens) {
		items.push(formatTokens(tokens));
	}
	if (config.showPercentage) {
		items.push(`${percentage}${colors.GRAY}%${colors.LIGHT_GRAY}`);
	}

	if (items.length === 0) {
		return "";
	}

	return `${colors.LIGHT_GRAY}${items.join(" ")}`;
}
