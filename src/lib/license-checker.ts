import chalk from "chalk";
import { getToken, hasToken } from "./token-storage.js";

/**
 * Check if user has activated premium (has token)
 * This function will exit the process if no token is found
 */
export async function requireProLicense(): Promise<string> {
  const token = await getToken();

  if (!token) {
    console.error(chalk.red("❌ This feature requires AIBlueprint CLI Premium"));
    console.log(
      chalk.yellow(
        "Run: aiblueprint claude-code pro activate <token>",
      ),
    );
    console.log(
      chalk.gray("Get your token at: https://mlv.sh/claude-cli"),
    );
    process.exit(1);
  }

  return token;
}

/**
 * Check if user has activated premium without exiting
 * Returns true if token exists, false otherwise
 */
export async function hasProLicense(): Promise<boolean> {
  return await hasToken();
}
