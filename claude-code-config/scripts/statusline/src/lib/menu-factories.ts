import type { StatuslineConfig } from "./config-types";

export interface MenuOption {
	path: string;
	label: string;
	type: "boolean" | "cycle" | "section";
	getValue?: (config: StatuslineConfig) => boolean | string;
	toggle?: (config: StatuslineConfig) => void;
	cycle?: (config: StatuslineConfig, direction: 1 | -1) => void;
	choices?: string[];
	indent?: number;
	hidden?: (config: StatuslineConfig) => boolean;
}

type ConfigPath = string;
type GetValue<T> = (config: StatuslineConfig) => T;
type SetValue<T> = (config: StatuslineConfig, value: T) => void;

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

export function section(
	path: string,
	label: string,
	options?: {
		enabledPath?: string;
	},
): MenuOption {
	if (options?.enabledPath) {
		return {
			path,
			label,
			type: "section",
			getValue: (c) => getNestedValue(c, options.enabledPath!) as boolean,
			toggle: (c) => {
				const current = getNestedValue(c, options.enabledPath!) as boolean;
				setNestedValue(c, options.enabledPath!, !current);
			},
		};
	}
	return { path, label, type: "section" };
}

export function toggle(
	path: string,
	label: string,
	options?: {
		indent?: number;
		hidden?: (config: StatuslineConfig) => boolean;
	},
): MenuOption {
	return {
		path,
		label,
		type: "boolean",
		getValue: (c) => getNestedValue(c, path) as boolean,
		toggle: (c) => {
			const current = getNestedValue(c, path) as boolean;
			setNestedValue(c, path, !current);
		},
		indent: options?.indent ?? 1,
		hidden: options?.hidden,
	};
}

export function cycle<T extends string | number>(
	path: string,
	label: string,
	choices: readonly T[],
	options?: {
		indent?: number;
		hidden?: (config: StatuslineConfig) => boolean;
		displayValue?: (value: T) => string;
	},
): MenuOption {
	const stringChoices = choices.map((c) =>
		options?.displayValue ? options.displayValue(c) : String(c),
	);

	return {
		path,
		label,
		type: "cycle",
		choices: stringChoices,
		getValue: (c) => {
			const value = getNestedValue(c, path) as T;
			return options?.displayValue
				? options.displayValue(value)
				: String(value);
		},
		cycle: (c, dir) => {
			const current = getNestedValue(c, path) as T;
			const currentIndex = choices.indexOf(current);
			const next = (currentIndex + dir + choices.length) % choices.length;
			setNestedValue(c, path, choices[next]);
		},
		indent: options?.indent ?? 1,
		hidden: options?.hidden,
	};
}

export function progressBarOptions(
	basePath: string,
	parentHidden: (config: StatuslineConfig) => boolean,
): MenuOption[] {
	const barPath = `${basePath}.progressBar`;

	return [
		toggle(`${barPath}.enabled`, "Progress bar", {
			indent: 2,
			hidden: parentHidden,
		}),
		cycle(`${barPath}.style`, "Style", PROGRESS_BAR_STYLES, {
			indent: 3,
			hidden: (c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${barPath}.enabled`) as boolean),
		}),
		cycle(`${barPath}.length`, "Length", PROGRESS_BAR_LENGTHS, {
			indent: 3,
			hidden: (c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${barPath}.enabled`) as boolean),
		}),
		cycle(`${barPath}.color`, "Color", PROGRESS_BAR_COLORS, {
			indent: 3,
			hidden: (c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${barPath}.enabled`) as boolean),
		}),
		cycle(`${barPath}.background`, "Background", PROGRESS_BAR_BACKGROUNDS, {
			indent: 3,
			hidden: (c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${barPath}.enabled`) as boolean),
		}),
	];
}

export function percentageOptions(
	basePath: string,
	parentHidden: (config: StatuslineConfig) => boolean,
): MenuOption[] {
	const pctPath = basePath;

	return [
		toggle(`${pctPath}.enabled`, "Percentage display", {
			indent: 1,
			hidden: parentHidden,
		}),
		toggle(`${pctPath}.showValue`, "Show percentage value", {
			indent: 2,
			hidden: (c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${pctPath}.enabled`) as boolean),
		}),
		...progressBarOptions(
			pctPath,
			(c) =>
				parentHidden(c) ||
				!(getNestedValue(c, `${pctPath}.enabled`) as boolean),
		),
	];
}

export const SEPARATORS = [
	"|",
	"•",
	"·",
	"⋅",
	"●",
	"◆",
	"▪",
	"▸",
	"›",
	"→",
] as const;
export const PATH_DISPLAY_MODES = ["truncated", "basename", "full"] as const;
export const PROGRESS_BAR_STYLES = ["filled", "rectangle", "braille"] as const;
export const PROGRESS_BAR_LENGTHS = [5, 10, 15] as const;
export const PROGRESS_BAR_COLORS = [
	"progressive",
	"green",
	"yellow",
	"red",
	"peach",
	"black",
	"white",
] as const;
export const PROGRESS_BAR_BACKGROUNDS = [
	"none",
	"dark",
	"gray",
	"light",
	"blue",
	"purple",
	"cyan",
	"peach",
] as const;
