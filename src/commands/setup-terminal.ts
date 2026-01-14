import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";
import { execSync, exec } from "child_process";
import { getPlatformInfo } from "../lib/platform.js";
import { getVersion } from "../lib/version.js";
import { SimpleSpinner } from "./setup/utils.js";

const OHMYZSH_INSTALL_URL =
  "https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh";

const INSTALL_TIMEOUT = 120000; // 2 minutes for Oh My ZSH install
const PLUGIN_TIMEOUT = 60000; // 1 minute for plugin clone

const THEMES = [
  { value: "robbyrussell", name: "robbyrussell (default) - Clean and minimal" },
  { value: "agnoster", name: "agnoster - Powerline style (requires patched font)" },
  { value: "af-magic", name: "af-magic - Colorful with git info" },
  { value: "dst", name: "dst - Clean with directory path" },
  { value: "simple", name: "simple - Minimalist" },
  { value: "bira", name: "bira - Two-line prompt with user info" },
  { value: "custom", name: "Custom theme (enter name manually)" },
];

const PLUGINS = ["git", "zsh-autosuggestions", "zsh-syntax-highlighting"];

export interface SetupTerminalOptions {
  skipInteractive?: boolean;
  homeDir?: string; // Override home directory for testing
}

export function sanitizeThemeName(theme: string): string {
  const sanitized = theme.replace(/[^a-zA-Z0-9_-]/g, "");
  if (sanitized.length === 0) {
    return "robbyrussell";
  }
  return sanitized;
}

export function commandExists(cmd: string): boolean {
  if (!/^[a-zA-Z0-9_-]+$/.test(cmd)) {
    return false;
  }
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function isOhMyZshInstalled(homeDir: string): boolean {
  const ohMyZshDir = path.join(homeDir, ".oh-my-zsh");
  return fs.existsSync(ohMyZshDir);
}

export function backupFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${filePath}.backup-${timestamp}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${(error as Error).message}`);
  }
}

function getPackageManager(): { cmd: string; installCmd: string } | null {
  // Check for apt (Debian/Ubuntu)
  if (commandExists("apt")) {
    return { cmd: "apt", installCmd: "sudo apt install -y" };
  }
  // Check for apt-get (older Debian/Ubuntu)
  if (commandExists("apt-get")) {
    return { cmd: "apt-get", installCmd: "sudo apt-get install -y" };
  }
  // Check for brew (macOS)
  if (commandExists("brew")) {
    return { cmd: "brew", installCmd: "brew install" };
  }
  // Check for dnf (Fedora)
  if (commandExists("dnf")) {
    return { cmd: "dnf", installCmd: "sudo dnf install -y" };
  }
  // Check for yum (CentOS/RHEL)
  if (commandExists("yum")) {
    return { cmd: "yum", installCmd: "sudo yum install -y" };
  }
  // Check for pacman (Arch)
  if (commandExists("pacman")) {
    return { cmd: "pacman", installCmd: "sudo pacman -S --noconfirm" };
  }
  return null;
}

function installPrerequisiteSync(packageName: string, installCmd: string): boolean {
  try {
    const fullCmd = `${installCmd} ${packageName}`;
    execSync(fullCmd, { stdio: "inherit", timeout: INSTALL_TIMEOUT });
    return true;
  } catch {
    return false;
  }
}

async function installOhMyZsh(homeDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const installCmd = `sh -c "$(curl -fsSL ${OHMYZSH_INSTALL_URL})" "" --unattended`;
    const env = { ...process.env, HOME: homeDir, ZSH: path.join(homeDir, ".oh-my-zsh") };
    exec(installCmd, { timeout: INSTALL_TIMEOUT, env }, (error, stdout, stderr) => {
      if (error) {
        if ('killed' in error && error.killed) {
          reject(new Error("Oh My ZSH installation timed out. Please check your network connection."));
        } else {
          reject(new Error(`Failed to install Oh My ZSH: ${stderr || error.message}`));
        }
      } else {
        resolve();
      }
    });
  });
}

export async function installPlugin(pluginName: string, repoUrl: string, homeDir: string): Promise<void> {
  if (!/^[a-zA-Z0-9_-]+$/.test(pluginName)) {
    throw new Error(`Invalid plugin name: ${pluginName}`);
  }
  if (!/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/.test(repoUrl)) {
    throw new Error(`Invalid repository URL: ${repoUrl}`);
  }

  const customPluginsDir = path.join(
    homeDir,
    ".oh-my-zsh/custom/plugins",
    pluginName
  );

  if (fs.existsSync(customPluginsDir)) {
    return;
  }

  return new Promise((resolve, reject) => {
    exec(`git clone ${repoUrl} "${customPluginsDir}"`, { timeout: PLUGIN_TIMEOUT }, (error, stdout, stderr) => {
      if (error) {
        if ('killed' in error && error.killed) {
          reject(new Error(`Plugin ${pluginName} installation timed out. Please check your network connection.`));
        } else {
          reject(new Error(`Failed to install ${pluginName}: ${stderr || error.message}`));
        }
      } else {
        resolve();
      }
    });
  });
}

export function updateZshrcTheme(theme: string, homeDir: string): void {
  const zshrcPath = path.join(homeDir, ".zshrc");
  const sanitizedTheme = sanitizeThemeName(theme);

  if (!fs.existsSync(zshrcPath)) {
    throw new Error(".zshrc file not found. Please ensure Oh My ZSH is installed correctly.");
  }

  try {
    let content = fs.readFileSync(zshrcPath, "utf-8");

    if (content.match(/^ZSH_THEME=/m)) {
      content = content.replace(/^ZSH_THEME=.*/m, `ZSH_THEME="${sanitizedTheme}"`);
    } else {
      content = `ZSH_THEME="${sanitizedTheme}"\n${content}`;
    }

    fs.writeFileSync(zshrcPath, content);
  } catch (error) {
    if ((error as Error).message.includes(".zshrc file not found")) {
      throw error;
    }
    throw new Error(`Failed to update theme in .zshrc: ${(error as Error).message}`);
  }
}

export function updateZshrcPlugins(plugins: string[], homeDir: string): void {
  const zshrcPath = path.join(homeDir, ".zshrc");

  if (!fs.existsSync(zshrcPath)) {
    throw new Error(".zshrc file not found. Please ensure Oh My ZSH is installed correctly.");
  }

  try {
    let content = fs.readFileSync(zshrcPath, "utf-8");
    const pluginsString = plugins.join(" ");

    if (content.match(/^plugins=\(/m)) {
      content = content.replace(/^plugins=\([^)]*\)/m, `plugins=(${pluginsString})`);
    } else {
      content = `${content}\nplugins=(${pluginsString})`;
    }

    fs.writeFileSync(zshrcPath, content);
  } catch (error) {
    if ((error as Error).message.includes(".zshrc file not found")) {
      throw error;
    }
    throw new Error(`Failed to update plugins in .zshrc: ${(error as Error).message}`);
  }
}

export async function setupTerminalCommand(options: SetupTerminalOptions = {}) {
  const { skipInteractive, homeDir: customHomeDir } = options;
  const homeDir = customHomeDir || os.homedir();

  try {
    console.log(chalk.blue.bold(`\n🖥️  AIBlueprint Terminal Setup ${chalk.gray(`v${getVersion()}`)}\n`));
    console.log(chalk.bgBlue(" Setting up your terminal with Oh My ZSH "));

    const platformInfo = getPlatformInfo();

    if (platformInfo.isWindows) {
      console.log(chalk.red("\n❌ This command is not supported on Windows."));
      console.log(chalk.yellow("Please use WSL (Windows Subsystem for Linux) instead:"));
      console.log(chalk.gray("  1. Open PowerShell as Administrator"));
      console.log(chalk.gray("  2. Run: wsl --install"));
      console.log(chalk.gray("  3. Restart your computer"));
      console.log(chalk.gray("  4. Open WSL and run this command again"));
      process.exit(1);
    }

    const s = new SimpleSpinner();

    s.start("Checking prerequisites");
    const missingPrereqs: string[] = [];

    if (!commandExists("curl")) {
      missingPrereqs.push("curl");
    }
    if (!commandExists("git")) {
      missingPrereqs.push("git");
    }
    if (!commandExists("zsh")) {
      missingPrereqs.push("zsh");
    }

    if (missingPrereqs.length > 0) {
      s.stop(`Missing: ${missingPrereqs.join(", ")}`);

      const packageManager = getPackageManager();

      if (!packageManager) {
        console.log(chalk.red(`\n❌ Missing required tools: ${missingPrereqs.join(", ")}`));
        console.log(chalk.yellow("\nCould not detect package manager. Please install manually:"));
        if (platformInfo.isMacOS) {
          console.log(chalk.gray("  brew install " + missingPrereqs.join(" ")));
        } else {
          console.log(chalk.gray("  sudo apt install " + missingPrereqs.join(" ")));
        }
        process.exit(1);
      }

      console.log(chalk.yellow(`\nInstalling missing prerequisites: ${missingPrereqs.join(", ")}`));
      console.log(chalk.gray(`Using package manager: ${packageManager.cmd}`));

      for (const pkg of missingPrereqs) {
        console.log(chalk.yellow(`\n📦 Installing ${pkg}...`));
        const success = installPrerequisiteSync(pkg, packageManager.installCmd);
        if (success) {
          console.log(chalk.green(`✓ ${pkg} installed`));
        } else {
          console.log(chalk.red(`\n❌ Failed to install ${pkg}`));
          console.log(chalk.yellow("Please install it manually:"));
          console.log(chalk.gray(`  ${packageManager.installCmd} ${pkg}`));
          process.exit(1);
        }
      }

      console.log(chalk.green("✓ All prerequisites installed"));
    } else {
      s.stop("Prerequisites OK");
    }

    let selectedTheme = "robbyrussell";

    if (!skipInteractive) {
      const themeAnswer = await inquirer.prompt([
        {
          type: "list",
          name: "theme",
          message: "Which theme would you like to use?",
          choices: THEMES,
          default: "robbyrussell",
        },
      ]);

      if (themeAnswer.theme === "custom") {
        const customThemeAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "customTheme",
            message: "Enter the theme name (see: https://github.com/ohmyzsh/ohmyzsh/wiki/Themes):",
            default: "robbyrussell",
            validate: (value: string) => {
              const sanitized = sanitizeThemeName(value);
              if (sanitized !== value) {
                return `Theme name can only contain letters, numbers, hyphens, and underscores. Will use: "${sanitized}"`;
              }
              return true;
            },
          },
        ]);
        selectedTheme = sanitizeThemeName(customThemeAnswer.customTheme);
      } else {
        selectedTheme = themeAnswer.theme;
      }
    }

    const zshrcPath = path.join(homeDir, ".zshrc");
    if (fs.existsSync(zshrcPath)) {
      s.start("Backing up .zshrc");
      const backupPath = backupFile(zshrcPath);
      if (backupPath) {
        s.stop(`Backup created: ${chalk.gray(backupPath)}`);
      } else {
        s.stop("No backup needed");
      }
    }

    if (isOhMyZshInstalled(homeDir)) {
      console.log(chalk.green("✓ Oh My ZSH already installed"));
    } else {
      s.start("Installing Oh My ZSH (this may take a minute)");
      await installOhMyZsh(homeDir);
      s.stop("Oh My ZSH installed");
    }

    s.start("Installing zsh-autosuggestions plugin");
    await installPlugin(
      "zsh-autosuggestions",
      "https://github.com/zsh-users/zsh-autosuggestions",
      homeDir
    );
    s.stop("zsh-autosuggestions installed");

    s.start("Installing zsh-syntax-highlighting plugin");
    await installPlugin(
      "zsh-syntax-highlighting",
      "https://github.com/zsh-users/zsh-syntax-highlighting",
      homeDir
    );
    s.stop("zsh-syntax-highlighting installed");

    s.start(`Configuring theme: ${selectedTheme}`);
    updateZshrcTheme(selectedTheme, homeDir);
    s.stop(`Theme set to: ${selectedTheme}`);

    s.start("Configuring plugins");
    updateZshrcPlugins(PLUGINS, homeDir);
    s.stop("Plugins configured");

    console.log(chalk.green("\n✨ Terminal setup complete!"));

    console.log(chalk.gray("\nNext steps:"));
    console.log(chalk.gray("  • Restart your terminal or run: source ~/.zshrc"));
    console.log(chalk.gray(`  • Theme: ${selectedTheme}`));
    console.log(chalk.gray(`  • Plugins: ${PLUGINS.join(", ")}`));

    if (selectedTheme === "agnoster") {
      console.log(chalk.yellow("\n⚠️  Note: agnoster theme requires a Powerline-patched font."));
      console.log(chalk.gray("  Install from: https://github.com/powerline/fonts"));
    }

    console.log(
      chalk.blue("\n📚 Explore more themes: https://github.com/ohmyzsh/ohmyzsh/wiki/Themes")
    );

  } catch (error) {
    console.error(chalk.red("\n❌ Setup failed:"), error);
    process.exit(1);
  }
}
