import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StatuslineConfig } from "./config-types";

const CONFIG_DIR = join(import.meta.dir, "..", "..");
const DEFAULTS_PATH = join(CONFIG_DIR, "defaults.json");
const CONFIG_PATH = join(CONFIG_DIR, "statusline.config.json");

export const defaultConfig: StatuslineConfig = JSON.parse(
	readFileSync(DEFAULTS_PATH, "utf-8"),
);

function cloneDefaultConfig(): StatuslineConfig {
	return JSON.parse(JSON.stringify(defaultConfig));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeConfigDefaults<T>(defaults: T, overrides: unknown): T {
	if (!isRecord(defaults) || !isRecord(overrides)) {
		return overrides === undefined ? defaults : (overrides as T);
	}

	const merged: Record<string, unknown> = { ...defaults };
	for (const [key, value] of Object.entries(overrides)) {
		merged[key] = mergeConfigDefaults(
			(defaults as Record<string, unknown>)[key],
			value,
		);
	}
	return merged as T;
}

export function loadConfig(): StatuslineConfig {
	try {
		return mergeConfigDefaults(
			defaultConfig,
			JSON.parse(readFileSync(CONFIG_PATH, "utf-8")),
		);
	} catch {
		return cloneDefaultConfig();
	}
}

export type { StatuslineConfig } from "./config-types";
