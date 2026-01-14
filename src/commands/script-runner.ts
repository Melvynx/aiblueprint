import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import os from "os";

function checkCommand(cmd: string): boolean {
  try {
    const isWindows = os.platform() === "win32";
    const whichCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
    execSync(whichCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function showAvailableActions(
  prefix: string,
  actions: string[],
): void {
  console.log(
    chalk.blue(
      `\n${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Scripts:`,
    ),
  );
  console.log(chalk.gray(`Run scripts from ~/.claude/scripts\n`));

  for (const action of actions) {
    console.log(chalk.white(`  ${prefix} ${action}`));
  }

  console.log(chalk.gray(`\nUsage: aiblueprint ${prefix} <action>`));
  console.log(
    chalk.gray(
      `Example: aiblueprint ${prefix} ${actions[0] || "start"}\n`,
    ),
  );
}

export async function executeScript(
  scriptName: string,
  claudeDir: string,
): Promise<number> {
  if (!checkCommand("bun")) {
    console.error(
      chalk.red("Bun is not installed. Install with: npm install -g bun"),
    );
    return 1;
  }

  const scriptsDir = path.join(claudeDir, "scripts");

  if (!(await fs.pathExists(scriptsDir))) {
    console.error(
      chalk.red(`Scripts directory not found at ${scriptsDir}`),
    );
    console.log(
      chalk.gray("Run: aiblueprint claude-code setup"),
    );
    return 1;
  }

  const packageJsonPath = path.join(scriptsDir, "package.json");
  if (!(await fs.pathExists(packageJsonPath))) {
    console.error(
      chalk.red(`package.json not found in ${scriptsDir}`),
    );
    return 1;
  }

  const packageJson = await fs.readJson(packageJsonPath);
  if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
    console.error(
      chalk.red(`Script "${scriptName}" not found in package.json`),
    );
    return 1;
  }

  return new Promise((resolve) => {
    const child = spawn("bun", ["run", scriptName], {
      cwd: scriptsDir,
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(code || 0);
    });

    child.on("error", (error) => {
      console.error(chalk.red(`Failed to execute script: ${error.message}`));
      resolve(1);
    });
  });
}
