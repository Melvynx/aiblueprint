import * as p from "@clack/prompts";
import chalk from "chalk";
import os from "os";
import path from "path";
import { installOpenclawProConfigs, type InstallProgressCallback } from "../lib/openclaw-installer.js";
import { getVersion } from "../lib/version.js";
import {
  saveOpenclawToken,
  getOpenclawToken,
  getOpenclawTokenInfo,
} from "../lib/openclaw-token-storage.js";
import fs from "fs-extra";

const API_URL = "https://codeline.app/api/products";
const OPENCLAW_PRODUCT_ID = "prd_t2GRwX3aH1";

const CLAUDE_CODE_TOOLS_INSTRUCTIONS = `
## Claude Code (CLI)

Claude Code requires a TTY for interactive mode. When running in Docker or via exec without a PTY, use the \`script\` wrapper to simulate a TTY.

### Usage Pattern

\`\`\`bash
# ALWAYS use this pattern to run Claude Code:
script -q -c "claude -p 'your prompt here' --output-format json" /dev/null

# Examples:
script -q -c "claude -p 'What is 4+4?' --output-format json" /dev/null
script -q -c "claude -p 'Explain this error: connection refused' --output-format json" /dev/null
\`\`\`

### Why?

Claude Code uses Ink (React for terminal) which requires \`stdin.setRawMode()\`. Without a TTY, this fails silently. The \`script\` command allocates a pseudo-TTY.

### Wrapper Script

A wrapper is available at \`/usr/local/bin/claude-run\`:

\`\`\`bash
claude-run "your prompt here"
\`\`\`

### Important

- NEVER run \`claude -p "..."\` directly - it will hang or fail silently
- ALWAYS use the \`script\` wrapper or \`claude-run\`
- Use \`--output-format json\` for structured output
`.trim();

export async function openclawProActivateCommand(userToken?: string) {
  p.intro(chalk.blue(`🔑 Activate OpenClaw Pro ${chalk.gray(`v${getVersion()}`)}`));

  try {
    if (!userToken) {
      const result = await p.text({
        message: "Enter your OpenClaw Pro access token:",
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

    const response = await fetch(
      `${API_URL}/${OPENCLAW_PRODUCT_ID}/have-access?token=${userToken}`
    );

    if (!response.ok) {
      spinner.stop("Token validation failed");
      p.log.error("Invalid token or no access");
      p.log.info("Get OpenClaw Pro at: https://codeline.app");
      p.outro(chalk.red("❌ Activation failed"));
      process.exit(1);
    }

    const data = await response.json();

    if (!data.hasAccess) {
      spinner.stop("Token validation failed");
      p.log.error("No access to OpenClaw Pro");
      p.outro(chalk.red("❌ Activation failed"));
      process.exit(1);
    }

    spinner.stop("Token validated");

    const githubToken = data.product.metadata?.["cli-github-token"];
    if (!githubToken) {
      p.log.error("No GitHub token found in product metadata. Contact support.");
      p.outro(chalk.red("❌ Activation failed"));
      process.exit(1);
    }

    spinner.start("Saving token...");
    await saveOpenclawToken(githubToken);
    spinner.stop("Token saved");

    const tokenInfo = getOpenclawTokenInfo();
    p.log.success("✅ Token activated!");
    p.log.info(`User: ${data.user.name} (${data.user.email})`);
    p.log.info(`Product: ${data.product.title}`);
    p.log.info(`Token saved to: ${tokenInfo.path}`);

    p.log.info(
      chalk.cyan("\n💡 Next step: Run 'npx aiblueprint-cli@latest openclaw pro setup'")
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

export async function openclawProStatusCommand() {
  p.intro(chalk.blue(`📊 OpenClaw Pro Status ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const token = await getOpenclawToken();

    if (!token) {
      p.log.warn("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest openclaw pro activate <token>");
      p.outro(chalk.yellow("⚠️  Not activated"));
      process.exit(0);
    }

    const tokenInfo = getOpenclawTokenInfo();
    p.log.success("✅ Token active");
    p.log.info(`Token file: ${tokenInfo.path}`);

    p.outro(chalk.green("Token is saved"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Failed to check status"));
    process.exit(1);
  }
}

export async function openclawProSetupCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue(`⚙️  Setup OpenClaw Pro ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getOpenclawToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest openclaw pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const openclawDir = options.folder
      ? path.resolve(options.folder)
      : path.join(os.homedir(), ".openclaw");

    const spinner = p.spinner();

    const onProgress: InstallProgressCallback = (file, type) => {
      spinner.message(`Installing: ${chalk.cyan(file)} ${chalk.gray(`(${type})`)}`);
    };

    spinner.start("Installing OpenClaw Pro configurations...");
    await installOpenclawProConfigs({
      githubToken,
      openclawFolder: openclawDir,
      onProgress,
    });
    spinner.stop("OpenClaw Pro configurations installed");

    let skillCount = 0;
    const skillsDir = path.join(openclawDir, "skills");
    if (await fs.pathExists(skillsDir)) {
      const items = await fs.readdir(skillsDir);
      const dirs = await Promise.all(
        items.map(async (item) => {
          const stat = await fs.stat(path.join(skillsDir, item));
          return stat.isDirectory();
        })
      );
      skillCount = dirs.filter(Boolean).length;
    }

    spinner.start("Setting up workspace TOOLS.md...");
    const workspaceDir = path.join(openclawDir, "workspace");
    const toolsPath = path.join(workspaceDir, "TOOLS.md");
    await fs.ensureDir(workspaceDir);

    if (await fs.pathExists(toolsPath)) {
      const existingContent = await fs.readFile(toolsPath, "utf-8");
      if (!existingContent.includes("Claude Code (CLI)")) {
        await fs.appendFile(toolsPath, "\n\n" + CLAUDE_CODE_TOOLS_INSTRUCTIONS);
        spinner.stop("TOOLS.md updated with Claude Code instructions");
      } else {
        spinner.stop("TOOLS.md already has Claude Code instructions");
      }
    } else {
      const defaultToolsMd = `# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

${CLAUDE_CODE_TOOLS_INSTRUCTIONS}
`;
      await fs.writeFile(toolsPath, defaultToolsMd);
      spinner.stop("TOOLS.md created with Claude Code instructions");
    }

    spinner.start("Creating claude-run wrapper...");
    const claudeRunWrapper = `#!/bin/bash
# Claude Code wrapper that handles TTY requirement
# Usage: claude-run "your prompt here"

if [ -z "$1" ]; then
  echo "Usage: claude-run 'your prompt'"
  exit 1
fi

script -q -c "claude -p '$1' --output-format json" /dev/null
`;
    const binDir = "/usr/local/bin";
    const wrapperPath = path.join(binDir, "claude-run");
    try {
      await fs.writeFile(wrapperPath, claudeRunWrapper, { mode: 0o755 });
      spinner.stop("claude-run wrapper created");
    } catch {
      spinner.stop("claude-run wrapper skipped (no write access to /usr/local/bin)");
    }

    p.log.success("✅ Setup complete!");
    p.log.info("Installed:");
    p.log.info(`  • Skills (${skillCount})`);
    p.log.info(`  • IDENTITY.md`);
    p.log.info(`  • TOOLS.md (Claude Code instructions)`);

    p.log.info(chalk.cyan("\n💡 Skills installed to: " + skillsDir));

    p.outro(chalk.green("🚀 OpenClaw Pro ready!"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Setup failed"));
    process.exit(1);
  }
}

export async function openclawProUpdateCommand(options: { folder?: string } = {}) {
  p.intro(chalk.blue(`🔄 Update OpenClaw Pro ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getOpenclawToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest openclaw pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const spinner = p.spinner();
    spinner.start("Updating OpenClaw Pro configurations...");

    await installOpenclawProConfigs({
      githubToken,
      openclawFolder: options.folder,
    });

    spinner.stop("OpenClaw Pro configurations updated");
    p.outro(chalk.green("✅ Update completed"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Update failed"));
    process.exit(1);
  }
}
