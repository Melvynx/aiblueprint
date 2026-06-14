import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "path";
import { installProConfigs, type InstallProgressCallback } from "../lib/pro-installer.js";
import { resolveFolders, type FolderOptions } from "../lib/folder-paths.js";
import { getVersion } from "../lib/version.js";

export type ProCommandOptions = FolderOptions;
import {
  saveToken,
  getToken,
  getTokenInfo,
} from "../lib/token-storage.js";
import { setupShellShortcuts } from "./setup/shell-shortcuts.js";
import { updateSettings } from "./setup/settings.js";
import { checkAndInstallDependencies, installScriptsDependencies } from "./setup/dependencies.js";
import fs from "fs-extra";
import { trackEvent, trackError, flushTelemetry } from "../lib/telemetry.js";

const API_URL = "https://codeline.app/api/products";
const PRODUCT_IDS = ["prd_XJVgxVPbGG", "prd_NKabAkdOkw"];

type PremiumActivationData = {
  hasAccess?: boolean;
  user?: {
    name?: string;
    email?: string;
  };
  product?: {
    title?: string;
    metadata?: Record<string, string | undefined>;
  };
};

type PremiumActivationResult = {
  githubToken: string;
  data: PremiumActivationData;
};

class PremiumActivationError extends Error {
  constructor(
    public readonly code: "invalid-token" | "missing-github-token",
    message: string,
  ) {
    super(message);
    this.name = "PremiumActivationError";
  }
}

function isPremiumActivationError(error: unknown): error is PremiumActivationError {
  return error instanceof PremiumActivationError;
}

function logPremiumActivationError(error: PremiumActivationError) {
  p.log.error(error.message);
  if (error.code === "invalid-token") {
    p.log.info("💎 Get AIBlueprint CLI Premium at: https://mlv.sh/claude-cli");
  }
}

async function promptForPremiumToken(): Promise<string> {
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
    p.cancel("Premium activation cancelled");
    process.exit(0);
  }

  return result as string;
}

async function fetchPremiumActivationData(
  userToken: string,
): Promise<PremiumActivationData | null> {
  const encodedToken = encodeURIComponent(userToken);

  for (const productId of PRODUCT_IDS) {
    const response = await fetch(
      `${API_URL}/${productId}/have-access?token=${encodedToken}`,
    );

    if (response.ok) {
      const responseData = (await response.json()) as PremiumActivationData;
      if (responseData.hasAccess) {
        return responseData;
      }
    }
  }

  return null;
}

async function activatePremiumToken(userToken?: string): Promise<PremiumActivationResult> {
  const premiumToken = userToken ?? await promptForPremiumToken();

  const spinner = p.spinner();
  spinner.start("Validating token against premium products...");

  const data = await fetchPremiumActivationData(premiumToken);

  if (!data) {
    spinner.stop("Token validation failed");
    throw new PremiumActivationError(
      "invalid-token",
      "Invalid token or no access to premium products",
    );
  }

  spinner.stop("Token validated");

  const githubToken = data.product?.metadata?.["cli-github-token"];
  if (!githubToken) {
    throw new PremiumActivationError(
      "missing-github-token",
      "No GitHub token found in product metadata. Please contact support.",
    );
  }

  spinner.start("Saving token...");
  await saveToken(githubToken);
  spinner.stop("Token saved");

  return { githubToken, data };
}

async function countInstalledItems(claudeDir: string) {
  const counts = {
    agents: 0,
    skills: 0,
  };

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
    const { data } = await activatePremiumToken(userToken);

    const tokenInfo = getTokenInfo();
    p.log.success("✅ Token activated!");
    p.log.info(`User: ${data.user?.name ?? "Unknown"} (${data.user?.email ?? "unknown email"})`);
    p.log.info(`Product: ${data.product?.title ?? "Premium"}`);
    p.log.info(`Token saved to: ${tokenInfo.path}`);

    p.log.info(
      chalk.cyan(
        "\n💡 Next step: Run 'npx aiblueprint-cli@latest agents pro setup' to install premium configs",
      ),
    );

    trackEvent("pro-activate");

    p.outro(chalk.green("✅ Activation complete!"));
  } catch (error) {
    trackError(error, { command: "pro-activate" });
    await flushTelemetry();
    if (isPremiumActivationError(error)) {
      logPremiumActivationError(error);
    } else if (error instanceof Error) {
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
      p.log.info("Run: npx aiblueprint-cli@latest agents pro activate <token>");
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

export async function proSetupCommand(
  options: ProCommandOptions = {},
) {
  p.intro(chalk.blue(`⚙️  Setup AIBlueprint CLI Premium ${chalk.gray(`v${getVersion()}`)}`));

  try {
    let githubToken = await getToken();

    if (!githubToken) {
      p.log.warn("No token found");
      p.log.info("Enter your Premium access token to activate and continue setup.");
      const activation = await activatePremiumToken();
      githubToken = activation.githubToken;
      p.log.success("✅ Token activated. Continuing setup...");
    }

    const { claudeDir } = resolveFolders(options);

    const spinner = p.spinner();

    const onProgress: InstallProgressCallback = (file, type) => {
      spinner.message(`Installing: ${chalk.cyan(file)} ${chalk.gray(`(${type})`)}`);
    };

    spinner.start("Installing premium configurations...");
    await installProConfigs({
      githubToken,
      folder: options.folder,
      claudeCodeFolder: options.claudeCodeFolder,
      codexFolder: options.codexFolder,
      agentsFolder: options.agentsFolder,
      onProgress,
    });
    spinner.stop("Premium configurations installed");

    spinner.start("Checking global dependencies...");
    await checkAndInstallDependencies();
    spinner.stop("Global dependencies ready");

    spinner.start("Installing scripts dependencies...");
    await installScriptsDependencies(claudeDir);
    spinner.stop("Scripts dependencies installed");

    // Setup shell shortcuts (cc, ccc, cx, cxc)
    spinner.start("Setting up shell shortcuts...");
    await setupShellShortcuts();
    spinner.stop("Shell shortcuts configured");

    spinner.start("Updating settings.json...");
    await updateSettings(
      {
        shellShortcuts: false,
        customStatusline: true,
        aiblueprintAgents: false,
        aiblueprintSkills: false,
        installCodex: false,
      },
      claudeDir,
    );
    spinner.stop("Settings.json updated");

    spinner.start("Counting installed items...");
    const counts = await countInstalledItems(claudeDir);
    spinner.stop("Installation summary ready");

    trackEvent("pro-setup", {
      agents: counts.agents,
      skills: counts.skills,
    });

    p.log.success("✅ Setup complete!");
    p.log.info("Installed:");
    p.log.info(`  • Agents (${counts.agents})`);
    p.log.info(`  • Premium Skills (${counts.skills})`);
    p.log.info("  • Premium statusline (advanced)");
    p.log.info("  • Shell shortcuts (cc, ccc, cx, cxc)");
    p.log.info("  • Settings.json with statusline");

    p.outro(chalk.green("🚀 Ready to use!"));
  } catch (error) {
    trackError(error, { command: "pro-setup" });
    await flushTelemetry();
    if (isPremiumActivationError(error)) {
      logPremiumActivationError(error);
    } else if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Setup failed"));
    process.exit(1);
  }
}

export async function proUpdateCommand(
  options: ProCommandOptions = {},
) {
  p.intro(chalk.blue(`🔄 Update Premium Configs ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest agents pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start("Updating premium configurations...");

    await installProConfigs({
      githubToken,
      folder: options.folder,
      claudeCodeFolder: options.claudeCodeFolder,
      codexFolder: options.codexFolder,
      agentsFolder: options.agentsFolder,
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
