import chalk from "chalk";
import { getVersion } from "../lib/version.js";
import {
  renderCodexAgentsFromMarkdown,
  type CodexAgentsRenderOptions,
} from "../lib/codex-agents-renderer.js";

export async function codexAgentsCommand(options: CodexAgentsRenderOptions = {}) {
  try {
    console.log(chalk.blue.bold(`\nAIBlueprint Codex agents ${chalk.gray(`v${getVersion()}`)}\n`));
    console.log(chalk.gray("Rendering shared Markdown agents into Codex TOML custom agents"));

    const result = await renderCodexAgentsFromMarkdown(options);

    console.log(chalk.green("\nCodex agents rendered"));
    console.log(chalk.gray(`  Source: ${result.sourceDir}`));
    console.log(chalk.gray(`  Target: ${result.targetDir}`));
    console.log(chalk.gray(`  Rendered: ${result.rendered.length}`));
    console.log(chalk.gray(`  Skipped: ${result.skipped.length}`));

    if (result.skipped.length > 0) {
      console.log(chalk.yellow("\nSkipped agents:"));
      for (const skipped of result.skipped) {
        console.log(chalk.yellow(`  ${skipped.source}: ${skipped.reason}`));
      }
    }
  } catch (error) {
    console.error(chalk.red("\nCodex agents render failed:"), error);
    process.exit(1);
  }
}
