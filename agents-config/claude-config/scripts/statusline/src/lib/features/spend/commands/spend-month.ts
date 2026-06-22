#!/usr/bin/env bun

import { table } from "table";
import { formatCost, formatDuration } from "../../../formatters";
import { getAllSessions } from "../database";
import { getMonthStart } from "../index";
import type { SessionRow } from "../types";

async function main() {
	const allSessions = getAllSessions();
	const monthStart = getMonthStart();
	const monthStartStr = monthStart.toISOString().split("T")[0];

	const monthSessions = allSessions.filter((s) => s.date >= monthStartStr);

	if (monthSessions.length === 0) {
		console.log("📊 No sessions this month");
		return;
	}

	const totalCost = monthSessions.reduce((sum, s) => sum + s.total_cost, 0);
	const totalDuration = monthSessions.reduce(
		(sum, s) => sum + s.duration_ms,
		0,
	);

	const sessionsByDate = monthSessions.reduce(
		(acc, session) => {
			if (!acc[session.date]) {
				acc[session.date] = [];
			}
			acc[session.date].push(session);
			return acc;
		},
		{} as Record<string, SessionRow[]>,
	);

	const monthName = monthStart.toLocaleString("default", { month: "long" });

	console.log(`\n📊 ${monthName}'s Spend\n`);
	console.log(`Sessions: ${monthSessions.length}`);
	console.log(`Total Cost: $${formatCost(totalCost)}`);
	console.log(`Total Duration: ${formatDuration(totalDuration)}`);
	console.log("\n📅 By Date:\n");

	const sortedDates = Object.keys(sessionsByDate).sort();

	const tableData = [
		["Date", "Cost", "Duration", "Sessions"],
		...sortedDates.map((date) => {
			const sessions = sessionsByDate[date];
			const dayCost = sessions.reduce((sum, s) => sum + s.total_cost, 0);
			const dayDuration = sessions.reduce((sum, s) => sum + s.duration_ms, 0);
			return [
				date,
				`$${formatCost(dayCost)}`,
				formatDuration(dayDuration),
				sessions.length.toString(),
			];
		}),
	];

	console.log(table(tableData));
}

main();
