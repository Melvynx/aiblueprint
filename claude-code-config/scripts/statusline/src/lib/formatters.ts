import type { Separator, StatuslineConfig } from "../../statusline.config";
import type { GitStatus } from "./git";

export const colors = {
	GREEN: "\x1b[0;32m",
	RED: "\x1b[0;31m",
	PURPLE: "\x1b[0;35m",
	YELLOW: "\x1b[0;33m",
	ORANGE: "\x1b[38;5;208m",
	GRAY: "\x1b[0;90m",
	LIGHT_GRAY: "\x1b[0;37m",
	RESET: "\x1b[0m",
} as const;

export function formatBranch(
	git: GitStatus,
	gitConfig: StatuslineConfig["git"],
): string {
	let result = "";

	if (gitConfig.showBranch) {
		result = git.branch;
	}

	if (git.hasChanges) {
		const changes: string[] = [];

		if (gitConfig.showDirtyIndicator) {
			result += `${colors.PURPLE}*${colors.RESET}`;
		}

		if (gitConfig.showChanges) {
			const totalAdded = git.staged.added + git.unstaged.added;
			const totalDeleted = git.staged.deleted + git.unstaged.deleted;

			if (totalAdded > 0) {
				changes.push(`${colors.GREEN}+${totalAdded}${colors.RESET}`);
			}
			if (totalDeleted > 0) {
				changes.push(`${colors.RED}-${totalDeleted}${colors.RESET}`);
			}
		}

		if (gitConfig.showStaged && git.staged.files > 0) {
			changes.push(`${colors.GRAY}~${git.staged.files}${colors.RESET}`);
		}

		if (gitConfig.showUnstaged && git.unstaged.files > 0) {
			changes.push(`${colors.YELLOW}~${git.unstaged.files}${colors.RESET}`);
		}

		if (changes.length > 0) {
			result += ` ${changes.join(" ")}`;
		}
	}

	return result;
}

export function formatPath(
	path: string,
	mode: "full" | "truncated" | "basename" = "truncated",
): string {
	const home = process.env.HOME || "";
	let formattedPath = path;

	if (home && path.startsWith(home)) {
		formattedPath = `~${path.slice(home.length)}`;
	}

	if (mode === "basename") {
		const segments = path.split("/").filter((s) => s.length > 0);
		return segments[segments.length - 1] || path;
	}

	if (mode === "truncated") {
		const segments = formattedPath.split("/").filter((s) => s.length > 0);
		if (segments.length > 2) {
			return `/${segments.slice(-2).join("/")}`;
		}
	}

	return formattedPath;
}

export function formatCost(cost: number): string {
	return cost.toFixed(2);
}

export function formatTokens(tokens: number, showDecimals = true): string {
	if (tokens >= 1000000) {
		const value = tokens / 1000000;
		const number = showDecimals
			? value.toFixed(1)
			: Math.round(value).toString();
		return `${number}${colors.GRAY}m${colors.LIGHT_GRAY}`;
	}
	if (tokens >= 1000) {
		const value = tokens / 1000;
		const number = showDecimals
			? value.toFixed(1)
			: Math.round(value).toString();
		return `${number}${colors.GRAY}k${colors.LIGHT_GRAY}`;
	}
	return tokens.toString();
}

export function formatDuration(ms: number): string {
	const minutes = Math.floor(ms / 60000);
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (hours > 0) {
		return `${hours}h ${mins}m`;
	}
	return `${mins}m`;
}

export function formatResetTime(resetsAt: string): string {
	try {
		const resetDate = new Date(resetsAt);
		const now = new Date();
		const diffMs = resetDate.getTime() - now.getTime();

		if (diffMs <= 0) {
			return "now";
		}

		const hours = Math.floor(diffMs / 3600000);
		const minutes = Math.floor((diffMs % 3600000) / 60000);

		if (hours > 0) {
			return `${hours}h${minutes}m`;
		}
		return `${minutes}m`;
	} catch {
		return "N/A";
	}
}

export function formatProgressBar(
	percentage: number,
	length: number,
	colorMode: "progressive" | "green" | "yellow" | "red",
): string {
	const filled = Math.round((percentage / 100) * length);
	const empty = length - filled;

	const filledBar = "█".repeat(filled);
	const emptyBar = "░".repeat(empty);

	let barColor: string;
	if (colorMode === "progressive") {
		if (percentage < 50) {
			barColor = colors.GRAY;
		} else if (percentage < 70) {
			barColor = colors.YELLOW;
		} else if (percentage < 90) {
			barColor = colors.ORANGE;
		} else {
			barColor = colors.RED;
		}
	} else if (colorMode === "green") {
		barColor = colors.GREEN;
	} else if (colorMode === "yellow") {
		barColor = colors.YELLOW;
	} else {
		barColor = colors.RED;
	}

	return `${barColor}${filledBar}${colors.GRAY}${emptyBar}${colors.RESET}`;
}

export interface SessionConfig {
	infoSeparator: Separator | null;
	showCost: boolean;
	showTokens: boolean;
	showMaxTokens: boolean;
	showTokenDecimals: boolean;
	showPercentage: boolean;
}

export function formatSession(
	cost: string,
	tokensUsed: number,
	tokensMax: number,
	percentage: number,
	config: SessionConfig,
): string {
	const sessionItems: string[] = [];

	if (config.showCost) {
		sessionItems.push(`$${cost}`);
	}
	if (config.showTokens) {
		const formattedUsed = formatTokens(tokensUsed, config.showTokenDecimals);
		if (config.showMaxTokens) {
			const formattedMax = formatTokens(tokensMax, config.showTokenDecimals);
			sessionItems.push(
				`${formattedUsed}${colors.GRAY}/${formattedMax}${colors.LIGHT_GRAY}`,
			);
		} else {
			sessionItems.push(formattedUsed);
		}
	}
	if (config.showPercentage) {
		sessionItems.push(`${percentage}${colors.GRAY}%${colors.LIGHT_GRAY}`);
	}

	if (sessionItems.length === 0) {
		return "";
	}

	const infoSep = config.infoSeparator
		? ` ${colors.GRAY}${config.infoSeparator}${colors.LIGHT_GRAY} `
		: " ";
	return `${colors.GRAY}S:${colors.LIGHT_GRAY} ${sessionItems.join(infoSep)}`;
}
