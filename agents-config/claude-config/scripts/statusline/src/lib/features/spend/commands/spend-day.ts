#!/usr/bin/env bun

import { table } from "table";
import { formatCost, formatDuration } from "../../../formatters";
import { getSessionsByDate } from "../database";

function parseDate(input?: string): string {
	if (!input) {
		return new Date().toISOString().split("T")[0];
	}

	// Try parsing as YYYY-MM-DD
	if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
		return input;
	}

	// Try parsing as MM-DD (current year)
	if (/^\d{2}-\d{2}$/.test(input)) {
		const year = new Date().getFullYear();
		return `${year}-${input}`;
	}

	// Try parsing as natural date
	const parsed = new Date(input);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed.toISOString().split("T")[0];
	}

	console.log(`⚠️  Invalid date format: "${input}". Using today.`);
	return new Date().toISOString().split("T")[0];
}

function isToday(date: string): boolean {
	return date === new Date().toISOString().split("T")[0];
}

async function main() {
	const dateArg = process.env.DATE || process.argv[2];
	const targetDate = parseDate(dateArg);
	const sessions = getSessionsByDate(targetDate);

	const dateLabel = isToday(targetDate) ? "Today" : targetDate;

	if (sessions.length === 0) {
		console.log(`📊 No sessions for ${dateLabel}`);
		return;
	}

	const totalCost = sessions.reduce((sum, s) => sum + s.total_cost, 0);
	const totalDuration = sessions.reduce((sum, s) => sum + s.duration_ms, 0);

	console.log(`\n📊 Spend for ${dateLabel}\n`);
	console.log(`Sessions: ${sessions.length}`);
	console.log(`Total Cost: $${formatCost(totalCost)}`);
	console.log(`Total Duration: ${formatDuration(totalDuration)}`);
	console.log("\n📝 Sessions:\n");

	const filteredSessions = sessions
		.filter((session) => session.total_cost >= 0.1)
		.sort((a, b) => b.total_cost - a.total_cost);

	const tableData = [
		["ID", "Cost", "Duration", "Changes", "Directory"],
		...filteredSessions.map((session) => [
			session.session_id.slice(0, 8),
			`$${formatCost(session.total_cost)}`,
			formatDuration(session.duration_ms),
			`+${session.lines_added} -${session.lines_removed}`,
			session.cwd.replace(
				/^(?:\/Users\/[^/]+\/|[A-Z]:\\Users\\[^\\]+\\)/,
				"~/",
			),
		]),
	];

	console.log(table(tableData));
}

main();
