import { execSync } from "child_process";
import chalk from "chalk";

export async function checkAndInstallDependencies() {
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
