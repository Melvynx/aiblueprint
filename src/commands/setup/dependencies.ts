import { execSync } from "child_process";
import chalk from "chalk";
import path from "path";
import os from "os";

const isWindows = os.platform() === "win32";

function checkCommand(cmd: string): boolean {
  try {
    const whichCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    execSync(whichCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function silentExec(command: string, options?: { timeout?: number; cwd?: string }): boolean {
  try {
    execSync(command, {
      stdio: "pipe",
      timeout: options?.timeout ?? 60000,
      cwd: options?.cwd,
      env: { ...process.env, CI: "true" },
    });
    return true;
  } catch {
    return false;
  }
}

function installBun(): boolean {
  if (!isWindows) {
    if (silentExec("curl -fsSL https://bun.sh/install | bash", { timeout: 120000 })) {
      return true;
    }
  }
  return silentExec("npm install -g bun");
}

function installCcusage(): boolean {
  return silentExec("npm install -g ccusage");
}

function logSkipped(name: string) {
  console.log(chalk.gray(`  ${name} already installed, skipping...`));
}

function logInstalling(name: string) {
  console.log(chalk.yellow(`\n  Installing ${name}...`));
}

function logInstalled(name: string) {
  console.log(chalk.green(`  ✓ ${name} installed`));
}

function logInstallFailed(name: string, manualCommand: string) {
  console.log("");
  console.log(chalk.yellow(`  ⚠ Could not install ${name} automatically`));
  console.log(chalk.gray(`    This is usually a permissions issue with npm global installs.`));
  console.log(chalk.gray(`    Run this manually to fix it:\n`));
  console.log(chalk.white(`    ${manualCommand}`));
  console.log("");
}

export async function checkAndInstallDependencies() {
  if (checkCommand("bun")) {
    logSkipped("bun");
  } else {
    logInstalling("bun");
    if (installBun()) {
      logInstalled("bun");
    } else {
      logInstallFailed(
        "bun",
        isWindows
          ? "npm install -g bun"
          : "curl -fsSL https://bun.sh/install | bash",
      );
    }
  }

  if (checkCommand("ccusage")) {
    logSkipped("ccusage");
  } else {
    logInstalling("ccusage");
    if (installCcusage()) {
      logInstalled("ccusage");
    } else {
      logInstallFailed("ccusage", "sudo npm install -g ccusage");
    }
  }
}

export async function installScriptsDependencies(claudeDir: string) {
  const scriptsDir = path.join(claudeDir, "scripts");

  console.log(chalk.yellow("\n  Installing scripts dependencies..."));
  try {
    execSync("bun install --no-save", {
      cwd: scriptsDir,
      stdio: "pipe",
      timeout: 60000,
      env: {
        ...process.env,
        CI: "true",
      },
    });
    console.log(chalk.green("  ✓ Scripts dependencies installed"));
  } catch (error) {
    const isTimeout =
      error instanceof Error && error.message.includes("ETIMEDOUT");
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
