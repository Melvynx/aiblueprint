import { describe, expect, it } from "bun:test";
import { renderStatusline, type StatuslineData } from "../src/index";
import { defaultConfig, type StatuslineConfig } from "../src/lib/config";

function createMockData(
	overrides: Partial<StatuslineData> = {},
): StatuslineData {
	return {
		branch: "main",
		dirPath: "~/project",
		modelName: "Sonnet 4.5",
		sessionCost: "0.5",
		sessionDuration: "10m",
		contextTokens: 50000,
		contextPercentage: 25,
		usageLimits: {
			five_hour: { utilization: 30, resets_at: "2025-01-01T15:00:00Z" },
			seven_day: { utilization: 10, resets_at: "2025-01-07T00:00:00Z" },
		},
		periodCost: 1.5,
		todayCost: 2.0,
		...overrides,
	};
}

function createConfig(
	overrides: Partial<StatuslineConfig> = {},
): StatuslineConfig {
	return { ...defaultConfig, ...overrides };
}

describe("renderStatusline", () => {
	describe("basic rendering", () => {
		it("should render branch and directory", () => {
			const data = createMockData();
			const config = createConfig();
			const output = renderStatusline(data, config);

			expect(output).toContain("main");
			expect(output).toContain("~/project");
		});

		it("should hide Sonnet model name when showSonnetModel is false", () => {
			const data = createMockData({ modelName: "Sonnet 4.5" });
			const config = createConfig({ showSonnetModel: false });
			const output = renderStatusline(data, config);

			expect(output).not.toContain("Sonnet");
		});

		it("should show Sonnet model name when showSonnetModel is true", () => {
			const data = createMockData({ modelName: "Sonnet 4.5" });
			const config = createConfig({ showSonnetModel: true });
			const output = renderStatusline(data, config);

			expect(output).toContain("Sonnet");
		});

		it("should always show non-Sonnet models", () => {
			const data = createMockData({ modelName: "Opus 4.5" });
			const config = createConfig({ showSonnetModel: false });
			const output = renderStatusline(data, config);

			expect(output).toContain("Opus");
		});
	});

	describe("session info", () => {
		it("should show cost when enabled", () => {
			const data = createMockData({ sessionCost: "1.5" });
			const config = createConfig({
				session: {
					...defaultConfig.session,
					cost: { enabled: true, format: "decimal1" },
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("$");
			expect(output).toContain("1.5");
		});

		it("should hide cost when disabled", () => {
			const data = createMockData({ sessionCost: "1.5" });
			const config = createConfig({
				session: {
					...defaultConfig.session,
					cost: { enabled: false, format: "decimal1" },
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("S:");
		});

		it("should show duration when enabled", () => {
			const data = createMockData({ sessionDuration: "15m" });
			const config = createConfig({
				session: {
					...defaultConfig.session,
					duration: { enabled: true },
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("15m");
		});

		it("should show percentage when enabled", () => {
			const data = createMockData({ contextPercentage: 45 });
			const config = createConfig({
				session: {
					...defaultConfig.session,
					percentage: {
						enabled: true,
						showValue: true,
						progressBar: {
							...defaultConfig.session.percentage.progressBar,
							enabled: false,
						},
					},
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("45");
			expect(output).toContain("%");
		});
	});

	describe("limits section", () => {
		it("should show limits when enabled", () => {
			const data = createMockData({
				usageLimits: {
					five_hour: { utilization: 50, resets_at: "2025-01-01T15:00:00Z" },
					seven_day: null,
				},
			});
			const config = createConfig({
				limits: {
					...defaultConfig.limits,
					enabled: true,
					percentage: {
						enabled: true,
						showValue: true,
						progressBar: {
							...defaultConfig.limits.percentage.progressBar,
							enabled: false,
						},
					},
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("L:");
			expect(output).toContain("50");
		});

		it("should hide limits when disabled", () => {
			const data = createMockData();
			const config = createConfig({
				limits: { ...defaultConfig.limits, enabled: false },
			});
			const output = renderStatusline(data, config);

			expect(output).not.toContain("L:");
		});

		it("should show reset time when enabled", () => {
			const futureTime = new Date(Date.now() + 3600000).toISOString();
			const data = createMockData({
				usageLimits: {
					five_hour: { utilization: 50, resets_at: futureTime },
					seven_day: null,
				},
			});
			const config = createConfig({
				limits: {
					...defaultConfig.limits,
					enabled: true,
					showTimeLeft: true,
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toMatch(/\(\d+[hm]/);
		});
	});

	describe("weekly usage", () => {
		it("should show weekly when enabled=true", () => {
			const data = createMockData({
				usageLimits: {
					five_hour: { utilization: 30, resets_at: null },
					seven_day: { utilization: 20, resets_at: null },
				},
			});
			const config = createConfig({
				weeklyUsage: {
					...defaultConfig.weeklyUsage,
					enabled: true,
					percentage: {
						enabled: true,
						showValue: true,
						progressBar: {
							...defaultConfig.weeklyUsage.percentage.progressBar,
							enabled: false,
						},
					},
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("W:");
		});

		it("should show weekly when enabled=90% and five_hour >= 90", () => {
			const data = createMockData({
				usageLimits: {
					five_hour: { utilization: 95, resets_at: null },
					seven_day: { utilization: 20, resets_at: null },
				},
			});
			const config = createConfig({
				weeklyUsage: {
					...defaultConfig.weeklyUsage,
					enabled: "90%",
					percentage: {
						enabled: true,
						showValue: true,
						progressBar: {
							...defaultConfig.weeklyUsage.percentage.progressBar,
							enabled: false,
						},
					},
				},
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("W:");
		});

		it("should hide weekly when enabled=90% and five_hour < 90", () => {
			const data = createMockData({
				usageLimits: {
					five_hour: { utilization: 50, resets_at: null },
					seven_day: { utilization: 20, resets_at: null },
				},
			});
			const config = createConfig({
				weeklyUsage: { ...defaultConfig.weeklyUsage, enabled: "90%" },
			});
			const output = renderStatusline(data, config);

			expect(output).not.toContain("W:");
		});
	});

	describe("daily spend", () => {
		it("should show daily cost when enabled and > 0", () => {
			const data = createMockData({ todayCost: 5.5 });
			const config = createConfig({
				dailySpend: { cost: { enabled: true, format: "decimal1" } },
			});
			const output = renderStatusline(data, config);

			expect(output).toContain("D:");
			expect(output).toContain("5.5");
		});

		it("should hide daily cost when todayCost is 0", () => {
			const data = createMockData({ todayCost: 0 });
			const config = createConfig({
				dailySpend: { cost: { enabled: true, format: "decimal1" } },
			});
			const output = renderStatusline(data, config);

			expect(output).not.toContain("D:");
		});
	});

	describe("separators", () => {
		it("should use configured separator", () => {
			const data = createMockData();
			const config = createConfig({ separator: "|" });
			const output = renderStatusline(data, config);

			expect(output).toContain("|");
		});
	});

	describe("one line vs two lines", () => {
		it("should render on one line when oneLine is true", () => {
			const data = createMockData();
			const config = createConfig({ oneLine: true });
			const output = renderStatusline(data, config);

			expect(output.split("\n").length).toBe(1);
		});

		it("should render on two lines when oneLine is false", () => {
			const data = createMockData();
			const config = createConfig({ oneLine: false });
			const output = renderStatusline(data, config);

			expect(output).toContain("\n");
		});
	});
});
