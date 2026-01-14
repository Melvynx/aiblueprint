import { Command } from "commander";
import path from "path";
import { homedir } from "os";
import {
  readScriptsPackageJson,
  parseScriptCommands,
  groupScriptsByPrefix,
} from "../lib/script-parser.js";
import { executeScript, showAvailableActions } from "./script-runner.js";

function getClaudeDir(parentOptions: any): string {
  return parentOptions.claudeCodeFolder || parentOptions.folder
    ? path.resolve(parentOptions.claudeCodeFolder || parentOptions.folder)
    : path.join(homedir(), ".claude");
}

export async function registerDynamicScriptCommands(
  claudeCodeCmd: Command,
  claudeDir: string,
): Promise<void> {
  const scripts = await readScriptsPackageJson(claudeDir);

  if (!scripts) {
    return;
  }

  const commands = parseScriptCommands(scripts);

  if (commands.length === 0) {
    return;
  }

  const scriptGroups = groupScriptsByPrefix(commands);

  for (const [prefix, actions] of Object.entries(scriptGroups)) {
    const command = claudeCodeCmd
      .command(`${prefix} [action]`)
      .description(`Run ${prefix} scripts from ~/.claude/scripts`)
      .option("-l, --list", "List available actions")
      .action(async (action, options) => {
        const parentOptions = command.parent?.opts() || {};
        const resolvedClaudeDir = getClaudeDir(parentOptions);

        if (options.list || !action) {
          showAvailableActions(prefix, actions);
          return;
        }

        const exitCode = await executeScript(
          `${prefix}:${action}`,
          resolvedClaudeDir,
        );
        process.exit(exitCode);
      });
  }
}
