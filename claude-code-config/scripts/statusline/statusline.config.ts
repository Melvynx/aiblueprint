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

export interface StatuslineConfig {
	// Display everything on one line (separated by separator) or two lines
	oneLine: boolean;

	// Show model name even when using Sonnet (default model)
	showSonnetModel: boolean;

	// Path display mode:
	// - "full": Show complete path with ~ substitution
	// - "truncated": Show only last 2 segments
	// - "basename": Show only the directory name
	pathDisplayMode: "full" | "truncated" | "basename";

	// Git display configuration
	git: {
		// Show current branch name
		showBranch: boolean;
		// Show * indicator when branch has changes
		showDirtyIndicator: boolean;
		// Show added/deleted lines count
		showChanges: boolean;
		// Show staged files count (gray color)
		showStaged: boolean;
		// Show unstaged files count (yellow color)
		showUnstaged: boolean;
	};

	// Separator character between sections
	// Options: "|", "•", "·", "⋅", "●", "◆", "▪", "▸", "›", "→"
	separator: Separator;

	// Session display configuration
	session: {
		// Separator character between session info (cost, tokens, percentage)
		// Options: "|", "•", "·", "⋅", "●", "◆", "▪", "▸", "›", "→"
		// Use null for single space separator
		infoSeparator: Separator | null;
		// Show session cost in USD
		showCost: boolean;
		// Show token count
		showTokens: boolean;
		// Show max tokens (e.g., "192k/200k" vs "192k")
		showMaxTokens: boolean;
		// Show decimals in token count (e.g., "192.1k" vs "192k")
		showTokenDecimals: boolean;
		// Show context percentage
		showPercentage: boolean;
	};

	// Context display configuration
	context: {
		// Maximum context window size (Claude's hard limit)
		maxContextTokens: number;
		// Autocompact buffer size (reserved for safety)
		autocompactBufferTokens: number;
		// Use only usable context (includes autocompact buffer in display) vs just transcript
		useUsableContextOnly: boolean;
		// Approximate tokens overhead for system (prompts, tools, memory files)
		// Default ~20k includes: system prompts (~3k) + tools (~12k) + memory (~5k)
		// Set to 0 to show only transcript tokens
		overheadTokens: number;
	};

	// Limits display configuration
	limits: {
		// Show progress bar instead of just percentage
		showProgressBar: boolean;
		// Progress bar length (number of characters)
		progressBarLength: 5 | 10;
		// Progress bar color mode:
		// - "progressive": Changes color based on usage (gray < 50%, yellow < 70%, orange < 90%, red >= 90%)
		// - "green": Always green
		// - "yellow": Always yellow
		// - "red": Always red
		color: "progressive" | "green" | "yellow" | "red";
	};
}

export const defaultConfig: StatuslineConfig = {
	oneLine: true,
	showSonnetModel: false,
	pathDisplayMode: "truncated",
	git: {
		showBranch: true,
		showDirtyIndicator: true,
		showChanges: false,
		showStaged: true,
		showUnstaged: true,
	},
	separator: "•",
	session: {
		infoSeparator: null,
		showCost: false,
		showTokens: true,
		showMaxTokens: false,
		showTokenDecimals: false,
		showPercentage: true,
	},
	context: {
		maxContextTokens: 200000,
		autocompactBufferTokens: 45000,
		useUsableContextOnly: true,
		overheadTokens: 0,
	},
	limits: {
		showProgressBar: true,
		progressBarLength: 5,
		color: "progressive",
	},
};
