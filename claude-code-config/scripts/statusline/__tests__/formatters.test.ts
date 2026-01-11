import { describe, expect, it } from "bun:test";
import {
	formatCost,
	formatDuration,
	formatPath,
	formatResetTime,
	formatTokens,
} from "../src/lib/formatters";

describe("formatPath", () => {
	it("should return basename for basename mode", () => {
		expect(formatPath("/Users/test/project/src/file.ts", "basename")).toBe(
			"file.ts",
		);
	});

	it("should truncate long paths in truncated mode", () => {
		const result = formatPath("/Users/test/deep/nested/path/file.ts");
		expect(result).toContain("path");
		expect(result).toContain("file.ts");
	});

	it("should handle Windows-style paths", () => {
		expect(formatPath("C:\\Users\\test\\project\\file.ts", "basename")).toBe(
			"file.ts",
		);
	});

	it("should handle mixed separators", () => {
		expect(formatPath("/Users/test\\mixed/path", "basename")).toBe("path");
	});
});

describe("formatCost", () => {
	it("should format with 1 decimal by default", () => {
		expect(formatCost(1.234)).toBe("1.2");
	});

	it("should format as integer when specified", () => {
		expect(formatCost(1.789, "integer")).toBe("2");
	});

	it("should format with 2 decimals when specified", () => {
		expect(formatCost(1.789, "decimal2")).toBe("1.79");
	});
});

describe("formatTokens", () => {
	it("should format thousands with k suffix", () => {
		const result = formatTokens(5000);
		expect(result).toContain("5.0");
		expect(result).toContain("k");
	});

	it("should format millions with m suffix", () => {
		const result = formatTokens(1500000);
		expect(result).toContain("1.5");
		expect(result).toContain("m");
	});

	it("should return raw number for small values", () => {
		const result = formatTokens(500);
		expect(result).toContain("500");
	});

	it("should hide decimals when showDecimals is false", () => {
		const result = formatTokens(5500, false);
		expect(result).toContain("6");
	});
});

describe("formatDuration", () => {
	it("should format minutes only for short durations", () => {
		expect(formatDuration(300000)).toBe("5m");
	});

	it("should format hours and minutes for long durations", () => {
		expect(formatDuration(5400000)).toBe("1h 30m");
	});

	it("should handle zero duration", () => {
		expect(formatDuration(0)).toBe("0m");
	});
});

describe("formatResetTime", () => {
	it("should return 'now' for past times", () => {
		const pastTime = new Date(Date.now() - 60000).toISOString();
		expect(formatResetTime(pastTime)).toBe("now");
	});

	it("should format future times with hours and minutes", () => {
		const futureTime = new Date(Date.now() + 3700000).toISOString();
		const result = formatResetTime(futureTime);
		expect(result).toContain("h");
		expect(result).toContain("m");
	});

	it("should format minutes only for short durations", () => {
		const futureTime = new Date(Date.now() + 1800000).toISOString();
		const result = formatResetTime(futureTime);
		expect(result).toMatch(/^\d+m$/);
	});

	it("should return N/A for invalid dates", () => {
		expect(formatResetTime("invalid-date")).toBe("N/A");
	});
});
