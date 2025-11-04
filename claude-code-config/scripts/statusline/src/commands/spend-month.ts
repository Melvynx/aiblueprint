#!/usr/bin/env bun

import { formatCost, formatDuration } from "../lib/formatters";
import {
	calculateTotalCost,
	calculateTotalDuration,
	filterSessionsByDate,
	getMonthStart,
	loadSpendData,
} from "../lib/spend";

async function main() {
	const data = await loadSpendData();
	const monthStart = getMonthStart();
	const monthSessions = filterSessionsByDate(data.sessions, monthStart);

	if (monthSessions.length === 0) {
		console.log("📊 No sessions this month");
		return;
	}

	const totalCost = calculateTotalCost(monthSessions);
	const totalDuration = calculateTotalDuration(monthSessions);

	// Group by date
	const sessionsByDate = monthSessions.reduce(
		(acc, session) => {
			if (!acc[session.date]) {
				acc[session.date] = [];
			}
			acc[session.date].push(session);
			return acc;
		},
		{} as Record<string, typeof monthSessions>,
	);

	const monthName = monthStart.toLocaleString("default", { month: "long" });

	console.log(`\n📊 ${monthName}'s Spend\n`);
	console.log(`Sessions: ${monthSessions.length}`);
	console.log(`Total Cost: $${formatCost(totalCost)}`);
	console.log(`Total Duration: ${formatDuration(totalDuration)}`);
	console.log(`\n📅 By Date:\n`);

	const sortedDates = Object.keys(sessionsByDate).sort();

	for (const date of sortedDates) {
		const sessions = sessionsByDate[date];
		const dayCost = calculateTotalCost(sessions);
		const dayDuration = calculateTotalDuration(sessions);

		console.log(
			`  ${date}: $${formatCost(dayCost)} (${formatDuration(dayDuration)}) - ${sessions.length} session(s)`,
		);
	}

	console.log("");
}

main();
