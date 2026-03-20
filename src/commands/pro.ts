import * as p from "@clack/prompts";
import chalk from "chalk";
import os from "os";
import path from "path";
import { installProConfigs, type InstallProgressCallback } from "../lib/pro-installer.js";
import { getVersion } from "../lib/version.js";
import {
  saveToken,
  getToken,
  hasToken,
  getTokenInfo,
} from "../lib/token-storage.js";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { updateSettings } from "./setup/settings.js";
import { checkAndInstallDependencies, installScriptsDependencies } from "./setup/dependencies.js";
import fs from "fs-extra";
import { trackEvent, trackError, flushTelemetry } from "../lib/telemetry.js";

const API_URL = "https://codeline.app/api/products";
const PRODUCT_IDS = ["prd_XJVgxVPbGG", "prd_NKabAkdOkw"];

async function countInstalledItems(claudeDir: string) {
  const counts = {
    commands: 0,
    agents: 0,
    skills: 0,
  };

  try {
    const commandsDir = path.join(claudeDir, "commands");
    if (await fs.pathExists(commandsDir)) {
      const files = await fs.readdir(commandsDir);
      counts.commands = files.filter(f => f.endsWith(".md")).length;
    }
  } catch (error) {
    console.error("Failed to count commands:", error instanceof Error ? error.message : error);
  }

  try {
    const agentsDir = path.join(claudeDir, "agents");
    if (await fs.pathExists(agentsDir)) {
      const files = await fs.readdir(agentsDir);
      counts.agents = files.filter(f => f.endsWith(".md")).length;
    }
  } catch (error) {
    console.error("Failed to count agents:", error instanceof Error ? error.message : error);
  }

  try {
    const skillsDir = path.join(claudeDir, "skills");
    if (await fs.pathExists(skillsDir)) {
      const items = await fs.readdir(skillsDir);
      const dirs = await Promise.all(
        items.map(async (item) => {
          const stat = await fs.stat(path.join(skillsDir, item));
          return stat.isDirectory();
        })
      );
      counts.skills = dirs.filter(Boolean).length;
    }
  } catch (error) {
    console.error("Failed to count skills:", error instanceof Error ? error.message : error);
  }

  return counts;
}

export async function proActivateCommand(userToken?: string) {
  p.intro(chalk.blue(`🔑 Activate AIBlueprint CLI Premium ${chalk.gray(`v${getVersion()}`)}`));

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
    spinner.start("Validating token against premium products...");

    let validationSuccess = false;
    let data: any = null;

    for (const productId of PRODUCT_IDS) {
      const response = await fetch(
        `${API_URL}/${productId}/have-access?token=${userToken}`,
      );

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.hasAccess) {
          data = responseData;
          validationSuccess = true;
          break;
        }
      }
    }

    if (!validationSuccess || !data) {
      spinner.stop("Token validation failed");
      p.log.error("Invalid token or no access to premium products");
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
        "\n💡 Next step: Run 'npx aiblueprint-cli@latest claude-code pro setup' to install premium configs",
      ),
    );

    trackEvent("pro-activate");

    p.outro(chalk.green("✅ Activation complete!"));
  } catch (error) {
    trackError(error, { command: "pro-activate" });
    await flushTelemetry();
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Activation failed"));
    process.exit(1);
  }
}

export async function proStatusCommand() {
  p.intro(chalk.blue(`📊 Premium Token Status ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const token = await getToken();

    if (!token) {
      p.log.warn("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest claude-code pro activate <token>");
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
  p.intro(chalk.blue(`⚙️  Setup AIBlueprint CLI Premium ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest claude-code pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const claudeDir = options.folder
      ? path.resolve(options.folder)
      : path.join(os.homedir(), ".claude");

    const spinner = p.spinner();

    const onProgress: InstallProgressCallback = (file, type) => {
      spinner.message(`Installing: ${chalk.cyan(file)} ${chalk.gray(`(${type})`)}`);
    };

    spinner.start("Installing premium configurations...");
    await installProConfigs({
      githubToken,
      claudeCodeFolder: claudeDir,
      onProgress,
    });
    spinner.stop("Premium configurations installed");

    spinner.start("Checking global dependencies...");
    await checkAndInstallDependencies();
    spinner.stop("Global dependencies ready");

    spinner.start("Installing scripts dependencies...");
    await installScriptsDependencies(claudeDir);
    spinner.stop("Scripts dependencies installed");

    // Setup shell shortcuts (cc, ccc)
    spinner.start("Setting up shell shortcuts...");
    await setupShellShortcuts();
    spinner.stop("Shell shortcuts configured");

    // Step 4: Update settings.json with hooks and statusline
    spinner.start("Updating settings.json...");
    await updateSettings(
      {
        shellShortcuts: false,
        commandValidation: true,
        customStatusline: true,
        aiblueprintCommands: false,
        aiblueprintAgents: false,
        aiblueprintSkills: false,
        notificationSounds: true,
        codexSymlink: false,
        openCodeSymlink: false,
      },
      claudeDir,
    );
    spinner.stop("Settings.json updated");

    spinner.start("Counting installed items...");
    const counts = await countInstalledItems(claudeDir);
    spinner.stop("Installation summary ready");

    trackEvent("pro-setup", {
      commands: counts.commands,
      agents: counts.agents,
      skills: counts.skills,
    });

    p.log.success("✅ Setup complete!");
    p.log.info("Installed:");
    p.log.info(`  • Commands (${counts.commands})`);
    p.log.info(`  • Agents (${counts.agents})`);
    p.log.info(`  • Premium Skills (${counts.skills})`);
    p.log.info("  • Premium statusline (advanced)");
    p.log.info("  • Shell shortcuts (cc, ccc)");
    p.log.info("  • Settings.json with hooks and statusline");

    p.outro(chalk.green("🚀 Ready to use!"));
  } catch (error) {
    trackError(error, { command: "pro-setup" });
    await flushTelemetry();
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Setup failed"));
    process.exit(1);
  }
}

export async function proUpdateCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue(`🔄 Update Premium Configs ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest claude-code pro activate <token>");
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

    trackEvent("pro-update");

    p.outro(chalk.green("✅ Update completed"));
  } catch (error) {
    trackError(error, { command: "pro-update" });
    await flushTelemetry();
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Update failed"));
    process.exit(1);
  }
}
