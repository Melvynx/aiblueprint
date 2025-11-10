import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { downloadDirectoryFromGitHub } from "../commands/setup/utils.js";

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

  // Install commands
  console.log(chalk.gray("  • Commands..."));
  await downloadDirectoryFromGitHub(
    "commands",
    path.join(claudeDir, "commands"),
  );

  // Install agents
  console.log(chalk.gray("  • Agents..."));
  await downloadDirectoryFromGitHub(
    "agents",
    path.join(claudeDir, "agents"),
  );

  // Install basic statusline only if not skipped (for pro setup)
  if (!skipStatusline) {
    console.log(chalk.gray("  • Statusline (basic)..."));
    await downloadDirectoryFromGitHub(
      "scripts/statusline",
      path.join(claudeDir, "scripts", "statusline"),
    );
  }

  console.log(chalk.green("✓ Free configurations installed"));

  return claudeDir;
}
