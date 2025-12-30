import { execSync } from "child_process";

export interface UsageLimits {
	fiveHourUtilization: number;
	fiveHourResetsAt: Date;
	sevenDayUtilization: number;
	sevenDayResetsAt: Date;
}

async function getOAuthToken(): Promise<string | null> {
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

		if (!data.five_hour || !data.seven_day) return null;

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
