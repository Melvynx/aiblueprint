export type Separator =
	| "|"
	| "•"
	| "·"
	| "⋅"
	| "●"
	| "◆"
	| "▪"
	| "▸"
	| "›"
	| "→";

export type CostFormat = "integer" | "decimal1" | "decimal2";
export type ProgressBarStyle = "filled" | "rectangle" | "braille";
export type ProgressBarColor =
	| "progressive"
	| "green"
	| "yellow"
	| "red"
	| "peach"
	| "black"
	| "white"
	| "purple"
	| "blue"
	| "cyan";
export type ProgressBarBackground =
	| "none"
	| "dark"
	| "gray"
	| "light"
	| "blue"
	| "purple"
	| "cyan"
	| "peach";

export interface CostConfig {
	enabled: boolean;
	format: CostFormat;
}

export interface ProgressBarConfig {
	enabled: boolean;
	length: 5 | 10 | 15;
	style: ProgressBarStyle;
	color: ProgressBarColor;
	background: ProgressBarBackground;
}

export interface PercentageConfig {
	enabled: boolean;
	showValue: boolean;
	progressBar: ProgressBarConfig;
}

export interface StatuslineConfig {
	features?: {
		usageLimits?: boolean;
		spendTracking?: boolean;
	};
	oneLine: boolean;
	showSonnetModel: boolean;
	pathDisplayMode: "full" | "truncated" | "basename";
	git: {
		enabled: boolean;
		showBranch: boolean;
		showDirtyIndicator: boolean;
		showChanges: boolean;
		showStaged: boolean;
		showUnstaged: boolean;
	};
	separator: Separator;
	session: {
		infoSeparator: Separator | null;
		cost: CostConfig;
		duration: { enabled: boolean };
		tokens: {
			enabled: boolean;
			showMax: boolean;
			showDecimals: boolean;
		};
		percentage: PercentageConfig;
	};
	context: {
		usePayloadContextWindow: boolean;
		maxContextTokens: number;
		autocompactBufferTokens: number;
		useUsableContextOnly: boolean;
		overheadTokens: number;
	};
	limits: {
		enabled: boolean;
		showTimeLeft: boolean;
		showPacingDelta: boolean;
		cost: CostConfig;
		percentage: PercentageConfig;
	};
	weeklyUsage: {
		enabled: boolean | "90%";
		showTimeLeft: boolean;
		showPacingDelta: boolean;
		cost: CostConfig;
		percentage: PercentageConfig;
	};
	dailySpend: {
		cost: CostConfig;
	};
	thinking: {
		showDisabledWarning: boolean;
	};
}
