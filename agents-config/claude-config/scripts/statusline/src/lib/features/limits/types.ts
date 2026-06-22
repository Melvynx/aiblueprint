export interface UsageLimits {
	five_hour: {
		utilization: number;
		resets_at: string | null;
	} | null;
	seven_day: {
		utilization: number;
		resets_at: string | null;
	} | null;
}

export interface CachedUsageLimits {
	data: UsageLimits;
	timestamp: number;
}
