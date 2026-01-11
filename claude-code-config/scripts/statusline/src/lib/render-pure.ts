/**
 * Pure statusline renderer - no I/O, no side effects
 *
 * ARCHITECTURE: Raw data in, formatted string out.
 * ALL config decisions happen here, not in data preparation.
 *
 * FREE VERSION: Simplified - No limits, weekly, or daily tracking
 */

import type { StatuslineConfig } from "./config-types";
import {
	colors,
	formatCost,
	formatDuration,
	formatPath,
	formatProgressBar,
	formatTokens,
} from "./formatters";

// ─────────────────────────────────────────────────────────────
// DATA TYPES - Simplified for free version
// ─────────────────────────────────────────────────────────────

export interface StatuslineData {
	branch: string;
	dirPath: string;
	modelName: string;
	sessionCost: string;
	sessionDuration: string;
	contextTokens: number | null;
	contextPercentage: number | null;
}

// ─────────────────────────────────────────────────────────────
// FORMATTING - All config-aware formatting in one place
// ─────────────────────────────────────────────────────────────

function formatSessionPart(
	cost: number,
	durationMs: number,
	contextTokens: number | null,
	contextPercentage: number | null,
	maxTokens: number,
	config: StatuslineConfig["session"],
): string {
	// No context data yet - show placeholder
	if (contextTokens === null || contextPercentage === null) {
		return `${colors.gray("S:")} ${colors.gray("-")}`;
	}

	const items: string[] = [];

	if (config.cost.enabled) {
		const formattedCost = formatCost(cost, config.cost.format);
		items.push(`${colors.gray("$")}${colors.dimWhite(formattedCost)}`);
	}

	if (config.tokens.enabled) {
		const formattedUsed = formatTokens(
			contextTokens,
			config.tokens.showDecimals,
		);
		if (config.tokens.showMax) {
			const formattedMax = formatTokens(maxTokens, config.tokens.showDecimals);
			items.push(`${formattedUsed}${colors.gray("/")}${formattedMax}`);
		} else {
			items.push(formattedUsed);
		}
	}

	if (config.percentage.enabled) {
		const pctParts: string[] = [];

		if (config.percentage.progressBar.enabled) {
			pctParts.push(
				formatProgressBar({
					percentage: contextPercentage,
					length: config.percentage.progressBar.length,
					style: config.percentage.progressBar.style,
					colorMode: config.percentage.progressBar.color,
					background: config.percentage.progressBar.background,
				}),
			);
		}

		if (config.percentage.showValue) {
			pctParts.push(
				`${colors.lightGray(contextPercentage.toString())}${colors.gray("%")}`,
			);
		}

		if (pctParts.length > 0) {
			items.push(pctParts.join(" "));
		}
	}

	if (config.duration.enabled) {
		items.push(colors.gray(`(${formatDuration(durationMs)})`));
	}

	if (items.length === 0) return "";

	const sep = config.infoSeparator
		? ` ${colors.gray(config.infoSeparator)} `
		: " ";
	return `${colors.gray("S:")} ${items.join(sep)}`;
}

// ─────────────────────────────────────────────────────────────
// MAIN RENDER FUNCTION - Simple version
// ─────────────────────────────────────────────────────────────

export function renderStatusline(
	data: StatuslineData,
	config: StatuslineConfig,
): string {
	const sep = colors.gray(config.separator);
	const sections: string[] = [];

	// Line 1: Git + Path + Model
	const line1Parts: string[] = [];

	// Git branch
	if (data.branch) {
		line1Parts.push(colors.lightGray(data.branch));
	}

	// Path
	const pathPart = formatPath(data.dirPath, config.pathDisplayMode);
	line1Parts.push(colors.gray(pathPart));

	// Model name (hide Sonnet if configured)
	const isSonnet = data.modelName.toLowerCase().includes("sonnet");
	if (!isSonnet || config.showSonnetModel) {
		line1Parts.push(colors.peach(data.modelName));
	}

	sections.push(line1Parts.join(` ${sep} `));

	// Line 2: Session info (cost, tokens, percentage, duration)
	const cost = parseFloat(data.sessionCost.replace(/[$,]/g, "")) || 0;
	const durationMs = parseDurationToMs(data.sessionDuration);

	const sessionPart = formatSessionPart(
		cost,
		durationMs,
		data.contextTokens,
		data.contextPercentage,
		config.context.maxContextTokens,
		config.session,
	);

	if (sessionPart) sections.push(sessionPart);

	const output = sections.join(` ${sep} `);

	if (config.oneLine) return output;

	// Two-line mode: break after line1
	const line1 = sections[0];
	const rest = sections.slice(1).join(` ${sep} `);
	return rest ? `${line1}\n${rest}` : line1;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

// Helper to parse "12m" or "1h 30m" back to ms
function parseDurationToMs(duration: string): number {
	let ms = 0;
	const hourMatch = duration.match(/(\d+)h/);
	const minMatch = duration.match(/(\d+)m/);
	if (hourMatch) ms += parseInt(hourMatch[1], 10) * 3600000;
	if (minMatch) ms += parseInt(minMatch[1], 10) * 60000;
	return ms || 720000; // Default 12 minutes
}
