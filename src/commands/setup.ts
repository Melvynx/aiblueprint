import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { checkAndInstallDependencies, installStatuslineDependencies } from "./setup/dependencies.js";
import { updateSettings, hasExistingStatusLine, type SetupOptions } from "./setup/settings.js";
import {
  SimpleSpinner,
  cloneRepository,
  cleanupRepository,
  resolveConfigDir,
} from "./setup/utils.js";
import { getVersion } from "../lib/version.js";
import { createBackup } from "../lib/backup-utils.js";
import { replacePathPlaceholdersInDir } from "../lib/platform.js";
import { trackEvent, trackError, flushTelemetry } from "../lib/telemetry.js";
import {
  installCategoryToAgents,
  syncCategorySymlinks,
} from "../lib/agents-installer.js";
import { resolveFolders } from "../lib/folder-paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export interface SetupCommandParams {
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
  agentsFolder?: string;
  skipInteractive?: boolean;
}

/**
 * Resolves where a Claude-routed asset lives in the source repo. Prefers the
 * new `claude-config/<name>` location; falls back to the legacy root path.
 */
async function resolveClaudeAssetPath(
  sourceDir: string,
  name: string,
): Promise<string | null> {
  const candidates = [
    path.join(sourceDir, "claude-config", name),
    path.join(sourceDir, name),
  ];
  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) return candidate;
  }
  return null;
}

export async function setupCommand(params: SetupCommandParams = {}) {
  const {
    folder,
    claudeCodeFolder,
    codexFolder,
    agentsFolder,
    skipInteractive,
  } = params;

  let repoPath: string | null = null;

  try {
    console.log(chalk.blue.bold(`\n🚀 AIBlueprint AI Coding Setup ${chalk.gray(`v${getVersion()}`)}\n`));
    console.log(chalk.bgBlue(" Setting up your AI coding environment "));

    let features: string[];

    if (skipInteractive) {
      features = [
        "shellShortcuts",
        "customStatusline",
        "aiblueprintAgents",
        "aiblueprintSkills",
        "installCodex",
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
              value: "aiblueprintSkills",
              name: "AIBlueprint skills - Pre-built skills (apex, commit, oneshot, etc.)",
              checked: true,
            },
            {
              value: "installCodex",
              name: "Codex setup - Starter config + share skills/agents with ~/.codex",
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
      customStatusline: features.includes("customStatusline"),
      aiblueprintAgents: features.includes("aiblueprintAgents"),
      aiblueprintSkills: features.includes("aiblueprintSkills"),
      installCodex: features.includes("installCodex"),
      skipInteractive,
    };

    const s = new SimpleSpinner();

    const { claudeDir, codexDir, agentsDir } = resolveFolders({
      folder,
      claudeCodeFolder,
      codexFolder,
      agentsFolder,
    });

    console.log(chalk.gray(`Claude:  ${claudeDir}`));
    console.log(chalk.gray(`Codex:   ${codexDir}`));
    console.log(chalk.gray(`Agents:  ${agentsDir}`));

    await fs.ensureDir(claudeDir);
    await fs.ensureDir(agentsDir);

    s.start("Creating backup of existing configuration");
    const backupPath = await createBackup(claudeDir, agentsDir);
    if (backupPath) {
      s.stop(`Backup created: ${chalk.gray(backupPath)}`);
    } else {
      s.stop("No existing config to backup");
    }

    s.start("Cloning configuration repository");
    repoPath = await cloneRepository();

    if (!repoPath) {
      throw new Error(
        "Failed to clone repository. Please check your internet connection and try again.",
      );
    }

    const sourceDir = await resolveConfigDir(repoPath);

    if (!sourceDir) {
      await cleanupRepository(repoPath);
      throw new Error(
        "Configuration directory not found in cloned repository (looked for agents-config/, ai-coding/, claude-code-config/, and ai-config/)",
      );
    }

    s.stop("Repository cloned successfully");

    if (options.shellShortcuts) {
      s.start("Setting up shell shortcuts");
      await setupShellShortcuts();
      s.stop("Shell shortcuts configured");
    }

    if (options.customStatusline) {
      s.start("Setting up scripts");
      const scriptsSource = await resolveClaudeAssetPath(sourceDir, "scripts");
      if (scriptsSource) {
        await fs.copy(scriptsSource, path.join(claudeDir, "scripts"), {
          overwrite: true,
        });
        await replacePathPlaceholdersInDir(path.join(claudeDir, "scripts"), claudeDir);
        await fs.ensureDir(path.join(claudeDir, "scripts/statusline/data"));
        s.stop("Scripts installed");
      } else {
        s.stop("Scripts not available in repository");
      }
    }

    if (options.aiblueprintAgents) {
      s.start("Setting up AIBlueprint agents");
      const agentsSource = path.join(sourceDir, "agents");
      if (await fs.pathExists(agentsSource)) {
        const installResult = await installCategoryToAgents(
          agentsSource,
          "agents",
          agentsDir,
          claudeDir,
          { migrateClaudeDirs: true, silent: true },
        );
        const summary = [
          installResult.copied.length && `${installResult.copied.length} copied`,
          installResult.migrated.length && `${installResult.migrated.length} migrated`,
          installResult.symlinked.length && `${installResult.symlinked.length} linked`,
          installResult.skipped.length && `${installResult.skipped.length} skipped`,
        ]
          .filter(Boolean)
          .join(", ");
        s.stop(`Agents installed${summary ? ` (${summary})` : ""}`);
      } else {
        s.stop("Agents not available in repository");
      }
    }

    if (options.aiblueprintSkills) {
      s.start("Setting up AIBlueprint Skills");
      const skillsSourcePath = path.join(sourceDir, "skills");
      if (await fs.pathExists(skillsSourcePath)) {
        const installResult = await installCategoryToAgents(
          skillsSourcePath,
          "skills",
          agentsDir,
          claudeDir,
          { migrateClaudeDirs: true, silent: true },
        );
        const summary = [
          installResult.copied.length && `${installResult.copied.length} copied`,
          installResult.migrated.length && `${installResult.migrated.length} migrated`,
          installResult.symlinked.length && `${installResult.symlinked.length} linked`,
          installResult.skipped.length && `${installResult.skipped.length} skipped`,
        ]
          .filter(Boolean)
          .join(", ");
        s.stop(`Skills installed${summary ? ` (${summary})` : ""}`);
        if (installResult.skipped.length > 0) {
          for (const sk of installResult.skipped) {
            console.log(chalk.yellow(`  ⚠️  ${sk.name}: ${sk.reason}`));
          }
        }
      } else {
        s.stop("Skills not available in repository");
      }
    }

    if (options.installCodex) {
      s.start("Setting up Codex");
      await fs.ensureDir(codexDir);

      const codexConfigSource = path.join(sourceDir, "codex-config");
      if (await fs.pathExists(codexConfigSource)) {
        // overwrite:false preserves any existing user config.toml / AGENTS.md
        await fs.copy(codexConfigSource, codexDir, { overwrite: false });
      }

      if (options.aiblueprintSkills) {
        await syncCategorySymlinks("skills", agentsDir, codexDir, undefined, true);
      }
      if (options.aiblueprintAgents) {
        await syncCategorySymlinks("agents", agentsDir, codexDir, undefined, true);
      }
      s.stop("Codex configured");
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

    trackEvent("setup", { features: options });

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
    trackError(error, { command: "setup" });
    await flushTelemetry();
    console.error(chalk.red("\n❌ Setup failed:"), error);
    console.log(chalk.red("Setup failed!"));

    if (repoPath) {
      await cleanupRepository(repoPath);
    }

    process.exit(1);
  }
}
