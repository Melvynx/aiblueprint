export interface StatuslineConfig {
	oneLine: boolean;
	pathDisplayMode: "full";
	separator: "•";
	session: {
		showTokens: boolean;
		showPercentage: boolean;
	};
	context: {
		maxContextTokens: 200000;
	};
}

export const defaultConfig: StatuslineConfig = {
	oneLine: true,
	pathDisplayMode: "full",
	separator: "•",
	session: {
		showTokens: true,
		showPercentage: true,
	},
	context: {
		maxContextTokens: 200000,
	},
};
