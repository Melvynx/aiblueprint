#!/usr/bin/env bun

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defaultConfig, type StatuslineConfig } from "../lib/config";
import { colors } from "../lib/formatters";
import {
	cycle,
	type MenuOption,
	PATH_DISPLAY_MODES,
	PROGRESS_BAR_COLORS,
	PROGRESS_BAR_LENGTHS,
	SEPARATORS,
	toggle,
} from "../lib/menu-factories";
import { PRESETS } from "../lib/presets";
import {
	type RawStatuslineData,
	renderStatuslineRaw,
} from "../lib/render-pure";

const CONFIG_FILE_PATH = join(
	import.meta.dir,
	"..",
	"..",
	"statusline.config.json",
);

// ─────────────────────────────────────────────────────────────
// RAW MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_DATA: RawStatuslineData = {
	git: {
		branch: "main",
		dirty: true,
		staged: { files: 2, added: 45, deleted: 12 },
		unstaged: { files: 3, added: 23, deleted: 8 },
	},
	path: "/Users/dev/.claude/project",
	modelName: "Sonnet 4.5",
	cost: 0.24,
	durationMs: 720000,
	contextTokens: 75000,
	contextPercentage: 38,
	usageLimits: {
		five_hour: {
			utilization: 29,
			resets_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
		},
		seven_day: {
			utilization: 45,
			resets_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
		},
	},
	periodCost: 36,
	todayCost: 12.5,
};

// ─────────────────────────────────────────────────────────────
// HELPER: Progress bar style cycle (includes "None")
// ─────────────────────────────────────────────────────────────

const PROGRESS_STYLES = ["None", "Braille", "Rectangle", "Filled"] as const;

function progressStyleCycle(
	basePath: string,
	parentHidden: (c: StatuslineConfig) => boolean,
): MenuOption {
	return {
		path: `${basePath}.progressBar.style`,
		label: "Progress bar",
		type: "cycle",
		choices: [...PROGRESS_STYLES],
		getValue: (c) => {
			const bar = getNestedValue(c, `${basePath}.progressBar`) as {
				enabled: boolean;
				style: string;
			};
			if (!bar.enabled) return "None";
			return bar.style.charAt(0).toUpperCase() + bar.style.slice(1);
		},
		cycle: (c, dir) => {
			const bar = getNestedValue(c, `${basePath}.progressBar`) as {
				enabled: boolean;
				style: string;
			};
			const current = bar.enabled
				? bar.style.charAt(0).toUpperCase() + bar.style.slice(1)
				: "None";
			const idx = PROGRESS_STYLES.indexOf(
				current as (typeof PROGRESS_STYLES)[number],
			);
			const next =
				PROGRESS_STYLES[
					(idx + dir + PROGRESS_STYLES.length) % PROGRESS_STYLES.length
				];
			if (next === "None") {
				setNestedValue(c, `${basePath}.progressBar.enabled`, false);
			} else {
				setNestedValue(c, `${basePath}.progressBar.enabled`, true);
				setNestedValue(c, `${basePath}.progressBar.style`, next.toLowerCase());
			}
		},
		hidden: parentHidden,
	};
}

function getNestedValue(obj: unknown, path: string): unknown {
	return path.split(".").reduce((current, key) => {
		if (current && typeof current === "object" && key in current) {
			return (current as Record<string, unknown>)[key];
		}
		return undefined;
	}, obj);
}

function setNestedValue(obj: unknown, path: string, value: unknown): void {
	const keys = path.split(".");
	const lastKey = keys.pop();
	if (!lastKey) return;
	let current = obj;
	for (const key of keys) {
		if (current && typeof current === "object" && key in current) {
			current = (current as Record<string, unknown>)[key];
		} else {
			return;
		}
	}
	if (current && typeof current === "object") {
		(current as Record<string, unknown>)[lastKey] = value;
	}
}

// ─────────────────────────────────────────────────────────────
// MENU STRUCTURE
// ─────────────────────────────────────────────────────────────

interface Tab {
	id: string;
	label: string;
	options: MenuOption[];
}

const tabs: Tab[] = [
	{
		id: "presets",
		label: "PRESETS",
		options: PRESETS.map((preset, index) => ({
			path: `preset.${index}`,
			label: preset.name,
			description: preset.description,
			type: "boolean" as const,
			getValue: () => false,
			toggle: () => {},
			isPreset: true,
			presetIndex: index,
		})),
	},
	{
		id: "session",
		label: "SESSION",
		options: [
			toggle("session.duration.enabled", "Duration"),
			toggle("session.tokens.enabled", "Token count"),
			toggle("session.tokens.showMax", "  Show max", {
				hidden: (c) => !c.session.tokens.enabled,
			}),
			toggle("session.tokens.showDecimals", "  Decimals", {
				hidden: (c) => !c.session.tokens.enabled,
			}),
			toggle("session.percentage.enabled", "Context %"),
			toggle("session.percentage.showValue", "  Show value", {
				hidden: (c) => !c.session.percentage.enabled,
			}),
			progressStyleCycle(
				"session.percentage",
				(c) => !c.session.percentage.enabled,
			),
			cycle(
				"session.percentage.progressBar.length",
				"    Length",
				PROGRESS_BAR_LENGTHS,
				{
					hidden: (c) =>
						!c.session.percentage.enabled ||
						!c.session.percentage.progressBar.enabled,
				},
			),
			cycle(
				"session.percentage.progressBar.color",
				"    Color",
				PROGRESS_BAR_COLORS,
				{
					hidden: (c) =>
						!c.session.percentage.enabled ||
						!c.session.percentage.progressBar.enabled,
				},
			),
			toggle("context.useUsableContextOnly", "45k buffer"),
		],
	},
	{
		id: "git",
		label: "GIT",
		options: [
			{
				path: "git.enabled",
				label: "Git info",
				type: "cycle" as const,
				choices: ["Enabled", "Disabled"],
				getValue: (c) => (c.git.enabled ? "Enabled" : "Disabled"),
				cycle: (c) => {
					c.git.enabled = !c.git.enabled;
				},
			},
			toggle("git.showBranch", "  Branch name", {
				hidden: (c) => !c.git.enabled,
			}),
			toggle("git.showDirtyIndicator", "  Dirty indicator (*)", {
				hidden: (c) => !c.git.enabled,
			}),
			toggle("git.showChanges", "  Line changes (+/-)", {
				hidden: (c) => !c.git.enabled,
			}),
			toggle("git.showStaged", "  Staged files", {
				hidden: (c) => !c.git.enabled,
			}),
			toggle("git.showUnstaged", "  Unstaged files", {
				hidden: (c) => !c.git.enabled,
			}),
		],
	},
	{
		id: "global",
		label: "GLOBAL",
		options: [
			cycle("separator", "Separator", SEPARATORS),
			cycle("pathDisplayMode", "Path display", PATH_DISPLAY_MODES),
			toggle("showSonnetModel", "Show Sonnet model"),
			toggle("oneLine", "Single line mode"),
		],
	},
];

// ─────────────────────────────────────────────────────────────
// CONFIG I/O
// ─────────────────────────────────────────────────────────────

function loadConfig(): StatuslineConfig {
	try {
		return JSON.parse(readFileSync(CONFIG_FILE_PATH, "utf-8"));
	} catch {
		return JSON.parse(JSON.stringify(defaultConfig));
	}
}

function saveConfig(config: StatuslineConfig): void {
	writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// ─────────────────────────────────────────────────────────────
// RENDERING
// ─────────────────────────────────────────────────────────────

function renderPreview(config: StatuslineConfig): string {
	return renderStatuslineRaw(MOCK_DATA, config);
}

function renderTabs(activeIdx: number): string {
	return tabs
		.map((t, i) =>
			i === activeIdx
				? colors.yellow(`[${t.label}]`)
				: colors.gray(` ${t.label} `),
		)
		.join("");
}

function renderOptions(
	config: StatuslineConfig,
	tab: Tab,
	selIdx: number,
): string {
	const visible = tab.options.filter((o) => !o.hidden || !o.hidden(config));
	return visible
		.map((opt, i) => {
			const sel = i === selIdx;
			const val = opt.getValue?.(config);
			const isPreset = "isPreset" in opt;

			let display: string;
			if (isPreset) {
				const desc =
					"description" in opt ? colors.gray(` - ${opt.description}`) : "";
				display = `${colors.cyan("◈")} ${opt.label}${desc}`;
			} else if (opt.type === "boolean") {
				display = `${val ? colors.green("●") : colors.gray("○")} ${opt.label}`;
			} else {
				display = `${opt.label}: ${colors.yellow(String(val))}`;
			}

			const cursor = sel ? colors.yellow("›") : " ";
			return `${cursor} ${sel ? colors.white(display) : colors.lightGray(display)}`;
		})
		.join("\n");
}

function render(
	config: StatuslineConfig,
	tabIdx: number,
	selIdx: number,
): string {
	const tab = tabs[tabIdx];
	const preview = renderPreview(config);
	const previewLines = preview.split("\n");

	return [
		colors.purple("━━━ PREVIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"),
		...previewLines,
		"",
		renderTabs(tabIdx),
		colors.gray("─".repeat(52)),
		renderOptions(config, tab, selIdx),
		"",
		colors.gray("←→ tabs  ↑↓ select  Enter toggle  s save  r reset  q quit"),
	].join("\n");
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────

async function main() {
	let config = loadConfig();
	let tabIdx = 0;
	let selIdx = 0;

	process.stdout.write("\x1b[?25l");
	process.stdin.setRawMode(true);
	process.stdin.resume();

	const draw = () => {
		const visible = tabs[tabIdx].options.filter(
			(o) => !o.hidden || !o.hidden(config),
		);
		if (selIdx >= visible.length) selIdx = Math.max(0, visible.length - 1);
		process.stdout.write("\x1b[2J\x1b[H" + render(config, tabIdx, selIdx));
	};

	draw();

	for await (const chunk of process.stdin) {
		const key = chunk.toString();

		if (key === "\u001b[D" || key === "h") {
			tabIdx = (tabIdx - 1 + tabs.length) % tabs.length;
			selIdx = 0;
		} else if (key === "\u001b[C" || key === "l") {
			tabIdx = (tabIdx + 1) % tabs.length;
			selIdx = 0;
		} else if (key === "\u001b[A" || key === "k") {
			if (selIdx > 0) selIdx--;
		} else if (key === "\u001b[B" || key === "j") {
			const visible = tabs[tabIdx].options.filter(
				(o) => !o.hidden || !o.hidden(config),
			);
			if (selIdx < visible.length - 1) selIdx++;
		} else if (key === "\r" || key === " ") {
			const visible = tabs[tabIdx].options.filter(
				(o) => !o.hidden || !o.hidden(config),
			);
			const opt = visible[selIdx];
			if ("isPreset" in opt && "presetIndex" in opt) {
				config = JSON.parse(
					JSON.stringify(PRESETS[opt.presetIndex as number].config),
				);
			} else if (opt.type === "cycle" && opt.cycle) {
				opt.cycle(config, 1);
			} else if (opt.toggle) {
				opt.toggle(config);
			}
		} else if (key.toLowerCase() === "r") {
			config = JSON.parse(JSON.stringify(defaultConfig));
		} else if (key.toLowerCase() === "s") {
			saveConfig(config);
			process.stdout.write("\x1b[2J\x1b[H");
			console.log(colors.green("✓ Config saved!"));
			await Bun.sleep(400);
		} else if (key.toLowerCase() === "q" || key === "\u0003") {
			saveConfig(config);
			process.stdin.setRawMode(false);
			process.stdout.write("\x1b[?25h");
			console.clear();
			console.log(colors.green("✓ Config saved!\n"));
			process.exit(0);
		}

		draw();
	}
}

main();
