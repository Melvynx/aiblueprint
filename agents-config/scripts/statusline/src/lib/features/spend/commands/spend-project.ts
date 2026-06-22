#!/usr/bin/env bun

import { table } from "table";
import { formatCost, formatDuration } from "../../../formatters";
import { getAllSessions } from "../database";

function main() {
	const projectName = process.argv[2];

	if (!projectName) {
		console.log("Usage: bun run spend:project <project-name>");
		console.log('Example: bun run spend:project "statusline"');
		process.exit(1);
	}

	const allSessions = getAllSessions();
	const matchingSessions = allSessions.filter((session) =>
		session.cwd.endsWith(projectName),
	);

	if (matchingSessions.length === 0) {
		console.log(`\nNo sessions found for project ending with "${projectName}"`);
		console.log("\nAvailable project paths:");
		const uniquePaths = [...new Set(allSessions.map((s) => s.cwd))];
		for (const path of uniquePaths.slice(0, 10)) {
			console.log(
				`  - ${path.replace(/^(?:\/Users\/[^/]+\/|[A-Z]:\\Users\\[^\\]+\\)/, "~/")}`,
			);
		}
		return;
	}

	const totalCost = matchingSessions.reduce((sum, s) => sum + s.total_cost, 0);
	const totalDuration = matchingSessions.reduce(
		(sum, s) => sum + s.duration_ms,
		0,
	);
	const totalLinesAdded = matchingSessions.reduce(
		(sum, s) => sum + s.lines_added,
		0,
	);
	const totalLinesRemoved = matchingSessions.reduce(
		(sum, s) => sum + s.lines_removed,
		0,
	);

	console.log(`\n📊 Spend for project: ${projectName}\n`);
	console.log(`Sessions: ${matchingSessions.length}`);
	console.log(`Total Cost: $${formatCost(totalCost)}`);
	console.log(`Total Duration: ${formatDuration(totalDuration)}`);
	console.log(`Total Changes: +${totalLinesAdded} -${totalLinesRemoved}`);
	console.log("\n📝 Sessions by date:\n");

	const sessionsByDate = matchingSessions.reduce(
		(acc, session) => {
			const date = session.date;
			if (!acc[date]) {
				acc[date] = { cost: 0, duration: 0, count: 0 };
			}
			acc[date].cost += session.total_cost;
			acc[date].duration += session.duration_ms;
			acc[date].count += 1;
			return acc;
		},
		{} as Record<string, { cost: number; duration: number; count: number }>,
	);

	const sortedDates = Object.entries(sessionsByDate).sort(([a], [b]) =>
		b.localeCompare(a),
	);

	const tableData = [
		["Date", "Sessions", "Cost", "Duration"],
		...sortedDates.map(([date, data]) => [
			date,
			String(data.count),
			`$${formatCost(data.cost)}`,
			formatDuration(data.duration),
		]),
	];

	console.log(table(tableData));
}

main();
