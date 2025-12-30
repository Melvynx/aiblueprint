import { existsSync } from "node:fs";

interface TokenUsage {
	input_tokens: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
}

interface TranscriptLine {
	message?: { usage?: TokenUsage };
	timestamp?: string;
	isSidechain?: boolean;
	isApiErrorMessage?: boolean;
}

export interface ContextResult {
	tokens: number;
	percentage: number;
}

async function getContextLength(transcriptPath: string): Promise<number> {
	try {
		const content = await Bun.file(transcriptPath).text();
		const lines = content.trim().split("\n");

		if (lines.length === 0) return 0;

		let mostRecentEntry: TranscriptLine | null = null;
		let mostRecentTimestamp: Date | null = null;

		for (const line of lines) {
			try {
				const data = JSON.parse(line) as TranscriptLine;

				if (!data.message?.usage) continue;
				if (data.isSidechain === true) continue;
				if (data.isApiErrorMessage === true) continue;
				if (!data.timestamp) continue;

				const entryTime = new Date(data.timestamp);

				if (!mostRecentTimestamp || entryTime > mostRecentTimestamp) {
					mostRecentTimestamp = entryTime;
					mostRecentEntry = data;
				}
			} catch {}
		}

		if (!mostRecentEntry?.message?.usage) {
			return 0;
		}

		const usage = mostRecentEntry.message.usage;

		return (
			(usage.input_tokens || 0) +
			(usage.cache_read_input_tokens ?? 0) +
			(usage.cache_creation_input_tokens ?? 0)
		);
	} catch {
		return 0;
	}
}

interface ContextDataParams {
	transcriptPath: string;
	maxContextTokens: number;
}

export async function getContextData({
	transcriptPath,
	maxContextTokens,
}: ContextDataParams): Promise<ContextResult> {
	if (!transcriptPath || !existsSync(transcriptPath)) {
		return { tokens: 0, percentage: 0 };
	}

	const tokens = await getContextLength(transcriptPath);
	const percentage = Math.min(
		100,
		Math.round((tokens / maxContextTokens) * 100),
	);

	return { tokens, percentage };
}
