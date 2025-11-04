import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HookInput } from "./types";

export interface SpendSession {
	id: string;
	cost: number;
	date: string;
	duration_ms: number;
	lines_added: number;
	lines_removed: number;
	cwd: string;
}

export interface SpendData {
	sessions: SpendSession[];
}

export function getSpendFilePath(): string {
	// Use the project's data folder instead of ~/.claude
	const projectRoot = join(import.meta.dir, "..", "..");
	return join(projectRoot, "data", "spend.json");
}

export async function loadSpendData(): Promise<SpendData> {
	const spendFile = getSpendFilePath();

	if (!existsSync(spendFile)) {
		return { sessions: [] };
	}

	try {
		const content = await readFile(spendFile, "utf-8");
		return JSON.parse(content);
	} catch {
		return { sessions: [] };
	}
}

export async function saveSpendData(data: SpendData): Promise<void> {
	const spendFile = getSpendFilePath();
	const projectRoot = join(import.meta.dir, "..", "..");
	const dataDir = join(projectRoot, "data");

	if (!existsSync(dataDir)) {
		mkdirSync(dataDir, { recursive: true });
	}

	await writeFile(spendFile, JSON.stringify(data, null, 2));
}

export async function saveSession(input: HookInput): Promise<void> {
	if (
		!input.session_id ||
		input.cost.total_cost_usd === 0 ||
		input.cost.total_cost_usd === null
	) {
		return;
	}

	const data = await loadSpendData();
	const isoDate = new Date().toISOString().split("T")[0];

	const session: SpendSession = {
		id: input.session_id,
		cost: input.cost.total_cost_usd,
		date: isoDate,
		duration_ms: input.cost.total_duration_ms,
		lines_added: input.cost.total_lines_added,
		lines_removed: input.cost.total_lines_removed,
		cwd: input.cwd,
	};

	const existingIndex = data.sessions.findIndex(
		(s) => s.id === input.session_id,
	);

	if (existingIndex !== -1) {
		data.sessions[existingIndex] = session;
	} else {
		data.sessions.push(session);
	}

	await saveSpendData(data);
}

export function filterSessionsByDate(
	sessions: SpendSession[],
	startDate: Date,
	endDate?: Date,
): SpendSession[] {
	return sessions.filter((session) => {
		const sessionDate = new Date(session.date);
		if (endDate) {
			return sessionDate >= startDate && sessionDate <= endDate;
		}
		return sessionDate >= startDate;
	});
}

export function calculateTotalCost(sessions: SpendSession[]): number {
	return sessions.reduce((sum, session) => sum + session.cost, 0);
}

export function calculateTotalDuration(sessions: SpendSession[]): number {
	return sessions.reduce((sum, session) => sum + session.duration_ms, 0);
}

export function getTodayStart(): Date {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
}

export function getMonthStart(): Date {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), 1);
}
