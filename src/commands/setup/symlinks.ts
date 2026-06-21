import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export type ToolType = "claude-code" | "codex" | "factoryai";

export interface ToolPaths {
  baseDir: string;
  agentsPath: string;
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
        agentsPath: path.join(baseDir, "agents"),
      };

    case "codex":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".codex");
      return {
        baseDir,
        agentsPath: path.join(baseDir, "agents"),
      };

    case "factoryai":
      baseDir = customFolder
        ? path.resolve(customFolder)
        : path.join(os.homedir(), ".factory");
      return {
        baseDir,
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

    const isWindows = os.platform() === "win32";
    if (isWindows) {
      await fs.symlink(sourcePath, targetPath, "junction");
    } else {
      await fs.symlink(sourcePath, targetPath);
    }
    return true;
  } catch (error) {
    console.error(
      chalk.red(options.errorPrefix || "Error creating symlink:"),
      error,
    );
    throw error;
  }
}
