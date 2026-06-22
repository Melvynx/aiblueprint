import type { HookInput } from "../../types";
import { normalizeResetsAt } from "../../utils";
import {
	addToPeriodCost,
	getAllSessions,
	getPeriodCost,
	getProjectMaxCost,
	getSession,
	getSessionsByDate,
	getSessionTotalCounted,
	getTodaySessionsTotal,
	getTracking,
	updateProjectMaxCost,
	upsertSession,
	upsertTracking,
} from "./database";
import { appendPayloadLogWithContext } from "./payload-logger";
import type { SpendSessionV2 } from "./types";

export async function saveSessionV2(
	input: HookInput,
	currentResetsAt?: string,
): Promise<void> {
	if (
		!input.session_id ||
		input.cost.total_cost_usd === 0 ||
		input.cost.total_cost_usd === null
	) {
		return;
	}

	const sessionId = input.session_id;
	const newTotalCost = input.cost.total_cost_usd; // Cumulative from Claude Code
	const today = new Date().toISOString().split("T")[0];
	const normalizedPeriodId = currentResetsAt
		? normalizeResetsAt(currentResetsAt)
		: null;

	// Get TODAY's session entry for this specific session
	const existingTodaySession = getSession(sessionId, today);

	// Get project max cost (for detecting /clear continuation)
	const projectMaxCost = getProjectMaxCost(input.cwd, today);

	// Get session's own cumulative count
	const sessionCumulativeCounted = getSessionTotalCounted(sessionId);

	// SMART DETECTION for various scenarios
	let deltaCost: number;

	const isNewSession = sessionCumulativeCounted === 0;
	const isClearContinuation = isNewSession && newTotalCost > projectMaxCost;

	if (isNewSession && !isClearContinuation) {
		// First time seeing this session - don't count pre-existing cost
		deltaCost = 0;
	} else if (isClearContinuation) {
		// /clear created new session but costs accumulated from before
		deltaCost = newTotalCost - projectMaxCost;
	} else {
		// Normal case: use session-level tracking
		deltaCost = Math.max(0, newTotalCost - sessionCumulativeCounted);
	}

	// Log with full context for debugging
	appendPayloadLogWithContext(
		input,
		existingTodaySession?.total_cost ?? 0,
		sessionCumulativeCounted,
		deltaCost,
		isNewSession,
		isClearContinuation,
		false, // billing reset detection removed
		projectMaxCost,
	);

	// Always update project max if we surpass it
	if (newTotalCost > projectMaxCost) {
		updateProjectMaxCost(input.cwd, today, newTotalCost);
	}

	// Today's cost for THIS session = previous + delta
	const todayCost = (existingTodaySession?.total_cost ?? 0) + deltaCost;

	// Track cumulative for this session
	// For new sessions, start from current cost (not from 0 + delta)
	const newCumulativeCounted =
		isNewSession && !isClearContinuation
			? newTotalCost
			: sessionCumulativeCounted + deltaCost;

	upsertSession({
		session_id: sessionId,
		total_cost: todayCost,
		cwd: input.cwd,
		date: today,
		duration_ms: input.cost.total_duration_ms,
		lines_added: input.cost.total_lines_added,
		lines_removed: input.cost.total_lines_removed,
		last_resets_at: normalizedPeriodId,
		cumulative_counted: newCumulativeCounted,
	});

	if (!normalizedPeriodId) {
		return;
	}

	if (deltaCost > 0) {
		const tracking = getTracking(sessionId, normalizedPeriodId);

		upsertTracking({
			session_id: sessionId,
			period_id: normalizedPeriodId,
			counted_cost: (tracking?.counted_cost ?? 0) + deltaCost,
			last_session_cost: newTotalCost,
		});

		addToPeriodCost(normalizedPeriodId, deltaCost);
	} else {
		const tracking = getTracking(sessionId, normalizedPeriodId);
		if (!tracking) {
			upsertTracking({
				session_id: sessionId,
				period_id: normalizedPeriodId,
				counted_cost: 0,
				last_session_cost: newTotalCost,
			});
		}
	}
}

export function getCurrentPeriodCostV2(periodId: string): number {
	return getPeriodCost(periodId);
}

export function getTodayCostV2(): number {
	return getTodaySessionsTotal();
}

export function getMonthStart(): Date {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function getAllSessionsV2(): SpendSessionV2[] {
	return getAllSessions().map((row) => ({
		session_id: row.session_id,
		total_cost: row.total_cost,
		cwd: row.cwd,
		date: row.date,
		duration_ms: row.duration_ms,
		lines_added: row.lines_added,
		lines_removed: row.lines_removed,
		last_resets_at: row.last_resets_at,
		cumulative_counted: row.cumulative_counted,
	}));
}

export function getSessionsByDateV2(date: string): SpendSessionV2[] {
	return getSessionsByDate(date).map((row) => ({
		session_id: row.session_id,
		total_cost: row.total_cost,
		cwd: row.cwd,
		date: row.date,
		duration_ms: row.duration_ms,
		lines_added: row.lines_added,
		lines_removed: row.lines_removed,
		last_resets_at: row.last_resets_at,
		cumulative_counted: row.cumulative_counted,
	}));
}

export function calculateTotalCost(sessions: SpendSessionV2[]): number {
	return sessions.reduce((sum, session) => sum + session.total_cost, 0);
}

export { getPeriodCost } from "./database";
export type { SpendSessionV2 } from "./types";
