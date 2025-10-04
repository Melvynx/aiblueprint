import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

export async function setupShellShortcuts() {
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
