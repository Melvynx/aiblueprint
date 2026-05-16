import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class SimpleSpinner {
  private message: string = "";

  start(message: string) {
    this.message = message;
    console.log(chalk.gray(`⏳ ${message}...`));
  }

  stop(message: string) {
    console.log(chalk.green(`✓ ${message}`));
  }
}

const GITHUB_REPO = "https://github.com/Melvynx/aiblueprint.git";

export async function cloneRepository(): Promise<string | null> {
  const tmpDir = path.join(os.tmpdir(), `aiblueprint-${Date.now()}`);

  try {
    await fs.ensureDir(tmpDir);
    await execAsync(`git clone --depth 1 --quiet ${GITHUB_REPO} "${tmpDir}"`);
    return tmpDir;
  } catch (error) {
    console.error(
      chalk.yellow(
        `  Warning: Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    await fs.remove(tmpDir).catch(() => {});
    return null;
  }
}

export async function cleanupRepository(repoPath: string): Promise<void> {
  try {
    await fs.remove(repoPath);
  } catch (error) {
    console.error(
      chalk.yellow(
        `  Warning: Failed to cleanup temporary directory: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

/**
 * Resolves the config folder inside a repo. "agents-config" is the canonical
 * folder; legacy folder names are treated as compatibility links.
 */
export async function resolveConfigDir(repoPath: string): Promise<string | null> {
  const candidates = CONFIG_FOLDER_CANDIDATES;
  for (const name of candidates) {
    const candidate = path.join(repoPath, name);
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

export const CONFIG_FOLDER_CANDIDATES = ["agents-config", "ai-coding", "claude-code-config", "ai-config"] as const;
