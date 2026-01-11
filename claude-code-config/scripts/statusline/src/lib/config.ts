import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StatuslineConfig } from "./config-types";

const CONFIG_DIR = join(import.meta.dir, "..", "..");
const DEFAULTS_PATH = join(CONFIG_DIR, "defaults.json");
const CONFIG_PATH = join(CONFIG_DIR, "statusline.config.json");

export const defaultConfig: StatuslineConfig = JSON.parse(
	readFileSync(DEFAULTS_PATH, "utf-8"),
);

export function loadConfig(): StatuslineConfig {
	try {
		return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
	} catch {
		return JSON.parse(JSON.stringify(defaultConfig));
	}
}

export type { StatuslineConfig } from "./config-types";
