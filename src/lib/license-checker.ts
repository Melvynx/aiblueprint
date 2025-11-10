import fs from "fs-extra";
import os from "os";
import path from "path";
import chalk from "chalk";

const LICENSE_FILE = path.join(os.homedir(), ".aiblueprint", "license.json");
const API_URL = "https://codeline.app/api/products";

interface LicenseData {
  token: string;
  productId: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
    metadata: {
      "cli-github-token"?: string;
    };
  };
  activatedAt: string;
}

/**
 * Check if user has a valid Pro license
 * This function will exit the process if no valid license is found
 * Uses local cache, no API call for performance
 */
export async function requireProLicense(): Promise<LicenseData> {
  if (!(await fs.pathExists(LICENSE_FILE))) {
    console.error(chalk.red("❌ This feature requires AIBlueprint Pro"));
    console.log(
      chalk.yellow(
        "Run: aiblueprint claude-code pro activate <token>",
      ),
    );
    console.log(
      chalk.gray("Get your token at: https://codeline.app/pro"),
    );
    process.exit(1);
  }

  const license: LicenseData = await fs.readJSON(LICENSE_FILE);

  // Validate that the license has required data
  if (!license.token || !license.product?.metadata?.["cli-github-token"]) {
    console.error(chalk.red("❌ Invalid license data"));
    console.log(
      chalk.yellow("Please reactivate: aiblueprint claude-code pro activate"),
    );
    process.exit(1);
  }

  return license;
}

/**
 * Check if user has a Pro license without exiting
 * Returns true if user has a valid license, false otherwise
 * Uses local cache only for performance
 */
export async function hasProLicense(): Promise<boolean> {
  try {
    if (!(await fs.pathExists(LICENSE_FILE))) {
      return false;
    }

    const license: LicenseData = await fs.readJSON(LICENSE_FILE);

    // Check if license has required data
    return !!(license.token && license.product?.metadata?.["cli-github-token"]);
  } catch (error) {
    return false;
  }
}

/**
 * Get license data without validation
 * Returns null if no license file exists
 */
export async function getLicense(): Promise<LicenseData | null> {
  if (!(await fs.pathExists(LICENSE_FILE))) {
    return null;
  }

  try {
    return await fs.readJSON(LICENSE_FILE);
  } catch (error) {
    return null;
  }
}
