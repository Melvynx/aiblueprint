#!/usr/bin/env bun

import { defaultConfig } from "../statusline.config";
import { getContextData } from "./lib/context";
import { colors, formatPath, formatSession, formatGit, formatCost, formatUsageLimits } from "./lib/formatters";
import { getGitInfo } from "./lib/git";
import { getUsageLimits } from "./lib/usage-limits";
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

		const gitInfo = defaultConfig.git.show
			? getGitInfo(input.workspace.current_dir)
			: null;

		const usageLimits = defaultConfig.usage.show
			? await getUsageLimits()
			: null;

		const gitDisplay = formatGit(gitInfo);
		const costDisplay = defaultConfig.cost.show
			? formatCost(input.cost.total_cost_usd)
			: "";
		const usageDisplay = formatUsageLimits(usageLimits);

		const sessionInfo = formatSession(
			contextData.tokens,
			contextData.percentage,
			defaultConfig.session,
		);

		const sep = ` ${colors.GRAY}${defaultConfig.separator}${colors.LIGHT_GRAY} `;
		
		const modelDisplay = `󰚩 ${colors.LAVENDER}${input.model.display_name}${colors.RESET}`;
		
		const parts = [
			`${colors.LIGHT_GRAY}${dirPath}${colors.RESET}`,
		];

		if (gitDisplay) parts.push(gitDisplay);
		if (modelDisplay) parts.push(modelDisplay);
		if (sessionInfo) parts.push(sessionInfo);
		if (usageDisplay) parts.push(usageDisplay);
		if (costDisplay) parts.push(costDisplay);

		console.log(parts.join(sep));
		console.log("");
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.log(
			`${colors.RED}Error:${colors.LIGHT_GRAY} ${errorMessage}${colors.RESET}`,
		);
	}
}

main();
