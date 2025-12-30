import { execSync } from "node:child_process";

export interface UsageLimits {
	fiveHourUtilization: number;
	fiveHourResetsAt: Date;
	sevenDayUtilization: number;
	sevenDayResetsAt: Date;
}

/**
 * Retrieves OAuth token from system keychain.
 * Currently only supports macOS via the `security` command.
 * Returns null on other platforms or if token is not found.
 */
async function getOAuthToken(): Promise<string | null> {
	// Only macOS is supported for keychain access
	if (process.platform !== "darwin") {
		return null;
	}

	try {
		const result = execSync(
			'security find-generic-password -s "Claude Code-credentials" -w',
			{
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			},
		).trim();

		const credentials = JSON.parse(result);
		return credentials.claudeAiOauth?.accessToken || null;
	} catch {
		return null;
	}
}

/**
 * Validates the structure of the API response.
 * Ensures all required fields are present and have the correct types.
 */
function isValidUsageResponse(data: unknown): data is {
	five_hour: { utilization: number; resets_at: string };
	seven_day: { utilization: number; resets_at: string };
} {
	if (!data || typeof data !== "object") return false;

	const obj = data as Record<string, unknown>;

	// Validate five_hour
	if (!obj.five_hour || typeof obj.five_hour !== "object") return false;
	const fiveHour = obj.five_hour as Record<string, unknown>;
	if (
		typeof fiveHour.utilization !== "number" ||
		typeof fiveHour.resets_at !== "string"
	) {
		return false;
	}

	// Validate seven_day
	if (!obj.seven_day || typeof obj.seven_day !== "object") return false;
	const sevenDay = obj.seven_day as Record<string, unknown>;
	if (
		typeof sevenDay.utilization !== "number" ||
		typeof sevenDay.resets_at !== "string"
	) {
		return false;
	}

	return true;
}

/**
 * Fetches usage limits from the Anthropic OAuth API.
 * Returns null if the token is unavailable, API call fails, or response is invalid.
 *
 * Note: The API beta version may need updating over time.
 * Current version: oauth-2025-04-20
 */
export async function getUsageLimits(): Promise<UsageLimits | null> {
	try {
		const token = await getOAuthToken();
		if (!token) return null;

		const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				"anthropic-beta": "oauth-2025-04-20",
			},
		});

		if (!response.ok) return null;

		const data = await response.json();

		// Validate response structure before using
		if (!isValidUsageResponse(data)) return null;

		return {
			fiveHourUtilization: data.five_hour.utilization,
			fiveHourResetsAt: new Date(data.five_hour.resets_at),
			sevenDayUtilization: data.seven_day.utilization,
			sevenDayResetsAt: new Date(data.seven_day.resets_at),
		};
	} catch {
		return null;
	}
}
