import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getContextData, getContextLength } from "../src/lib/context";

const TEST_DIR = join(import.meta.dir, "..", "fixtures", "test-transcripts");

beforeAll(() => {
	mkdirSync(TEST_DIR, { recursive: true });
});

afterAll(() => {
	rmSync(TEST_DIR, { recursive: true, force: true });
});

function createTranscript(lines: object[]): string {
	return lines.map((l) => JSON.stringify(l)).join("\n");
}

describe("getContextLength", () => {
	it("should return 0 for empty transcript", async () => {
		const path = join(TEST_DIR, "empty.jsonl");
		writeFileSync(path, "");
		expect(await getContextLength(path)).toBe(0);
	});

	it("should return 0 for transcript with no usage data", async () => {
		const path = join(TEST_DIR, "no-usage.jsonl");
		const content = createTranscript([
			{ type: "user", message: { role: "user", content: "hello" } },
		]);
		writeFileSync(path, content);
		expect(await getContextLength(path)).toBe(0);
	});

	it("should calculate tokens from most recent entry", async () => {
		const path = join(TEST_DIR, "with-usage.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 1000, output_tokens: 100 },
				},
			},
			{
				timestamp: "2025-01-01T10:05:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 5000, output_tokens: 200 },
				},
			},
		]);
		writeFileSync(path, content);
		expect(await getContextLength(path)).toBe(5000);
	});

	it("should include cache tokens in calculation", async () => {
		const path = join(TEST_DIR, "with-cache.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: {
						input_tokens: 1000,
						cache_read_input_tokens: 2000,
						cache_creation_input_tokens: 3000,
						output_tokens: 100,
					},
				},
			},
		]);
		writeFileSync(path, content);
		expect(await getContextLength(path)).toBe(6000);
	});

	it("should skip sidechain entries", async () => {
		const path = join(TEST_DIR, "with-sidechain.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 1000, output_tokens: 100 },
				},
			},
			{
				timestamp: "2025-01-01T10:05:00Z",
				isSidechain: true,
				message: {
					role: "assistant",
					usage: { input_tokens: 99999, output_tokens: 200 },
				},
			},
		]);
		writeFileSync(path, content);
		expect(await getContextLength(path)).toBe(1000);
	});

	it("should skip API error messages", async () => {
		const path = join(TEST_DIR, "with-error.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 1000, output_tokens: 100 },
				},
			},
			{
				timestamp: "2025-01-01T10:05:00Z",
				isApiErrorMessage: true,
				message: {
					role: "assistant",
					usage: { input_tokens: 99999, output_tokens: 200 },
				},
			},
		]);
		writeFileSync(path, content);
		expect(await getContextLength(path)).toBe(1000);
	});

	it("should return 0 for non-existent file", async () => {
		expect(await getContextLength("/non/existent/path.jsonl")).toBe(0);
	});
});

describe("getContextData", () => {
	it("should return zeros for non-existent file", async () => {
		const result = await getContextData({
			transcriptPath: "/non/existent/path.jsonl",
			maxContextTokens: 200000,
			autocompactBufferTokens: 45000,
		});
		expect(result).toEqual({ tokens: 0, percentage: 0 });
	});

	it("should calculate percentage correctly", async () => {
		const path = join(TEST_DIR, "percentage.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 100000, output_tokens: 100 },
				},
			},
		]);
		writeFileSync(path, content);

		const result = await getContextData({
			transcriptPath: path,
			maxContextTokens: 200000,
			autocompactBufferTokens: 45000,
		});

		expect(result.tokens).toBe(100000);
		expect(result.percentage).toBe(50);
	});

	it("should add autocompact buffer when useUsableContextOnly is true", async () => {
		const path = join(TEST_DIR, "usable.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 50000, output_tokens: 100 },
				},
			},
		]);
		writeFileSync(path, content);

		const result = await getContextData({
			transcriptPath: path,
			maxContextTokens: 200000,
			autocompactBufferTokens: 45000,
			useUsableContextOnly: true,
		});

		expect(result.tokens).toBe(95000);
	});

	it("should add overhead tokens", async () => {
		const path = join(TEST_DIR, "overhead.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 50000, output_tokens: 100 },
				},
			},
		]);
		writeFileSync(path, content);

		const result = await getContextData({
			transcriptPath: path,
			maxContextTokens: 200000,
			autocompactBufferTokens: 45000,
			overheadTokens: 20000,
		});

		expect(result.tokens).toBe(70000);
	});

	it("should cap percentage at 100", async () => {
		const path = join(TEST_DIR, "over100.jsonl");
		const content = createTranscript([
			{
				timestamp: "2025-01-01T10:00:00Z",
				message: {
					role: "assistant",
					usage: { input_tokens: 250000, output_tokens: 100 },
				},
			},
		]);
		writeFileSync(path, content);

		const result = await getContextData({
			transcriptPath: path,
			maxContextTokens: 200000,
			autocompactBufferTokens: 45000,
		});

		expect(result.percentage).toBe(100);
	});
});
