import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { cloneRepository, cleanupRepository, resolveConfigDir } from "../commands/setup/utils.js";

export interface BasicSetupOptions {
  claudeCodeFolder?: string;
}

/**
 * Install basic free configurations (commands, agents, statusline)
 * This is used by both regular setup and pro setup
 */
export async function installBasicConfigs(
  options: BasicSetupOptions = {},
  skipStatusline = false,
): Promise<string> {
  const claudeDir = options.claudeCodeFolder || path.join(os.homedir(), ".claude");
  await fs.ensureDir(claudeDir);

  console.log(chalk.gray("📦 Installing free configurations..."));

  const repoPath = await cloneRepository();

  if (!repoPath) {
    throw new Error(
      "Failed to clone repository. Please check your internet connection and try again.",
    );
  }

  const sourceDir = await resolveConfigDir(repoPath);

  if (!sourceDir) {
    await cleanupRepository(repoPath);
    throw new Error(
      "Configuration directory not found in cloned repository",
    );
  }

  try {
    // Install commands
    const commandsSourcePath = path.join(sourceDir, "commands");
    if (await fs.pathExists(commandsSourcePath)) {
      console.log(chalk.gray("  • Commands..."));
      await fs.copy(
        commandsSourcePath,
        path.join(claudeDir, "commands"),
        { overwrite: true },
      );
    }

    // Install agents
    console.log(chalk.gray("  • Agents..."));
    await fs.copy(
      path.join(sourceDir, "agents"),
      path.join(claudeDir, "agents"),
      { overwrite: true },
    );

    // Install basic statusline only if not skipped (for pro setup)
    if (!skipStatusline) {
      console.log(chalk.gray("  • Statusline (basic)..."));
      await fs.copy(
        path.join(sourceDir, "scripts/statusline"),
        path.join(claudeDir, "scripts", "statusline"),
        { overwrite: true },
      );
    }

    console.log(chalk.green("✓ Free configurations installed"));

    return claudeDir;
  } finally {
    await cleanupRepository(repoPath);
  }
}
