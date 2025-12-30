export interface StatuslineConfig {
	oneLine: boolean;
	pathDisplayMode: "full";
	separator: "•";
	git: {
		show: boolean;
	};
	cost: {
		show: boolean;
	};
	session: {
		showTokens: boolean;
		showPercentage: boolean;
	};
	context: {
		maxContextTokens: number;
	};
	usage: {
		show: boolean;
	};
	thresholds: {
		warning: number;
		critical: number;
	};
}

export const defaultConfig: StatuslineConfig = {
	oneLine: true,
	pathDisplayMode: "full",
	separator: "•",
	git: {
		show: true,
	},
	cost: {
		show: false,
	},
	session: {
		showTokens: true,
		showPercentage: true,
	},
	context: {
		maxContextTokens: 200000,
	},
	usage: {
		show: true,
	},
	thresholds: {
		warning: 60, // Yellow warning at 60%
		critical: 80, // Red critical at 80%
	},
};
