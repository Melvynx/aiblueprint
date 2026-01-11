import { defaultConfig, type StatuslineConfig } from "./config";

export interface Preset {
	name: string;
	description: string;
	config: StatuslineConfig;
}

const minimalConfig: StatuslineConfig = {
	...defaultConfig,
	oneLine: true,
	showSonnetModel: false,
	pathDisplayMode: "basename",
	git: {
		enabled: true,
		showBranch: true,
		showDirtyIndicator: true,
		showChanges: false,
		showStaged: false,
		showUnstaged: false,
	},
	session: {
		infoSeparator: null,
		cost: { enabled: true, format: "decimal1" },
		duration: { enabled: false },
		tokens: { enabled: false, showMax: false, showDecimals: false },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: false,
				length: 10,
				style: "braille",
				color: "progressive",
				background: "none",
			},
		},
	},
	limits: {
		enabled: true,
		showTimeLeft: false,
		showPacingDelta: false,
		cost: { enabled: false, format: "decimal1" },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: false,
				length: 10,
				style: "braille",
				color: "progressive",
				background: "none",
			},
		},
	},
	weeklyUsage: {
		enabled: false,
		showTimeLeft: false,
		showPacingDelta: false,
		cost: { enabled: false, format: "decimal1" },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: false,
				length: 10,
				style: "braille",
				color: "progressive",
				background: "none",
			},
		},
	},
	dailySpend: {
		cost: { enabled: false, format: "decimal1" },
	},
	context: {
		...defaultConfig.context,
	},
};

const fullConfig: StatuslineConfig = {
	...defaultConfig,
	oneLine: false,
	showSonnetModel: true,
	pathDisplayMode: "truncated",
	git: {
		enabled: true,
		showBranch: true,
		showDirtyIndicator: true,
		showChanges: true,
		showStaged: true,
		showUnstaged: true,
	},
	session: {
		infoSeparator: null,
		cost: { enabled: true, format: "decimal2" },
		duration: { enabled: true },
		tokens: { enabled: true, showMax: true, showDecimals: true },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: true,
				length: 15,
				style: "braille",
				color: "progressive",
				background: "dark",
			},
		},
	},
	limits: {
		enabled: true,
		showTimeLeft: true,
		showPacingDelta: true,
		cost: { enabled: true, format: "decimal1" },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: true,
				length: 15,
				style: "braille",
				color: "progressive",
				background: "dark",
			},
		},
	},
	weeklyUsage: {
		enabled: true,
		showTimeLeft: true,
		showPacingDelta: true,
		cost: { enabled: true, format: "decimal1" },
		percentage: {
			enabled: true,
			showValue: true,
			progressBar: {
				enabled: true,
				length: 15,
				style: "braille",
				color: "progressive",
				background: "dark",
			},
		},
	},
	dailySpend: {
		cost: { enabled: true, format: "decimal1" },
	},
	context: {
		...defaultConfig.context,
	},
};

export const PRESETS: Preset[] = [
	{
		name: "Minimal",
		description: "Essential info only: cost, percentage, branch",
		config: minimalConfig,
	},
	{
		name: "Balanced",
		description: "Default settings with progress bars",
		config: defaultConfig,
	},
	{
		name: "Full",
		description: "Everything enabled with all details",
		config: fullConfig,
	},
];

export function applyPreset(presetName: string): StatuslineConfig | null {
	const preset = PRESETS.find(
		(p) => p.name.toLowerCase() === presetName.toLowerCase(),
	);
	if (!preset) return null;
	return JSON.parse(JSON.stringify(preset.config));
}
