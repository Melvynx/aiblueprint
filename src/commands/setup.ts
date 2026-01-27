import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { checkAndInstallDependencies, installStatuslineDependencies } from "./setup/dependencies.js";
import { updateSettings, hasExistingStatusLine, type SetupOptions } from "./setup/settings.js";
import {
  SimpleSpinner,
  cloneRepository,
  cleanupRepository,
} from "./setup/utils.js";
import { getVersion } from "../lib/version.js";
import { createBackup } from "../lib/backup-utils.js";

export interface SetupCommandParams {
  claudeCodeFolder?: string;
  skipInteractive?: boolean;
}

export async function setupCommand(params: SetupCommandParams = {}) {
  const {
    claudeCodeFolder: customClaudeCodeFolder,
    skipInteractive,
  } = params;

  let repoPath: string | null = null;

  try {
    console.log(chalk.blue.bold(`\n🚀 AIBlueprint Claude Code Setup ${chalk.gray(`v${getVersion()}`)}\n`));
    console.log(chalk.bgBlue(" Setting up your Claude Code environment "));

    let features: string[];

    if (skipInteractive) {
      features = [
        "shellShortcuts",
        "commandValidation",
        "customStatusline",
        "aiblueprintAgents",
        "notificationSounds",
      ];
      console.log(chalk.green("✓ Installing all features (--skip mode)"));
    } else {
      const answers = await inquirer.prompt([
        {
          type: "checkbox",
          name: "features",
          message: "Which features would you like to install?",
          choices: [
            {
              value: "shellShortcuts",
              name: "Shell shortcuts (cc, ccc aliases) - Quick access to Claude Code",
              checked: true,
            },
            {
              value: "commandValidation",
              name: "Command validation - Security hook for bash commands",
              checked: true,
            },
            {
              value: "customStatusline",
              name: "Custom statusline - Shows git, costs, tokens info",
              checked: true,
            },
            {
              value: "aiblueprintAgents",
              name: "AIBlueprint agents - Specialized AI agents",
              checked: true,
            },
            {
              value: "notificationSounds",
              name: "Notification sounds - Audio alerts for events",
              checked: true,
            },
          ],
        },
      ]);

      features = answers.features;

      if (!features || features.length === 0) {
        console.log(chalk.yellow("Setup cancelled - no features selected"));
        process.exit(0);
      }
    }

    const options: SetupOptions = {
      shellShortcuts: features.includes("shellShortcuts"),
      commandValidation: features.includes("commandValidation"),
      customStatusline: features.includes("customStatusline"),
      aiblueprintAgents: features.includes("aiblueprintAgents"),
      aiblueprintSkills: false,
      notificationSounds: features.includes("notificationSounds"),
      skipInteractive,
    };

    const s = new SimpleSpinner();

    const claudeDir = customClaudeCodeFolder
      ? path.resolve(customClaudeCodeFolder)
      : path.join(os.homedir(), ".claude");

    console.log(chalk.gray(`Installing to: ${claudeDir}`));

    await fs.ensureDir(claudeDir);

    s.start("Creating backup of existing configuration");
    const backupPath = await createBackup(claudeDir);
    if (backupPath) {
      s.stop(`Backup created: ${chalk.gray(backupPath)}`);
    } else {
      s.stop("No existing config to backup");
    }

    // Clone repository to temporary directory
    s.start("Cloning configuration repository");
    repoPath = await cloneRepository();

    if (!repoPath) {
      throw new Error(
        "Failed to clone repository. Please check your internet connection and try again.",
      );
    }

    const sourceDir = path.join(repoPath, "claude-code-config");

    if (!await fs.pathExists(sourceDir)) {
      await cleanupRepository(repoPath);
      throw new Error(
        "Configuration directory not found in cloned repository",
      );
    }

    s.stop("Repository cloned successfully");

    if (options.shellShortcuts) {
      s.start("Setting up shell shortcuts");
      await setupShellShortcuts();
      s.stop("Shell shortcuts configured");
    }

    if (
      options.commandValidation ||
      options.customStatusline ||
      options.notificationSounds
    ) {
      s.start("Setting up scripts");
      await fs.copy(
        path.join(sourceDir, "scripts"),
        path.join(claudeDir, "scripts"),
        { overwrite: true },
      );
      if (options.customStatusline) {
        await fs.ensureDir(path.join(claudeDir, "scripts/statusline/data"));
      }
      s.stop("Scripts installed");
    }


    if (options.aiblueprintAgents) {
      s.start("Setting up AIBlueprint agents");
      await fs.copy(
        path.join(sourceDir, "agents"),
        path.join(claudeDir, "agents"),
        { overwrite: true },
      );
      s.stop("Agents installed");
    }

    if (options.aiblueprintSkills) {
      s.start("Setting up AIBlueprint Skills");
      const skillsSourcePath = path.join(sourceDir, "skills");
      if (await fs.pathExists(skillsSourcePath)) {
        await fs.copy(
          skillsSourcePath,
          path.join(claudeDir, "skills"),
          { overwrite: true },
        );
        s.stop("Skills installed");
      } else {
        s.stop("Skills not available in repository");
      }
    }

    if (options.notificationSounds) {
      s.start("Setting up notification sounds");
      await fs.copy(
        path.join(sourceDir, "song"),
        path.join(claudeDir, "song"),
        { overwrite: true },
      );
      s.stop("Notification sounds installed");
    }

    if (options.customStatusline) {
      s.start("Checking dependencies");
      await checkAndInstallDependencies();
      s.stop("Dependencies checked");

      s.start("Installing statusline dependencies");
      await installStatuslineDependencies(claudeDir);
      s.stop("Statusline dependencies installed");
    }

    if (options.customStatusline && !skipInteractive) {
      const existingStatusLine = await hasExistingStatusLine(claudeDir);
      if (existingStatusLine) {
        const confirmAnswer = await inquirer.prompt([
          {
            type: "confirm",
            name: "replace",
            message: "You already have a statusLine configuration. Replace it?",
            default: true,
          },
        ]);
        options.replaceStatusline = confirmAnswer.replace;
        if (!confirmAnswer.replace) {
          console.log(chalk.yellow("  Keeping existing statusLine configuration"));
        }
      }
    }

    s.start("Updating settings.json");
    await updateSettings(options, claudeDir);
    s.stop("Settings updated");

    s.start("Cleaning up temporary files");
    await cleanupRepository(repoPath);
    s.stop("Cleanup complete");

    console.log(chalk.green("✨ Setup complete!"));

    console.log(chalk.gray("\nNext steps:"));
    if (options.shellShortcuts) {
      const platform = os.platform();
      if (platform === "win32") {
        console.log(
          chalk.gray(
            "  • Restart PowerShell to load the new functions",
          ),
        );
      } else {
        console.log(
          chalk.gray(
            "  • Restart your terminal or run: source ~/.zshenv (macOS) or source ~/.bashrc (Linux)",
          ),
        );
      }
      console.log(
        chalk.gray('  • Use "cc" for Claude Code with permissions skipped'),
      );
      console.log(
        chalk.gray(
          '  • Use "ccc" for Claude Code with permissions skipped and continue mode',
        ),
      );
    }
    console.log(
      chalk.gray(
        '  • Run "claude" to start using Claude Code with your new configuration',
      ),
    );

    console.log(
      chalk.blue(
        "\n💎 Want premium features? Get AIBlueprint CLI Pro at https://mlv.sh/claude-cli",
      ),
    );
  } catch (error) {
    console.error(chalk.red("\n❌ Setup failed:"), error);
    console.log(chalk.red("Setup failed!"));

    if (repoPath) {
      await cleanupRepository(repoPath);
    }

    process.exit(1);
  }
}
