import * as p from "@clack/prompts";
import chalk from "chalk";
import { installProConfigs } from "../lib/pro-installer.js";
import { installBasicConfigs } from "../lib/setup-helper.js";
import {
  saveToken,
  getToken,
  hasToken,
  getTokenInfo,
} from "../lib/token-storage.js";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { updateSettings } from "./setup/settings.js";

const API_URL = "https://codeline.app/api/products";
const PRODUCT_ID = "prd_XJVgxVPbGG";

export async function proActivateCommand(userToken?: string) {
  p.intro(chalk.blue("🔑 Activate AIBlueprint CLI Premium"));

  try {
    // If token not provided as argument, ask for it
    if (!userToken) {
      const result = await p.text({
        message: "Enter your Premium access token:",
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

      userToken = result as string;
    }

    const spinner = p.spinner();
    spinner.start("Validating token...");

    // Call API to validate token
    const response = await fetch(
      `${API_URL}/${PRODUCT_ID}/have-access?token=${userToken}`,
    );

    if (!response.ok) {
      spinner.stop("Failed to validate token");
      p.log.error(`API error: ${response.status} ${response.statusText}`);
      p.outro(
        chalk.red("❌ Failed to activate. Please check your token and try again."),
      );
      process.exit(1);
    }

    const data = await response.json();

    if (!data.hasAccess) {
      spinner.stop("Token validation failed");
      p.log.error(data.error || "Invalid token");
      p.log.info("💎 Get AIBlueprint CLI Premium at: https://mlv.sh/claude-cli");
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

    // Save GitHub token to config file
    spinner.start("Saving token...");
    await saveToken(githubToken);
    spinner.stop("Token saved");

    const tokenInfo = getTokenInfo();
    p.log.success("✅ Token activated!");
    p.log.info(`User: ${data.user.name} (${data.user.email})`);
    p.log.info(`Product: ${data.product.title}`);
    p.log.info(`Token saved to: ${tokenInfo.path}`);

    p.log.info(
      chalk.cyan(
        "\n💡 Next step: Run 'aiblueprint claude-code pro setup' to install premium configs",
      ),
    );

    p.outro(chalk.green("✅ Activation complete!"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Activation failed"));
    process.exit(1);
  }
}

export async function proStatusCommand() {
  p.intro(chalk.blue("📊 Premium Token Status"));

  try {
    const token = await getToken();

    if (!token) {
      p.log.warn("No token found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.log.info("Get your token at: https://mlv.sh/claude-cli");
      p.outro(chalk.yellow("⚠️  Not activated"));
      process.exit(0);
    }

    const tokenInfo = getTokenInfo();
    p.log.success("✅ Token active");
    p.log.info(`Token file: ${tokenInfo.path}`);
    p.log.info(`Platform: ${tokenInfo.platform}`);

    p.outro(chalk.green("Token is saved"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Failed to check status"));
    process.exit(1);
  }
}

export async function proSetupCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue("⚙️  Setup AIBlueprint CLI Premium"));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const spinner = p.spinner();

    // Step 1: Install free configs (commands, agents ONLY - skip free statusline)
    spinner.start("Installing free configurations...");
    const claudeDir = await installBasicConfigs(
      { claudeCodeFolder: options.folder },
      true, // Skip free statusline
    );
    spinner.stop("Free configurations installed");

    // Step 2: Install premium configs (commands, agents, statusline PREMIUM)
    spinner.start("Installing premium configurations...");
    await installProConfigs({
      githubToken,
      claudeCodeFolder: claudeDir,
    });
    spinner.stop("Premium configurations installed");

    // Step 3: Setup shell shortcuts (cc, ccc)
    spinner.start("Setting up shell shortcuts...");
    await setupShellShortcuts();
    spinner.stop("Shell shortcuts configured");

    // Step 4: Update settings.json with hooks and statusline
    spinner.start("Updating settings.json...");
    await updateSettings(
      {
        commandValidation: true,
        customStatusline: true,
        notificationSounds: true,
        postEditTypeScript: true,
      },
      claudeDir,
    );
    spinner.stop("Settings.json updated");

    p.log.success("✅ Setup complete!");
    p.log.info("Installed:");
    p.log.info("  • Free commands + Premium commands");
    p.log.info("  • Free agents + Premium agents");
    p.log.info("  • Premium statusline ONLY (advanced)");
    p.log.info("  • Shell shortcuts (cc, ccc)");
    p.log.info("  • Settings.json with hooks and statusline");

    p.outro(chalk.green("🚀 Ready to use!"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Setup failed"));
    process.exit(1);
  }
}

export async function proUpdateCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue("🔄 Update Premium Configs"));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
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
