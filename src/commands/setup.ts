import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { setupCodexSymlink, setupOpenCodeSymlink } from "./setup/symlinks.js";
import { checkAndInstallDependencies, installStatuslineDependencies } from "./setup/dependencies.js";
import { updateSettings, type SetupOptions } from "./setup/settings.js";
import {
  SimpleSpinner,
  downloadFromGitHub,
  downloadDirectoryFromGitHub,
} from "./setup/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config";

export interface SetupCommandParams {
  claudeCodeFolder?: string;
  codexFolder?: string;
  openCodeFolder?: string;
  skipInteractive?: boolean;
}

export async function setupCommand(params: SetupCommandParams = {}) {
  const {
    claudeCodeFolder: customClaudeCodeFolder,
    codexFolder: customCodexFolder,
    openCodeFolder: customOpenCodeFolder,
    skipInteractive,
  } = params;
  try {
    console.log(chalk.blue.bold("\n🚀 AIBlueprint Claude Code Setup\n"));
    console.log(chalk.bgBlue(" Setting up your Claude Code environment "));

    let features: string[];

    if (skipInteractive) {
      features = [
        "shellShortcuts",
        "commandValidation",
        "customStatusline",
        "aiblueprintCommands",
        "aiblueprintAgents",
        "notificationSounds",
        "codexSymlink",
        "openCodeSymlink",
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
              value: "aiblueprintCommands",
              name: "AIBlueprint commands - Pre-configured command templates",
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
            {
              value: "postEditTypeScript",
              name: "Post-edit TypeScript hook - Auto-format and lint TypeScript files",
              checked: false,
            },
            {
              value: "codexSymlink",
              name: "Codex symlink - Link commands to ~/.codex/prompts",
              checked: false,
            },
            {
              value: "openCodeSymlink",
              name: "OpenCode symlink - Link commands to ~/.config/opencode/command",
              checked: false,
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
      aiblueprintCommands: features.includes("aiblueprintCommands"),
      aiblueprintAgents: features.includes("aiblueprintAgents"),
      notificationSounds: features.includes("notificationSounds"),
      postEditTypeScript: features.includes("postEditTypeScript"),
      codexSymlink: features.includes("codexSymlink"),
      openCodeSymlink: features.includes("openCodeSymlink"),
    };

    const s = new SimpleSpinner();

    const claudeDir = customClaudeCodeFolder
      ? path.resolve(customClaudeCodeFolder)
      : path.join(os.homedir(), ".claude");

    console.log(chalk.gray(`Installing to: ${claudeDir}`));

    await fs.ensureDir(claudeDir);

    // Check for local development files first
    let useGitHub = true;
    let sourceDir: string | undefined;

    const currentDir = process.cwd();
    const possiblePaths = [
      path.join(currentDir, "claude-code-config"),
      path.join(__dirname, "../../claude-code-config"),
      path.join(__dirname, "../claude-code-config"),
      path.join(path.dirname(process.argv[1]), "../claude-code-config"),
    ];

    sourceDir = possiblePaths.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    // If local files exist, prefer them (development mode)
    if (sourceDir) {
      useGitHub = false;
      console.log(
        chalk.yellow("  Using local configuration files (development mode)"),
      );
    } else {
      // Try to download from GitHub
      const testUrl = `${GITHUB_RAW_BASE}/scripts/validate-command.js`;
      try {
        const testResponse = await fetch(testUrl);
        useGitHub = testResponse.ok;
        if (useGitHub) {
          console.log(
            chalk.green("  Downloading latest configuration from GitHub"),
          );
        }
      } catch {
        useGitHub = false;
      }

      if (!useGitHub) {
        throw new Error(
          "Could not find local configuration files and GitHub is not accessible",
        );
      }
    }

    if (options.shellShortcuts) {
      s.start("Setting up shell shortcuts");
      await setupShellShortcuts();
      s.stop("Shell shortcuts configured");
    }

    if (
      options.commandValidation ||
      options.customStatusline ||
      options.notificationSounds ||
      options.postEditTypeScript
    ) {
      s.start("Setting up scripts");
      if (useGitHub) {
        const scriptsDir = path.join(claudeDir, "scripts");
        await fs.ensureDir(scriptsDir);

        if (options.commandValidation) {
          await downloadDirectoryFromGitHub(
            "scripts/command-validator",
            path.join(scriptsDir, "command-validator"),
          );
        }

        if (options.postEditTypeScript) {
          await downloadFromGitHub(
            "scripts/hook-post-file.ts",
            path.join(scriptsDir, "hook-post-file.ts"),
          );
        }

        if (options.customStatusline) {
          await downloadDirectoryFromGitHub(
            "scripts/statusline",
            path.join(scriptsDir, "statusline"),
          );
        }
      } else {
        const scriptsDir = path.join(claudeDir, "scripts");
        await fs.ensureDir(scriptsDir);

        if (options.commandValidation) {
          await fs.copy(
            path.join(sourceDir!, "scripts/command-validator"),
            path.join(scriptsDir, "command-validator"),
            { overwrite: true },
          );
        }

        if (options.postEditTypeScript) {
          await fs.copy(
            path.join(sourceDir!, "scripts/hook-post-file.ts"),
            path.join(scriptsDir, "hook-post-file.ts"),
            { overwrite: true },
          );
        }

        if (options.customStatusline) {
          await fs.copy(
            path.join(sourceDir!, "scripts/statusline"),
            path.join(scriptsDir, "statusline"),
            { overwrite: true },
          );
        }
      }
      s.stop("Scripts installed");
    }

    if (options.aiblueprintCommands) {
      s.start("Setting up AIBlueprint commands");
      if (useGitHub) {
        await downloadDirectoryFromGitHub(
          "commands",
          path.join(claudeDir, "commands"),
        );
      } else {
        await fs.copy(
          path.join(sourceDir!, "commands"),
          path.join(claudeDir, "commands"),
          { overwrite: true },
        );
      }
      s.stop("Commands installed");
    }

    if (options.codexSymlink && options.aiblueprintCommands) {
      s.start("Setting up Codex symlink");
      await setupCodexSymlink(
        claudeDir,
        customCodexFolder,
        customClaudeCodeFolder,
      );
      s.stop("Codex symlink configured");
    }

    if (options.openCodeSymlink && options.aiblueprintCommands) {
      s.start("Setting up OpenCode symlink");
      await setupOpenCodeSymlink(
        claudeDir,
        customOpenCodeFolder,
        customClaudeCodeFolder,
      );
      s.stop("OpenCode symlink configured");
    }

    if (options.aiblueprintAgents) {
      s.start("Setting up AIBlueprint agents");
      if (useGitHub) {
        await downloadDirectoryFromGitHub(
          "agents",
          path.join(claudeDir, "agents"),
        );
      } else {
        await fs.copy(
          path.join(sourceDir!, "agents"),
          path.join(claudeDir, "agents"),
          { overwrite: true },
        );
      }
      s.stop("Agents installed");
    }

    if (options.aiblueprintSkills) {
      s.start("Setting up AIBlueprint Skills");
      if (useGitHub) {
        const testSkillsUrl = `${GITHUB_RAW_BASE}/skills/create-prompt/SKILL.md`;
        try {
          const testResponse = await fetch(testSkillsUrl);
          if (testResponse.ok) {
            await downloadDirectoryFromGitHub(
              "skills",
              path.join(claudeDir, "skills"),
            );
            s.stop("Skills installed");
          } else {
            s.stop("Skills not available in repository");
          }
        } catch {
          s.stop("Skills not available in repository");
        }
      } else {
        const skillsSourcePath = path.join(sourceDir!, "skills");
        if (await fs.pathExists(skillsSourcePath)) {
          await fs.copy(
            skillsSourcePath,
            path.join(claudeDir, "skills"),
            { overwrite: true },
          );
          s.stop("Skills installed");
        } else {
          s.stop("Skills not available in local repository");
        }
      }
    }

    if (options.notificationSounds) {
      s.start("Setting up notification sounds");
      if (useGitHub) {
        const songDir = path.join(claudeDir, "song");
        await fs.ensureDir(songDir);
        await downloadFromGitHub(
          "song/finish.mp3",
          path.join(songDir, "finish.mp3"),
        );
        await downloadFromGitHub(
          "song/need-human.mp3",
          path.join(songDir, "need-human.mp3"),
        );
      } else {
        await fs.copy(
          path.join(sourceDir!, "song"),
          path.join(claudeDir, "song"),
          { overwrite: true },
        );
      }
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

    s.start("Updating settings.json");
    await updateSettings(options, claudeDir, skipInteractive);
    s.stop("Settings updated");

    console.log(chalk.green("✨ Setup complete!"));

    console.log(chalk.gray("\nNext steps:"));
    if (options.shellShortcuts) {
      console.log(
        chalk.gray(
          "  • Restart your terminal or run: source ~/.zshenv (macOS) or source ~/.bashrc (Linux)",
        ),
      );
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
    process.exit(1);
  }
}
