import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export async function setupShellShortcuts() {
  try {
    const platform = os.platform();
    let shellConfigFile: string;
    let aliases: string;

    if (platform === "darwin") {
      shellConfigFile = path.join(os.homedir(), ".zshenv");
      aliases = `
# AIBlueprint Claude Code aliases
alias cc="claude --dangerously-skip-permissions"
alias ccc="claude --dangerously-skip-permissions -c"
`;
    } else if (platform === "linux") {
      const shell = process.env.SHELL || "";
      if (shell.includes("zsh")) {
        shellConfigFile = path.join(os.homedir(), ".zshrc");
      } else {
        shellConfigFile = path.join(os.homedir(), ".bashrc");
      }
      aliases = `
# AIBlueprint Claude Code aliases
alias cc="claude --dangerously-skip-permissions"
alias ccc="claude --dangerously-skip-permissions -c"
`;
    } else if (platform === "win32") {
      // Windows: Setup PowerShell profile
      // Try PowerShell Core (7+) first, then fall back to Windows PowerShell (5.1)
      const pwshProfileDir = path.join(
        os.homedir(),
        "Documents",
        "PowerShell",
      );
      const windowsPwshProfileDir = path.join(
        os.homedir(),
        "Documents",
        "WindowsPowerShell",
      );

      // Check which PowerShell is available and create profile accordingly
      let profileDir: string;
      if (await fs.pathExists(pwshProfileDir)) {
        profileDir = pwshProfileDir;
      } else if (await fs.pathExists(windowsPwshProfileDir)) {
        profileDir = windowsPwshProfileDir;
      } else {
        // Create PowerShell Core directory (preferred)
        profileDir = pwshProfileDir;
        await fs.ensureDir(profileDir);
      }

      shellConfigFile = path.join(profileDir, "Profile.ps1");

      // PowerShell uses functions instead of aliases for commands with arguments
      aliases = `
# AIBlueprint Claude Code shortcuts
function cc { claude --dangerously-skip-permissions $args }
function ccc { claude --dangerously-skip-permissions -c $args }
`;
    } else {
      console.log(
        chalk.yellow(
          `Shell shortcuts are not supported on platform: ${platform}`,
        ),
      );
      return;
    }

    const existingContent = await fs
      .readFile(shellConfigFile, "utf-8")
      .catch(() => "");

    if (!existingContent.includes("AIBlueprint Claude Code")) {
      await fs.appendFile(shellConfigFile, aliases);
    }
  } catch (error) {
    console.error(chalk.red("Error setting up shell shortcuts:"), error);
    throw error;
  }
}
