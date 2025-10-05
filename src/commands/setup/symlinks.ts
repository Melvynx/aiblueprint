import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export type ToolType = "claude-code" | "codex" | "opencode" | "factoryai";
export type ContentType = "commands" | "agents";

export interface ToolPaths {
  baseDir: string;
  commandsPath?: string;
  agentsPath?: string;
}

export async function getToolPaths(
  tool: ToolType,
  customFolder?: string,
): Promise<ToolPaths> {
  let baseDir: string;

  switch (tool) {
    case "claude-code":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".claude");
      return {
        baseDir,
        commandsPath: path.join(baseDir, "commands"),
        agentsPath: path.join(baseDir, "agents"),
      };

    case "codex":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".codex");
      return {
        baseDir,
        commandsPath: path.join(baseDir, "prompts"),
      };

    case "opencode":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".config", "opencode");
      return {
        baseDir,
        commandsPath: path.join(baseDir, "command"),
      };

    case "factoryai":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".factory");
      return {
        baseDir,
        commandsPath: path.join(baseDir, "commands"),
        agentsPath: path.join(baseDir, "droids"),
      };

    default:
      throw new Error(`Unknown tool type: ${tool}`);
  }
}

export async function createSymlink(
  sourcePath: string,
  targetPath: string,
  options: { skipMessage?: string; errorPrefix?: string } = {},
): Promise<boolean> {
  try {
    const sourceExists = await fs.pathExists(sourcePath);
    if (!sourceExists) {
      console.log(
        chalk.yellow(
          `  Source path ${sourcePath} does not exist. Skipping symlink creation...`,
        ),
      );
      return false;
    }

    const targetDir = path.dirname(targetPath);
    await fs.ensureDir(targetDir);

    const targetExists = await fs.pathExists(targetPath);
    if (targetExists) {
      const stat = await fs.lstat(targetPath);
      if (stat.isSymbolicLink()) {
        await fs.remove(targetPath);
      } else {
        console.log(
          chalk.yellow(
            options.skipMessage ||
              `  ${targetPath} already exists and is not a symlink. Skipping...`,
          ),
        );
        return false;
      }
    }

    await fs.symlink(sourcePath, targetPath);
    return true;
  } catch (error) {
    console.error(
      chalk.red(options.errorPrefix || "Error creating symlink:"),
      error,
    );
    throw error;
  }
}

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

    await createSymlink(commandsPath, promptsPath, {
      skipMessage:
        "  ~/.codex/prompts already exists and is not a symlink. Skipping...",
      errorPrefix: "Error setting up Codex symlink:",
    });
  } catch (error) {
    console.error(chalk.red("Error setting up Codex symlink:"), error);
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

    await createSymlink(commandsPath, commandPath, {
      skipMessage:
        "  ~/.config/opencode/command already exists and is not a symlink. Skipping...",
      errorPrefix: "Error setting up OpenCode symlink:",
    });
  } catch (error) {
    console.error(chalk.red("Error setting up OpenCode symlink:"), error);
  }
}
