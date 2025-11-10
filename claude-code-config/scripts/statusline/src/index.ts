#!/usr/bin/env bun

import { defaultConfig } from "../statusline.config";
import { getContextData } from "./lib/context";
import { colors, formatPath, formatSession } from "./lib/formatters";
import type { HookInput } from "./lib/types";

async function main() {
	try {
		const input: HookInput = await Bun.stdin.json();

		const dirPath = formatPath(
			input.workspace.current_dir,
			defaultConfig.pathDisplayMode,
		);

		const contextData = await getContextData({
			transcriptPath: input.transcript_path,
			maxContextTokens: defaultConfig.context.maxContextTokens,
		});

		const sessionInfo = formatSession(
			contextData.tokens,
			contextData.percentage,
			defaultConfig.session,
		);

		const sep = ` ${colors.GRAY}${defaultConfig.separator}${colors.LIGHT_GRAY} `;
		console.log(`${colors.LIGHT_GRAY}${dirPath}${sep}${sessionInfo}${colors.RESET}`);
		console.log("");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.log(
			`${colors.RED}Error:${colors.LIGHT_GRAY} ${errorMessage}${colors.RESET}`,
		);
	}
}

main();
