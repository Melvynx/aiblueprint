export interface SessionRow {
	session_id: string;
	total_cost: number;
	cwd: string;
	date: string;
	duration_ms: number;
	lines_added: number;
	lines_removed: number;
	last_resets_at: string | null;
	cumulative_counted: number;
}

export interface PeriodRow {
	period_id: string;
	total_cost: number;
	utilization: number;
	date: string;
}

export interface TrackingRow {
	session_id: string;
	period_id: string;
	counted_cost: number;
	last_session_cost: number;
}

export interface SpendSessionV2 {
	session_id: string;
	total_cost: number;
	cwd: string;
	date: string;
	duration_ms: number;
	lines_added: number;
	lines_removed: number;
	last_resets_at: string | null;
	cumulative_counted: number;
}
