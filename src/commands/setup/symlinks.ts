import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export async function setupCodexSymlink(
  claudeDir: string,
  customCodexFolder?: string,
  customClaudeCodeFolder?: string,
) {
  try {
    let codexDir: string;
    if (customCodexFolder) {
      codexDir = path.resolve(customCodexFolder);
    } else if (customClaudeCodeFolder) {
      const parentDir = path.dirname(claudeDir);
      codexDir = path.join(parentDir, "codex");
    } else {
      codexDir = path.join(os.homedir(), ".codex");
    }
    const promptsPath = path.join(codexDir, "prompts");
    const commandsPath = path.join(claudeDir, "commands");

    await fs.ensureDir(codexDir);

    const promptsExists = await fs.pathExists(promptsPath);
    if (promptsExists) {
      const stat = await fs.lstat(promptsPath);
      if (stat.isSymbolicLink()) {
        await fs.remove(promptsPath);
      } else {
        console.log(
          chalk.yellow(
            "  ~/.codex/prompts already exists and is not a symlink. Skipping...",
          ),
        );
        return;
      }
    }

    await fs.symlink(commandsPath, promptsPath);
  } catch (error) {
    console.error(chalk.red("Error setting up Codex symlink:"), error);
    throw error;
  }
}

export async function setupOpenCodeSymlink(
  claudeDir: string,
  customOpenCodeFolder?: string,
  customClaudeCodeFolder?: string,
) {
  try {
    let openCodeDir: string;
    if (customOpenCodeFolder) {
      openCodeDir = path.resolve(customOpenCodeFolder);
    } else if (customClaudeCodeFolder) {
      const parentDir = path.dirname(claudeDir);
      openCodeDir = path.join(parentDir, ".opencode");
    } else {
      openCodeDir = path.join(os.homedir(), ".config", "opencode");
    }
    const commandPath = path.join(openCodeDir, "command");
    const commandsPath = path.join(claudeDir, "commands");

    await fs.ensureDir(openCodeDir);

    const commandExists = await fs.pathExists(commandPath);
    if (commandExists) {
      const stat = await fs.lstat(commandPath);
      if (stat.isSymbolicLink()) {
        await fs.remove(commandPath);
      } else {
        console.log(
          chalk.yellow(
            "  ~/.config/opencode/command already exists and is not a symlink. Skipping...",
          ),
        );
        return;
      }
    }

    await fs.symlink(commandsPath, commandPath);
  } catch (error) {
    console.error(chalk.red("Error setting up OpenCode symlink:"), error);
    throw error;
  }
}
