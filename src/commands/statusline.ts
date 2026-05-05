import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { homedir } from "os";
import { checkAndInstallDependencies, installStatuslineDependencies } from "./setup/dependencies.js";
import { cloneRepository, cleanupRepository, resolveConfigDir } from "./setup/utils.js";
import { getVersion } from "../lib/version.js";

export interface StatuslineOptions {
  folder?: string;
}

export async function statuslineCommand(options: StatuslineOptions) {
  const claudeDir = options.folder
    ? path.resolve(options.folder)
    : path.join(homedir(), ".claude");

  console.log(chalk.blue(`🚀 Setting up AIBlueprint Statusline ${chalk.gray(`v${getVersion()}`)}...`));
  console.log(chalk.gray(`  Target: ${claudeDir}\n`));

  await fs.ensureDir(claudeDir);

  console.log(chalk.cyan("📦 Checking dependencies..."));
  await checkAndInstallDependencies();

  console.log(chalk.cyan("\n📥 Cloning configuration repository..."));
  const repoPath = await cloneRepository();

  if (!repoPath) {
    console.log(chalk.red("  Failed to clone repository. Please check your internet connection."));
    return;
  }

  const sourceDir = await resolveConfigDir(repoPath);

  if (!sourceDir) {
    await cleanupRepository(repoPath);
    console.log(chalk.red("  Configuration directory not found in cloned repository"));
    return;
  }

  try {
    const scriptsDir = path.join(claudeDir, "scripts");
    await fs.ensureDir(scriptsDir);

    await fs.copy(
      path.join(sourceDir, "scripts/statusline"),
      path.join(scriptsDir, "statusline"),
      { overwrite: true },
    );

    console.log(chalk.cyan("\n📦 Installing statusline dependencies..."));
    await installStatuslineDependencies(claudeDir);

    console.log(chalk.cyan("\n⚙️  Configuring settings.json..."));
    const settingsPath = path.join(claudeDir, "settings.json");
    let settings: any = {};

    try {
      const existingSettings = await fs.readFile(settingsPath, "utf-8");
      settings = JSON.parse(existingSettings);
    } catch {
      // Settings file doesn't exist or is invalid
    }

    settings.statusLine = {
      type: "command",
      command: `bun ${path.join(claudeDir, "scripts/statusline/src/index.ts")}`,
      padding: 0,
    };

    await fs.writeJson(settingsPath, settings, { spaces: 2 });

    console.log(chalk.green("\n✅ Statusline setup complete!"));
    console.log(chalk.gray("\nYour Claude Code statusline is now configured."));
    console.log(chalk.gray("Restart Claude Code to see the changes.\n"));
  } finally {
    await cleanupRepository(repoPath);
  }
}
