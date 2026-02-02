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

  if (checkCommand("bun")) {
    console.log(chalk.gray("  bun already installed, skipping..."));
  } else {
    console.log(chalk.yellow("\n  Installing bun..."));
    try {
      execSync("npm install -g bun", {
        stdio: "inherit",
        timeout: 60000,
        env: { ...process.env, CI: "true" },
      });
    } catch {
      console.log(
        chalk.yellow(
          "  ⚠ Failed to install bun. Please install it manually: npm install -g bun",
        ),
      );
    }
  }

  if (checkCommand("ccusage")) {
    console.log(chalk.gray("  ccusage already installed, skipping..."));
  } else {
    console.log(chalk.yellow("\n  Installing ccusage..."));
    try {
      execSync("npm install -g ccusage", {
        stdio: "inherit",
        timeout: 60000,
        env: { ...process.env, CI: "true" },
      });
    } catch {
      console.log(
        chalk.yellow(
          "  ⚠ Failed to install ccusage. Please install it manually: npm install -g ccusage",
        ),
      );
    }
  }
}

export async function installScriptsDependencies(claudeDir: string) {
  const scriptsDir = path.join(claudeDir, "scripts");

  console.log(chalk.yellow("\n  Installing scripts dependencies..."));
  try {
    execSync("bun install --no-save", {
      cwd: scriptsDir,
      stdio: "inherit",
      timeout: 60000,
      env: {
        ...process.env,
        CI: "true",
      },
    });
    console.log(chalk.green("  ✓ Scripts dependencies installed"));
  } catch (error) {
    const isTimeout = error instanceof Error && error.message.includes("ETIMEDOUT");
    if (isTimeout) {
      console.log(
        chalk.yellow(
          "  ⚠ Bun install timed out. Please run 'bun install' manually in ~/.claude/scripts",
        ),
      );
    } else {
      console.log(
        chalk.yellow(
          "  ⚠ Failed to install scripts dependencies. Please run 'bun install' manually in ~/.claude/scripts",
        ),
      );
    }
  }
}

export async function installStatuslineDependencies(claudeDir: string) {
  await installScriptsDependencies(claudeDir);
}
