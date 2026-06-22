import {
	appendFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { HookInput } from "../../types";

const DATA_DIR = join(import.meta.dir, "..", "..", "..", "..", "data");
const PAYLOADS_FILE = join(DATA_DIR, "payloads.jsonl");
const MAX_ENTRIES = 10000;

// Enable payload logging with: STATUSLINE_DEBUG=1
const DEBUG_ENABLED = process.env.STATUSLINE_DEBUG === "1";

export interface PayloadLogEntry {
	event_id: string;
	timestamp: string;
	session_id: string;
	cwd: string;
	total_cost_usd: number;
	total_duration_ms: number;
	lines_added: number;
	lines_removed: number;
	model_id: string;
	transcript_path: string;
	context?: {
		existing_session_cost?: number;
		session_cumulative_counted?: number;
		delta_cost?: number;
		is_new_session?: boolean;
		is_clear_continuation?: boolean;
		is_billing_reset?: boolean;
		project_max_cost?: number;
	};
}

function generateEventId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function appendPayloadLog(
	input: HookInput,
	context?: PayloadLogEntry["context"],
): void {
	if (!DEBUG_ENABLED) {
		return;
	}

	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}

	const entry: PayloadLogEntry = {
		event_id: generateEventId(),
		timestamp: new Date().toISOString(),
		session_id: input.session_id,
		cwd: input.cwd,
		total_cost_usd: input.cost.total_cost_usd,
		total_duration_ms: input.cost.total_duration_ms,
		lines_added: input.cost.total_lines_added,
		lines_removed: input.cost.total_lines_removed,
		model_id: input.model.id,
		transcript_path: input.transcript_path,
		...(context && { context }),
	};

	const line = JSON.stringify(entry) + "\n";
	appendFileSync(PAYLOADS_FILE, line);
}

export function appendPayloadLogWithContext(
	input: HookInput,
	existingSessionCost: number,
	sessionCumulativeCounted: number,
	deltaCost: number,
	isNewSession: boolean,
	isClearContinuation: boolean,
	isBillingReset: boolean,
	projectMaxCost: number,
): void {
	appendPayloadLog(input, {
		existing_session_cost: existingSessionCost,
		session_cumulative_counted: sessionCumulativeCounted,
		delta_cost: deltaCost,
		is_new_session: isNewSession,
		is_clear_continuation: isClearContinuation,
		is_billing_reset: isBillingReset,
		project_max_cost: projectMaxCost,
	});
}

export function readPayloadLogs(): PayloadLogEntry[] {
	if (!existsSync(PAYLOADS_FILE)) {
		return [];
	}

	const content = readFileSync(PAYLOADS_FILE, "utf-8");
	const lines = content.trim().split("\n").filter(Boolean);

	return lines.map((line) => JSON.parse(line) as PayloadLogEntry);
}

export function rotatePayloadLogs(): void {
	const entries = readPayloadLogs();

	if (entries.length <= MAX_ENTRIES) {
		return;
	}

	const toKeep = entries.slice(-MAX_ENTRIES);
	const content = toKeep.map((e) => JSON.stringify(e)).join("\n") + "\n";
	writeFileSync(PAYLOADS_FILE, content);
}

export function getPayloadsGroupedBySession(): Map<string, PayloadLogEntry[]> {
	const entries = readPayloadLogs();
	const grouped = new Map<string, PayloadLogEntry[]>();

	for (const entry of entries) {
		const existing = grouped.get(entry.session_id) || [];
		existing.push(entry);
		grouped.set(entry.session_id, existing);
	}

	return grouped;
}

export function getTodayPayloads(): PayloadLogEntry[] {
	const today = new Date().toISOString().split("T")[0];
	const entries = readPayloadLogs();

	return entries.filter((e) => e.timestamp.startsWith(today));
}

export function getTodayRealCost(): number {
	const todayEntries = getTodayPayloads();
	if (todayEntries.length === 0) return 0;

	// Group by session
	const sessions = new Map<string, PayloadLogEntry[]>();
	for (const entry of todayEntries) {
		const existing = sessions.get(entry.session_id) || [];
		existing.push(entry);
		sessions.set(entry.session_id, existing);
	}

	// Calculate real delta per session (last_cost - first_cost)
	let totalRealCost = 0;
	for (const [, entries] of sessions) {
		const sorted = entries.sort(
			(a, b) =>
				new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);
		const realDelta =
			sorted[sorted.length - 1].total_cost_usd - sorted[0].total_cost_usd;
		totalRealCost += Math.max(0, realDelta);
	}

	return totalRealCost;
}
