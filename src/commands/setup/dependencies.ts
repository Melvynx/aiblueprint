import { execSync } from "child_process";
import chalk from "chalk";
import path from "path";
import os from "os";

export async function checkAndInstallDependencies() {
  const isWindows = os.platform() === "win32";
  const checkCommand = (cmd: string): boolean => {
    try {
      const whichCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
      execSync(whichCmd, { stdio: "ignore" });
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

export async function installScriptsDependencies(claudeDir: string) {
  const scriptsDir = path.join(claudeDir, "scripts");

  console.log(chalk.yellow("\n  Installing scripts dependencies..."));
  try {
    execSync("bun install", {
      cwd: scriptsDir,
      stdio: "inherit"
    });
    console.log(chalk.green("  ✓ Scripts dependencies installed"));
  } catch (error) {
    console.log(
      chalk.red(
        "  Failed to install scripts dependencies. Please run 'bun install' manually in ~/.claude/scripts",
      ),
    );
  }
}

export async function installStatuslineDependencies(claudeDir: string) {
  await installScriptsDependencies(claudeDir);
}
