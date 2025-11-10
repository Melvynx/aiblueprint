import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { installProConfigs } from "../lib/pro-installer.js";

const LICENSE_FILE = path.join(os.homedir(), ".aiblueprint", "license.json");
const API_URL = "https://codeline.app/api/products";
const PRODUCT_ID = "cli-pro"; // You can make this configurable

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

export async function proActivateCommand(
  token?: string,
  options: { folder?: string } = {},
) {
  p.intro(chalk.blue("🔑 Activate AIBlueprint Pro"));

  try {
    // If token not provided as argument, ask for it
    if (!token) {
      const result = await p.text({
        message: "Enter your Pro access token:",
        placeholder: "Your ProductsOnUsers ID from codeline.app",
        validate: (value) => {
          if (!value) return "Token is required";
          if (value.length < 5) return "Token seems invalid";
          return;
        },
      });

      if (p.isCancel(result)) {
        p.cancel("Activation cancelled");
        process.exit(0);
      }

      token = result as string;
    }

    const spinner = p.spinner();
    spinner.start("Validating token...");

    // Call API to validate token
    const response = await fetch(
      `${API_URL}/${PRODUCT_ID}/have-access?token=${token}`,
    );

    if (!response.ok) {
      spinner.stop("Failed to validate token");
      p.log.error(
        `API error: ${response.status} ${response.statusText}`,
      );
      p.outro(
        chalk.red("❌ Failed to activate. Please check your token and try again."),
      );
      process.exit(1);
    }

    const data = await response.json();

    if (!data.hasAccess) {
      spinner.stop("Token validation failed");
      p.log.error(data.error || "Invalid token");
      p.log.info("💎 Get AIBlueprint Pro at: https://codeline.app/pro");
      p.outro(chalk.red("❌ Activation failed"));
      process.exit(1);
    }

    spinner.stop("Token validated");

    // Check if GitHub token exists in metadata
    const githubToken = data.product.metadata?.["cli-github-token"];
    if (!githubToken) {
      p.log.error(
        "No GitHub token found in product metadata. Please contact support.",
      );
      p.outro(chalk.red("❌ Activation failed"));
      process.exit(1);
    }

    // Save license locally
    await fs.ensureDir(path.dirname(LICENSE_FILE));
    const licenseData: LicenseData = {
      token,
      productId: data.product.id,
      user: data.user,
      product: data.product,
      activatedAt: new Date().toISOString(),
    };
    await fs.writeJSON(LICENSE_FILE, licenseData, { spaces: 2 });

    p.log.success("License activated!");
    p.log.info(`User: ${data.user.name} (${data.user.email})`);
    p.log.info(`Product: ${data.product.title}`);

    // Install premium configs
    spinner.start("Installing premium configurations...");

    try {
      await installProConfigs({
        githubToken,
        claudeCodeFolder: options.folder,
      });
      spinner.stop("Premium configurations installed");
    } catch (error) {
      spinner.stop("Failed to install premium configs");
      if (error instanceof Error) {
        p.log.error(error.message);
      }
      p.outro(
        chalk.yellow(
          "⚠️  License activated but premium installation failed. Try running: aiblueprint claude-code pro update",
        ),
      );
      process.exit(1);
    }

    p.outro(chalk.green("✅ AIBlueprint Pro activated successfully!"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Activation failed"));
    process.exit(1);
  }
}

export async function proStatusCommand() {
  p.intro(chalk.blue("📊 Pro License Status"));

  try {
    if (!(await fs.pathExists(LICENSE_FILE))) {
      p.log.warn("No active license found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.log.info("Get your token at: https://codeline.app/pro");
      p.outro(chalk.yellow("⚠️  No license"));
      process.exit(0);
    }

    const license: LicenseData = await fs.readJSON(LICENSE_FILE);

    // Validate license online
    const spinner = p.spinner();
    spinner.start("Validating license...");

    const response = await fetch(
      `${API_URL}/${license.productId}/have-access?token=${license.token}`,
    );

    if (!response.ok || !(await response.json()).hasAccess) {
      spinner.stop("License validation failed");
      p.log.error("Your license is no longer valid");
      p.log.info("Please reactivate: aiblueprint claude-code pro activate");
      p.outro(chalk.red("❌ Invalid license"));
      process.exit(1);
    }

    spinner.stop("License validated");

    p.log.success("✅ Pro license active");
    p.log.info(`User: ${license.user.name} (${license.user.email})`);
    p.log.info(`Product: ${license.product.title}`);
    p.log.info(
      `Activated: ${new Date(license.activatedAt).toLocaleDateString()}`,
    );

    p.outro(chalk.green("License is valid"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Failed to check status"));
    process.exit(1);
  }
}

export async function proUpdateCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue("🔄 Update Premium Configs"));

  try {
    if (!(await fs.pathExists(LICENSE_FILE))) {
      p.log.error("No active license found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.outro(chalk.red("❌ No license"));
      process.exit(1);
    }

    const license: LicenseData = await fs.readJSON(LICENSE_FILE);

    const githubToken = license.product.metadata?.["cli-github-token"];
    if (!githubToken) {
      p.log.error("No GitHub token found in license");
      p.outro(chalk.red("❌ Invalid license data"));
      process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start("Updating premium configurations...");

    await installProConfigs({
      githubToken,
      claudeCodeFolder: options.folder,
    });

    spinner.stop("Premium configurations updated");
    p.outro(chalk.green("✅ Update completed"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Update failed"));
    process.exit(1);
  }
}
