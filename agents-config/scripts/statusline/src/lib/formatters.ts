import { homedir } from "node:os";
import { sep } from "node:path";
import pc from "picocolors";
import type {
	CostFormat,
	ProgressBarBackground,
	ProgressBarColor,
	ProgressBarStyle,
	StatuslineConfig,
} from "./config-types";
import type { GitStatus } from "./git";

type ColorFunction = (text: string | number) => string;

const pico = pc.createColors(true);

export const colors = {
	green: pico.green as ColorFunction,
	red: pico.red as ColorFunction,
	purple: pico.magenta as ColorFunction,
	yellow: pico.yellow as ColorFunction,
	orange: ((text: string | number) =>
		`\x1b[38;5;208m${text}\x1b[0m`) as ColorFunction,
	peach: ((text: string | number) =>
		`\x1b[38;2;222;115;86m${text}\x1b[0m`) as ColorFunction,
	bgPeach: ((text: string | number) =>
		`\x1b[48;2;222;115;86m${text}\x1b[0m`) as ColorFunction,
	black: ((text: string | number) =>
		`\x1b[38;2;0;0;0m${text}\x1b[39m`) as ColorFunction,
	white: ((text: string | number) =>
		`\x1b[38;2;255;255;255m${text}\x1b[39m`) as ColorFunction,
	gray: pico.gray as ColorFunction,
	dimWhite: ((text: string | number) =>
		`\x1b[37m${text}\x1b[39m`) as ColorFunction,
	lightGray: pico.whiteBright as ColorFunction,
	cyan: pico.cyan as ColorFunction,
	blue: pico.blue as ColorFunction,
	bgBlack: pico.bgBlack as ColorFunction,
	bgBlackBright: pico.bgBlackBright as ColorFunction,
	bgWhite: pico.bgWhite as ColorFunction,
	bgBlue: pico.bgBlue as ColorFunction,
	bgMagenta: pico.bgMagenta as ColorFunction,
	bgCyan: pico.bgCyan as ColorFunction,
	dim: pico.dim as ColorFunction,
	bold: pico.bold as ColorFunction,
	hidden: pico.hidden as ColorFunction,
	italic: pico.italic as ColorFunction,
	underline: pico.underline as ColorFunction,
	strikethrough: pico.strikethrough as ColorFunction,
	reset: pico.reset as ColorFunction,
	inverse: pico.inverse as ColorFunction,
} as const;

export function formatBranch(
	git: GitStatus,
	gitConfig: StatuslineConfig["git"],
): string {
	let result = "";

	if (gitConfig.showBranch) {
		result = colors.lightGray(git.branch);
	}

	if (git.hasChanges) {
		const changes: string[] = [];

		if (gitConfig.showDirtyIndicator) {
			result += colors.purple("*");
		}

		if (gitConfig.showChanges) {
			const totalAdded = git.staged.added + git.unstaged.added;
			const totalDeleted = git.staged.deleted + git.unstaged.deleted;

			if (totalAdded > 0) {
				changes.push(colors.green(`+${totalAdded}`));
			}
			if (totalDeleted > 0) {
				changes.push(colors.red(`-${totalDeleted}`));
			}
		}

		if (gitConfig.showStaged && git.staged.files > 0) {
			changes.push(colors.gray(`~${git.staged.files}`));
		}

		if (gitConfig.showUnstaged && git.unstaged.files > 0) {
			changes.push(colors.yellow(`~${git.unstaged.files}`));
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
	const home = homedir();
	let formattedPath = path;

	if (home && path.startsWith(home)) {
		formattedPath = `~${path.slice(home.length)}`;
	}

	if (mode === "basename") {
		const segments = path.split(/[/\\]/).filter((s) => s.length > 0);
		return segments[segments.length - 1] || path;
	}

	if (mode === "truncated") {
		const segments = formattedPath.split(/[/\\]/).filter((s) => s.length > 0);
		if (segments.length > 2) {
			return `…${sep}${segments.slice(-2).join(sep)}`;
		}
	}

	return formattedPath;
}

export function formatCost(
	cost: number,
	format: CostFormat = "decimal1",
): string {
	if (format === "integer") return Math.round(cost).toString();
	if (format === "decimal1") return cost.toFixed(1);
	return cost.toFixed(2);
}

export function formatTokens(tokens: number, showDecimals = true): string {
	if (tokens >= 1000000) {
		const value = tokens / 1000000;
		const number = showDecimals
			? value.toFixed(1)
			: Math.round(value).toString();
		return `${colors.lightGray(number)}${colors.gray("m")}`;
	}
	if (tokens >= 1000) {
		const value = tokens / 1000;
		const number = showDecimals
			? value.toFixed(1)
			: Math.round(value).toString();
		return `${colors.lightGray(number)}${colors.gray("k")}`;
	}
	return colors.lightGray(tokens.toString());
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
		if (Number.isNaN(resetDate.getTime())) {
			return "N/A";
		}

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

function getProgressBarColor(
	percentage: number,
	colorMode: ProgressBarColor,
): ColorFunction {
	if (colorMode === "progressive") {
		if (percentage < 50) return colors.gray;
		if (percentage < 70) return colors.yellow;
		if (percentage < 90) return colors.orange;
		return colors.red;
	}
	if (colorMode === "green") return colors.green;
	if (colorMode === "yellow") return colors.yellow;
	if (colorMode === "peach") return colors.peach;
	if (colorMode === "black") return colors.black;
	if (colorMode === "white") return colors.white;
	if (colorMode === "purple") return colors.purple;
	if (colorMode === "blue") return colors.blue;
	if (colorMode === "cyan") return colors.cyan;
	return colors.red;
}

function getProgressBarBackground(
	background: ProgressBarBackground,
): ColorFunction | null {
	if (background === "none") return null;
	if (background === "dark") return colors.bgBlack;
	if (background === "gray") return colors.bgBlackBright;
	if (background === "light") return colors.bgWhite;
	if (background === "blue") return colors.bgBlue;
	if (background === "purple") return colors.bgMagenta;
	if (background === "cyan") return colors.bgCyan;
	if (background === "peach") return colors.bgPeach;
	return null;
}

export function formatProgressBarFilled(
	percentage: number,
	length: number,
	colorMode: ProgressBarColor,
	background: ProgressBarBackground,
): string {
	const filled = Math.round((percentage / 100) * length);
	const empty = length - filled;

	const filledBar = "█".repeat(filled);
	const emptyBar = "░".repeat(empty);
	const colorFn = getProgressBarColor(percentage, colorMode);
	const bgFn = getProgressBarBackground(background);

	const coloredFilled = bgFn ? bgFn(colorFn(filledBar)) : colorFn(filledBar);
	const coloredEmpty = bgFn ? bgFn(colorFn(emptyBar)) : colorFn(emptyBar);

	return `${coloredFilled}${coloredEmpty}`;
}

export function formatProgressBarRectangle(
	percentage: number,
	length: number,
	colorMode: ProgressBarColor,
	background: ProgressBarBackground,
): string {
	const filled = Math.round((percentage / 100) * length);
	const empty = length - filled;

	const filledBar = "▰".repeat(filled);
	const emptyBar = "▱".repeat(empty);
	const colorFn = getProgressBarColor(percentage, colorMode);
	const bgFn = getProgressBarBackground(background);

	const coloredFilled = bgFn ? bgFn(colorFn(filledBar)) : colorFn(filledBar);
	const coloredEmpty = bgFn ? bgFn(colorFn(emptyBar)) : colorFn(emptyBar);

	return `${coloredFilled}${coloredEmpty}`;
}

export function formatProgressBarBraille(
	percentage: number,
	length: number,
	colorMode: ProgressBarColor,
	background: ProgressBarBackground,
): string {
	const brailleChars = ["⣀", "⣄", "⣤", "⣦", "⣶", "⣷", "⣿"];

	const totalSteps = length * (brailleChars.length - 1);
	const currentStep = Math.round((percentage / 100) * totalSteps);

	const fullBlocks = Math.floor(currentStep / (brailleChars.length - 1));
	const partialIndex = currentStep % (brailleChars.length - 1);
	const emptyBlocks = length - fullBlocks - (partialIndex > 0 ? 1 : 0);

	const colorFn = getProgressBarColor(percentage, colorMode);
	const bgFn = getProgressBarBackground(background);

	const fullPart = bgFn
		? bgFn(colorFn("⣿".repeat(fullBlocks)))
		: colorFn("⣿".repeat(fullBlocks));
	const partialPart =
		partialIndex > 0
			? bgFn
				? bgFn(colorFn(brailleChars[partialIndex]))
				: colorFn(brailleChars[partialIndex])
			: "";
	const emptyPart =
		emptyBlocks > 0
			? bgFn
				? bgFn(colorFn("⣀".repeat(emptyBlocks)))
				: colorFn("⣀".repeat(emptyBlocks))
			: "";

	return `${fullPart}${partialPart}${emptyPart}`;
}

export function formatProgressBar({
	percentage,
	length,
	style,
	colorMode,
	background,
}: {
	percentage: number;
	length: 5 | 10 | 15;
	style: ProgressBarStyle;
	colorMode: ProgressBarColor;
	background: ProgressBarBackground;
}): string {
	if (style === "rectangle") {
		return formatProgressBarRectangle(
			percentage,
			length,
			colorMode,
			background,
		);
	}
	if (style === "braille") {
		return formatProgressBarBraille(percentage, length, colorMode, background);
	}
	return formatProgressBarFilled(percentage, length, colorMode, background);
}

export function formatDualBar({
	leftLabel,
	leftPercentage,
	leftColorFn,
	rightLabel,
	rightValue,
	rightColorFn,
	barLength,
}: {
	leftLabel: string;
	leftPercentage: number;
	leftColorFn: ColorFunction;
	rightLabel: string;
	rightValue: number;
	rightColorFn: ColorFunction;
	barLength: number;
}): string {
	const leftFilled = Math.round((leftPercentage / 100) * barLength);
	const leftEmpty = barLength - leftFilled;
	const leftBar = leftColorFn("█".repeat(leftFilled) + "░".repeat(leftEmpty));

	const absRightValue = Math.abs(rightValue);
	const rightFilled = Math.round(
		(Math.min(absRightValue, 50) / 50) * barLength,
	);
	const rightEmpty = barLength - rightFilled;
	const rightBar = rightColorFn(
		"█".repeat(rightFilled) + "░".repeat(rightEmpty),
	);

	const leftText = `${leftColorFn(leftLabel)} ${leftBar} ${colors.lightGray(leftPercentage.toFixed(1))}${colors.gray("%")}`;
	const sign = rightValue >= 0 ? "+" : "";
	const rightText = `${rightColorFn(rightLabel)} ${rightBar} ${rightColorFn(`${sign}${rightValue.toFixed(1)}%`)}`;

	return `${leftText}\n${rightText}`;
}

export function formatSession(
	cost: string,
	duration: string,
	tokensUsed: number,
	tokensMax: number,
	percentage: number,
	config: StatuslineConfig["session"],
): string {
	const sessionItems: string[] = [];

	if (config.cost.enabled) {
		sessionItems.push(`${colors.gray("$")}${colors.dimWhite(cost)}`);
	}

	if (config.tokens.enabled) {
		const formattedUsed = formatTokens(tokensUsed, config.tokens.showDecimals);
		if (config.tokens.showMax) {
			const formattedMax = formatTokens(tokensMax, config.tokens.showDecimals);
			sessionItems.push(`${formattedUsed}${colors.gray("/")}${formattedMax}`);
		} else {
			sessionItems.push(formattedUsed);
		}
	}

	if (config.percentage.enabled) {
		const parts: string[] = [];

		if (config.percentage.progressBar.enabled) {
			const bar = formatProgressBar({
				percentage,
				length: config.percentage.progressBar.length,
				style: config.percentage.progressBar.style,
				colorMode: config.percentage.progressBar.color,
				background: config.percentage.progressBar.background,
			});
			parts.push(bar);
		}

		if (config.percentage.showValue) {
			parts.push(
				`${colors.lightGray(percentage.toString())}${colors.gray("%")}`,
			);
		}

		if (parts.length > 0) {
			sessionItems.push(parts.join(" "));
		}
	}

	if (config.duration.enabled) {
		sessionItems.push(colors.gray(`(${duration})`));
	}

	if (sessionItems.length === 0) {
		return "";
	}

	const infoSep = config.infoSeparator
		? ` ${colors.gray(config.infoSeparator)} `
		: " ";
	return `${colors.gray("S:")} ${sessionItems.join(infoSep)}`;
}
