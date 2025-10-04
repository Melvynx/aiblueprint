import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple spinner replacement for clack.spinner()
class SimpleSpinner {
  private message: string = "";

  start(message: string) {
    this.message = message;
    console.log(chalk.gray(`⏳ ${message}...`));
  }

  stop(message: string) {
    console.log(chalk.green(`✓ ${message}`));
  }
}

interface SetupOptions {
  shellShortcuts: boolean;
  commandValidation: boolean;
  customStatusline: boolean;
  aiblueprintCommands: boolean;
  aiblueprintAgents: boolean;
  outputStyles: boolean;
  notificationSounds: boolean;
  codexSymlink: boolean;
}

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config";

async function downloadFromGitHub(
  relativePath: string,
  targetPath: string,
): Promise<boolean> {
  try {
    const url = `${GITHUB_RAW_BASE}/${relativePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    const content = await response.arrayBuffer();
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, Buffer.from(content));
    return true;
  } catch (error) {
    return false;
  }
}

async function downloadDirectoryFromGitHub(
  dirPath: string,
  targetDir: string,
): Promise<boolean> {
  try {
    // Use GitHub API to list directory contents
    const apiUrl = `https://api.github.com/repos/Melvynx/aiblueprint-cli/contents/claude-code-config/${dirPath}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return false;
    }

    const files = await response.json();
    if (!Array.isArray(files)) {
      return false;
    }

    await fs.ensureDir(targetDir);

    for (const file of files) {
      const relativePath = `${dirPath}/${file.name}`;
      const targetPath = path.join(targetDir, file.name);

      if (file.type === "file") {
        await downloadFromGitHub(relativePath, targetPath);
      } else if (file.type === "dir") {
        await downloadDirectoryFromGitHub(relativePath, targetPath);
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function setupCommand(
  customClaudeCodeFolder?: string,
  customCodexFolder?: string,
  skipInteractive?: boolean,
) {
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
        "outputStyles",
        "notificationSounds",
        "codexSymlink",
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
              value: "outputStyles",
              name: "Output styles - Custom output formatting",
              checked: true,
            },
            {
              value: "notificationSounds",
              name: "Notification sounds - Audio alerts for events",
              checked: true,
            },
            {
              value: "codexSymlink",
              name: "Codex symlink - Link commands to ~/.codex/prompts",
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
      aiblueprintCommands: features.includes("aiblueprintCommands"),
      aiblueprintAgents: features.includes("aiblueprintAgents"),
      outputStyles: features.includes("outputStyles"),
      notificationSounds: features.includes("notificationSounds"),
      codexSymlink: features.includes("codexSymlink"),
    };

    const s = new SimpleSpinner();

    const claudeDir = customClaudeCodeFolder
      ? path.resolve(customClaudeCodeFolder)
      : path.join(os.homedir(), ".claude");

    console.log(chalk.gray(`Installing to: ${claudeDir}`));

    await fs.ensureDir(claudeDir);

    // Try to download from GitHub first, fallback to local files
    let useGitHub = true;
    let sourceDir: string | undefined;
    const testUrl = `${GITHUB_RAW_BASE}/scripts/validate-command.js`;
    try {
      const testResponse = await fetch(testUrl);
      useGitHub = testResponse.ok;
    } catch {
      useGitHub = false;
    }

    if (!useGitHub) {
      // Fallback to local source directory
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

      if (!sourceDir) {
        throw new Error(
          "Could not find claude-code-config directory locally and GitHub is not accessible",
        );
      }

      console.log(
        chalk.yellow(
          "  Using local configuration files (GitHub not accessible)",
        ),
      );
    } else {
      console.log(
        chalk.green("  Downloading latest configuration from GitHub"),
      );
    }

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
      if (useGitHub) {
        const scriptsDir = path.join(claudeDir, "scripts");
        await fs.ensureDir(scriptsDir);
        const scriptFiles = [
          "validate-command.js",
          "statusline-ccusage.sh",
          "validate-command.readme.md",
          "statusline.readme.md",
        ];
        for (const file of scriptFiles) {
          await downloadFromGitHub(
            `scripts/${file}`,
            path.join(scriptsDir, file),
          );
        }
      } else {
        await fs.copy(
          path.join(sourceDir!, "scripts"),
          path.join(claudeDir, "scripts"),
          { overwrite: true },
        );
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
      await setupCodexSymlink(claudeDir, customCodexFolder, customClaudeCodeFolder);
      s.stop("Codex symlink configured");
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

    if (options.outputStyles) {
      s.start("Setting up output styles");
      if (useGitHub) {
        await downloadDirectoryFromGitHub(
          "output-styles",
          path.join(claudeDir, "output-styles"),
        );
      } else {
        await fs.copy(
          path.join(sourceDir!, "output-styles"),
          path.join(claudeDir, "output-styles"),
          { overwrite: true },
        );
      }
      s.stop("Output styles installed");
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
    }

    s.start("Updating settings.json");
    await updateSettings(options, claudeDir);
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
  } catch (error) {
    console.error(chalk.red("\n❌ Setup failed:"), error);
    console.log(chalk.red("Setup failed!"));
    process.exit(1);
  }
}

async function setupShellShortcuts() {
  try {
    const platform = os.platform();
    let shellConfigFile: string;

    if (platform === "darwin") {
      shellConfigFile = path.join(os.homedir(), ".zshenv");
    } else if (platform === "linux") {
      const shell = process.env.SHELL || "";
      if (shell.includes("zsh")) {
        shellConfigFile = path.join(os.homedir(), ".zshrc");
      } else {
        shellConfigFile = path.join(os.homedir(), ".bashrc");
      }
    } else {
      console.log(
        chalk.yellow("Shell shortcuts are only supported on macOS and Linux"),
      );
      return;
    }

    const aliases = `
# AIBlueprint Claude Code aliases
alias cc="claude --dangerously-skip-permissions"
alias ccc="claude --dangerously-skip-permissions -c"
`;

    const existingContent = await fs
      .readFile(shellConfigFile, "utf-8")
      .catch(() => "");

    if (!existingContent.includes("AIBlueprint Claude Code aliases")) {
      await fs.appendFile(shellConfigFile, aliases);
    }
  } catch (error) {
    console.error(chalk.red("Error setting up shell shortcuts:"), error);
    throw error;
  }
}

async function setupCodexSymlink(
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

    await fs.ensureDir(codexDir);

    const promptsExists = await fs.pathExists(promptsPath);
    if (promptsExists) {
      const stat = await fs.lstat(promptsPath);
      if (stat.isSymbolicLink()) {
        await fs.remove(promptsPath);
      } else {
        console.log(
          chalk.yellow(
            "  ~/.codex/prompts already exists and is not a symlink. Skipping...",
          ),
        );
        return;
      }
    }

    await fs.symlink(commandsPath, promptsPath);
  } catch (error) {
    console.error(chalk.red("Error setting up Codex symlink:"), error);
    throw error;
  }
}

async function checkAndInstallDependencies() {
  const checkCommand = (cmd: string): boolean => {
    try {
      execSync(`which ${cmd}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };

  if (!checkCommand("bun")) {
    console.log(chalk.yellow("\n  Installing bun..."));
    try {
      execSync("npm install -g bun", { stdio: "inherit" });
    } catch (error) {
      console.log(
        chalk.red(
          "  Failed to install bun. Please install it manually: npm install -g bun",
        ),
      );
    }
  }

  if (!checkCommand("ccusage")) {
    console.log(chalk.yellow("\n  Installing ccusage..."));
    try {
      execSync("npm install -g ccusage", { stdio: "inherit" });
    } catch (error) {
      console.log(
        chalk.red(
          "  Failed to install ccusage. Please install it manually: npm install -g ccusage",
        ),
      );
    }
  }
}

async function updateSettings(options: SetupOptions, claudeDir: string) {
  const settingsPath = path.join(claudeDir, "settings.json");
  let settings: any = {};

  try {
    const existingSettings = await fs.readFile(settingsPath, "utf-8");
    settings = JSON.parse(existingSettings);
  } catch {
    // Settings file doesn't exist or is invalid
  }

  if (options.customStatusline) {
    if (settings.statusLine) {
      const confirmAnswer = await inquirer.prompt([
        {
          type: "confirm",
          name: "replace",
          message: "You already have a statusLine configuration. Replace it?",
        },
      ]);

      if (!confirmAnswer.replace) {
        console.log(
          chalk.yellow("  Keeping existing statusLine configuration"),
        );
      } else {
        settings.statusLine = {
          type: "command",
          command: `bash ${path.join(claudeDir, "scripts/statusline-ccusage.sh")}`,
          padding: 0,
        };
      }
    } else {
      settings.statusLine = {
        type: "command",
        command: `bash ${path.join(claudeDir, "scripts/statusline-ccusage.sh")}`,
        padding: 0,
      };
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (options.commandValidation) {
    if (!settings.hooks.PreToolUse) {
      settings.hooks.PreToolUse = [];
    }

    const bashHook = {
      matcher: "Bash",
      hooks: [
        {
          type: "command",
          command: `bun ${path.join(claudeDir, "scripts/validate-command.js")}`,
        },
      ],
    };

    const existingBashHook = settings.hooks.PreToolUse.find(
      (h: any) => h.matcher === "Bash",
    );
    if (!existingBashHook) {
      settings.hooks.PreToolUse.push(bashHook);
    }
  }

  if (options.notificationSounds) {
    if (!settings.hooks.Stop) {
      settings.hooks.Stop = [];
    }

    const stopHook = {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `afplay -v 0.1 ${path.join(claudeDir, "song/finish.mp3")}`,
        },
      ],
    };

    const existingStopHook = settings.hooks.Stop.find((h: any) =>
      h.hooks?.some((hook: any) => hook.command?.includes("finish.mp3")),
    );
    if (!existingStopHook) {
      settings.hooks.Stop.push(stopHook);
    }

    if (!settings.hooks.Notification) {
      settings.hooks.Notification = [];
    }

    const notificationHook = {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `afplay -v 0.1 ${path.join(claudeDir, "song/need-human.mp3")}`,
        },
      ],
    };

    const existingNotificationHook = settings.hooks.Notification.find(
      (h: any) =>
        h.hooks?.some((hook: any) => hook.command?.includes("need-human.mp3")),
    );
    if (!existingNotificationHook) {
      settings.hooks.Notification.push(notificationHook);
    }
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}
