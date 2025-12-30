import type { StatuslineConfig } from "../../statusline.config";
import type { GitInfo } from "./git";
import type { UsageLimits } from "./usage-limits";

export const colors = {
	GRAY: "\x1b[0;90m",
	LIGHT_GRAY: "\x1b[0;37m",
	BLUE: "\x1b[0;34m",
	LIGHT_BLUE: "\x1b[0;94m",
	LIGHT_CYAN: "\x1b[0;96m",
	GREEN: "\x1b[0;32m",
	RED: "\x1b[0;31m",
	YELLOW: "\x1b[0;33m",
	CYAN: "\x1b[0;36m",
	MAGENTA: "\x1b[0;95m",
	LAVENDER: "\x1b[38;5;183m",
	RESET: "\x1b[0m",
	BOLD: "\x1b[1m",
} as const;

export function formatPath(path: string, _mode: "full"): string {
	const home = process.env.HOME || "";
	if (home && path.startsWith(home)) {
		return ` ${colors.CYAN}~${path.slice(home.length)}${colors.RESET}`;
	}
	return ` ${colors.CYAN}${path}${colors.RESET}`;
}

function formatTokens(tokens: number, contextColor: string): string {
	if (tokens >= 1000000) {
		const value = (tokens / 1000000).toFixed(1);
		return `󰦨 ${contextColor}${value}${colors.RESET}${colors.GRAY}m${colors.LIGHT_GRAY} tkn`;
	}
	if (tokens >= 1000) {
		const value = Math.round(tokens / 1000);
		return `󰦨 ${contextColor}${value}${colors.RESET}${colors.GRAY}k${colors.LIGHT_GRAY} tkn`;
	}
	return `󰦨 ${contextColor}${tokens}${colors.RESET}${colors.LIGHT_GRAY} tkn`;
}

export function formatGit(git: GitInfo | null): string {
	if (!git) return "";

	const parts: string[] = [` ${colors.BLUE}🌿 ${git.branch}${colors.RESET}`];

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

	const contextColor = percentage > 80 ? colors.RED :
	                     percentage > 60 ? colors.YELLOW :
	                     colors.GREEN;

	if (config.showTokens) {
		items.push(formatTokens(tokens, contextColor));
	}
	if (config.showPercentage) {
		items.push(`${contextColor}${percentage}${colors.RESET}${colors.GRAY}%${colors.LIGHT_GRAY} ctx`);
	}

	if (items.length === 0) {
		return "";
	}

	return `${colors.LIGHT_GRAY}${items.join(" ")}`;
}

function formatTimeUntil(resetTime: Date): string {
	const now = new Date();
	const diffMs = resetTime.getTime() - now.getTime();
	const diffMinutes = Math.floor(diffMs / 1000 / 60);

	if (diffMinutes < 60) {
		return `${diffMinutes}m`;
	}

	const totalHours = Math.floor(diffMinutes / 60);

	if (totalHours < 24) {
		const minutes = diffMinutes % 60;
		return `${totalHours}h${minutes}m`;
	}

	const days = Math.floor(totalHours / 24);
	const hours = totalHours % 24;
	return `${days}d${hours}h`;
}

export function formatUsageLimits(usage: UsageLimits | null): string {
	if (!usage) return "";

	const fiveHourColor = usage.fiveHourUtilization > 80 ? colors.RED :
	                      usage.fiveHourUtilization > 60 ? colors.YELLOW :
	                      colors.GREEN;

	const sevenDayColor = usage.sevenDayUtilization > 80 ? colors.RED :
	                      usage.sevenDayUtilization > 60 ? colors.YELLOW :
	                      colors.GREEN;

	const fiveHourTime = formatTimeUntil(usage.fiveHourResetsAt);
	const sevenDayTime = formatTimeUntil(usage.sevenDayResetsAt);

	const fiveHourPart = `⏱ ${fiveHourColor}${usage.fiveHourUtilization}${colors.RESET}${colors.GRAY}%${colors.LIGHT_GRAY} (${fiveHourTime})`;
	const sevenDayPart = `󰃰 ${sevenDayColor}${usage.sevenDayUtilization}${colors.RESET}${colors.GRAY}%${colors.LIGHT_GRAY} (${sevenDayTime})`;

	return `${fiveHourPart} ${colors.GRAY}•${colors.LIGHT_GRAY} ${sevenDayPart}`;
}
