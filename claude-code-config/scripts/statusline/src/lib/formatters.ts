import type { StatuslineConfig } from "../../statusline.config";
import type { GitInfo } from "./git";

export const colors = {
	GRAY: "\x1b[0;90m",
	LIGHT_GRAY: "\x1b[0;37m",
	BLUE: "\x1b[0;34m",
	GREEN: "\x1b[0;32m",
	RED: "\x1b[0;31m",
	YELLOW: "\x1b[0;33m",
	CYAN: "\x1b[0;36m",
	RESET: "\x1b[0m",
	BOLD: "\x1b[1m",
} as const;

export function formatPath(path: string, _mode: "full"): string {
	const home = process.env.HOME || "";
	if (home && path.startsWith(home)) {
		return `${colors.CYAN}~${path.slice(home.length)}${colors.RESET}`;
	}
	return `${colors.CYAN}${path}${colors.RESET}`;
}

function formatTokens(tokens: number): string {
	if (tokens >= 1000000) {
		const value = (tokens / 1000000).toFixed(1);
		return `${colors.BOLD}${value}${colors.RESET}${colors.GRAY}m${colors.LIGHT_GRAY} tkn`;
	}
	if (tokens >= 1000) {
		const value = Math.round(tokens / 1000);
		return `${colors.BOLD}${value}${colors.RESET}${colors.GRAY}k${colors.LIGHT_GRAY} tkn`;
	}
	return `${colors.BOLD}${tokens}${colors.RESET}${colors.LIGHT_GRAY} tkn`;
}

export function formatGit(git: GitInfo | null): string {
	if (!git) return "";
	
	const parts: string[] = [`${colors.BLUE}🌿 ${git.branch}${colors.RESET}`];
	
	if (git.added > 0 || git.deleted > 0) {
		const stats: string[] = [];
		if (git.added > 0) stats.push(`${colors.GREEN}+${git.added}`);
		if (git.deleted > 0) stats.push(`${colors.RED}-${git.deleted}`);
		parts.push(`${colors.GRAY}(${stats.join(" ")}${colors.GRAY})${colors.RESET}`);
	}
	
	return parts.join(" ");
}

export function formatCost(usd: number): string {
	if (usd === 0) return "";
	return `${colors.YELLOW}💰 $${usd.toFixed(2)}${colors.RESET}`;
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
		items.push(`${colors.BOLD}${percentage}${colors.RESET}${colors.GRAY}%${colors.LIGHT_GRAY} ctx`);
	}

	if (items.length === 0) {
		return "";
	}

	return `${colors.LIGHT_GRAY}${items.join(" ")}`;
}
