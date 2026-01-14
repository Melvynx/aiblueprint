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
