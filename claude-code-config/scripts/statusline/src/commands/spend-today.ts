#!/usr/bin/env bun

import { formatCost, formatDuration } from "../lib/formatters";
import {
	calculateTotalCost,
	calculateTotalDuration,
	filterSessionsByDate,
	getTodayStart,
	loadSpendData,
} from "../lib/spend";

async function main() {
	const data = await loadSpendData();
	const today = getTodayStart();
	const todaySessions = filterSessionsByDate(data.sessions, today);

	if (todaySessions.length === 0) {
		console.log("📊 No sessions today");
		return;
	}

	const totalCost = calculateTotalCost(todaySessions);
	const totalDuration = calculateTotalDuration(todaySessions);

	console.log(`\n📊 Today's Spend\n`);
	console.log(`Sessions: ${todaySessions.length}`);
	console.log(`Total Cost: $${formatCost(totalCost)}`);
	console.log(`Total Duration: ${formatDuration(totalDuration)}`);
	console.log(`\n📝 Sessions:\n`);

	for (const session of todaySessions) {
		console.log(
			`  • $${formatCost(session.cost)} (${formatDuration(session.duration_ms)})`,
		);
		console.log(`    ${session.cwd}`);
		console.log(
			`    +${session.lines_added} -${session.lines_removed} lines\n`,
		);
	}
}

main();
