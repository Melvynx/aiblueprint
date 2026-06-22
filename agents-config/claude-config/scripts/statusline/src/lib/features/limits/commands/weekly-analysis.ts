#!/usr/bin/env bun

import { colors, formatProgressBar } from "../../../formatters";
import { getUsageLimits } from "../index";

const WEEKLY_HOURS = 168; // 7 days * 24 hours

function calculateTimeProgress(resetsAt: string | null): {
	hoursRemaining: number;
	hoursElapsed: number;
	timeElapsedPercent: number;
} {
	if (!resetsAt) {
		return {
			hoursRemaining: 0,
			hoursElapsed: WEEKLY_HOURS,
			timeElapsedPercent: 100,
		};
	}

	const resetDate = new Date(resetsAt);
	const now = new Date();
	const diffMs = resetDate.getTime() - now.getTime();
	const hoursRemaining = Math.max(0, diffMs / 3600000);
	const hoursElapsed = WEEKLY_HOURS - hoursRemaining;
	const timeElapsedPercent = (hoursElapsed / WEEKLY_HOURS) * 100;

	return { hoursRemaining, hoursElapsed, timeElapsedPercent };
}

function formatDelta(delta: number): string {
	const sign = delta >= 0 ? "+" : "";
	const value = `${sign}${delta.toFixed(1)}%`;

	if (delta > 5) return colors.green(value);
	if (delta > 0) return colors.lightGray(value);
	if (delta > -5) return colors.yellow(value);
	if (delta > -15) return colors.orange(value);
	return colors.red(value);
}

async function main() {
	const limits = await getUsageLimits();

	console.log("");
	console.log(colors.bold("📊 Weekly Usage Analysis"));
	console.log(colors.gray("─".repeat(40)));

	if (!limits.seven_day) {
		console.log(colors.red("No weekly limit data available"));
		return;
	}

	const { utilization, resets_at } = limits.seven_day;
	const { timeElapsedPercent } = calculateTimeProgress(resets_at);

	const expectedUsage = timeElapsedPercent;
	const delta = utilization - expectedUsage;

	console.log("");
	console.log(colors.gray("Weekly Limits Overview"));
	console.log(colors.gray("─".repeat(50)));
	console.log("");

	const usageBar = formatProgressBar({
		percentage: utilization,
		length: 20,
		style: "filled",
		colorMode: "blue",
		background: "none",
	});
	console.log(
		`${colors.blue("Usage")} ${usageBar} ${colors.lightGray(utilization.toFixed(1))}${colors.gray("%")}`,
	);

	const timeBar = formatProgressBar({
		percentage: timeElapsedPercent,
		length: 20,
		style: "filled",
		colorMode: "purple",
		background: "none",
	});
	console.log(
		`${colors.purple("Time ")} ${timeBar} ${colors.lightGray(timeElapsedPercent.toFixed(1))}${colors.gray("%")} ${colors.gray("·")} ${formatDelta(delta)}`,
	);

	console.log("");
	console.log(colors.gray("─".repeat(50)));
	console.log("");

	if (limits.five_hour) {
		console.log(colors.gray("─".repeat(40)));
		console.log("");
		console.log(colors.gray("Session Limit (5h):"));
		console.log(
			`  ${formatProgressBar({
				percentage: limits.five_hour.utilization,
				length: 15,
				style: "filled",
				colorMode: "progressive",
				background: "none",
			})} ${colors.lightGray(limits.five_hour.utilization.toString())}${colors.gray("%")}`,
		);
		console.log("");
	}
}

main();
