#!/usr/bin/env node
import { Command } from "commander";
import { setupCommand } from "./commands/setup.js";
import { setupTerminalCommand } from "./commands/setup-terminal.js";
import { symlinkCommand } from "./commands/symlink.js";
import {
  proActivateCommand,
  proStatusCommand,
  proSetupCommand,
  proUpdateCommand,
} from "./commands/pro.js";
import { proSyncCommand } from "./commands/sync.js";
import { backupLoadCommand } from "./commands/backup.js";
import {
  openclawProActivateCommand,
  openclawProStatusCommand,
  openclawProSetupCommand,
  openclawProUpdateCommand,
} from "./commands/openclaw-pro.js";
import { registerDynamicScriptCommands } from "./commands/dynamic-scripts.js";
import chalk from "chalk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8"),
);

const program = new Command();

program
  .name("aiblueprint")
  .description("AIBlueprint CLI for setting up AI coding configurations")
  .version(packageJson.version);

function registerAgentsCommands(cmd: Command) {
  cmd
    .option(
      "-f, --folder <path>",
      "Root folder that contains .claude/, .codex/, .agents/ (default: $HOME)",
    )
    .option(
      "--claudeCodeFolder <path>",
      "Override Claude Code folder (default: {folder}/.claude)",
    )
    .option(
      "--codexFolder <path>",
      "Override Codex folder (default: {folder}/.codex)",
    )
    .option(
      "--agentsFolder <path>",
      "Override shared agents folder (default: {folder}/.agents)",
    )
    .option("-s, --skip", "Skip interactive prompts and install all features");

  cmd
    .command("setup")
    .description("Setup AI coding configuration with AIBlueprint defaults")
    .action((options, command) => {
      const parentOptions = command.parent.opts();
      setupCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
        skipInteractive: parentOptions.skip,
      });
    });

  cmd
    .command("setup-terminal")
    .description("Setup terminal with Oh My ZSH, plugins, and a beautiful theme")
    .action((options, command) => {
      const parentOptions = command.parent.opts();
      setupTerminalCommand({
        skipInteractive: parentOptions.skip,
        homeDir: parentOptions.folder,
      });
    });

  cmd
    .command("symlink")
    .description(
      "Create symlinks between different AI coding tools (Claude Code, Codex, OpenCode, FactoryAI)",
    )
    .action((options, command) => {
      const parentOptions = command.parent.opts();
      symlinkCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
      });
    });

  const proCmd = cmd
    .command("pro")
    .description("Manage AIBlueprint CLI Premium features");

  proCmd
    .command("activate [token]")
    .description("Activate AIBlueprint CLI Premium with your access token")
    .action((token) => {
      proActivateCommand(token);
    });

  proCmd
    .command("status")
    .description("Check your Premium token status")
    .action(() => {
      proStatusCommand();
    });

  proCmd
    .command("setup")
    .description("Install premium configurations (requires activation)")
    .action((options, command) => {
      const parentOptions = command.parent.parent.opts();
      proSetupCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
      });
    });

  proCmd
    .command("update")
    .description("Update premium configurations")
    .action((options, command) => {
      const parentOptions = command.parent.parent.opts();
      proUpdateCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
      });
    });

  proCmd
    .command("sync")
    .description("Sync premium configurations with selective update")
    .action((options, command) => {
      const parentOptions = command.parent.parent.opts();
      proSyncCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
      });
    });

  const backupCmd = cmd
    .command("backup")
    .description("Manage AI coding configuration backups");

  backupCmd
    .command("load")
    .description("Load a previous backup interactively")
    .action((options, command) => {
      const parentOptions = command.parent.parent.opts();
      backupLoadCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        agentsFolder: parentOptions.agentsFolder,
      });
    });
}

const agentsCmd = program
  .command("agents")
  .description("AI coding configuration commands");

registerAgentsCommands(agentsCmd);

const aiCodingCmd = program
  .command("ai-coding")
  .description("Legacy alias for agents configuration commands");

registerAgentsCommands(aiCodingCmd);

const claudeCodeCmd = program
  .command("claude-code")
  .description("Legacy alias for agents configuration commands");

registerAgentsCommands(claudeCodeCmd);

// ============================================
// OPENCLAW DOMAIN
// ============================================
const openclawCmd = program
  .command("openclaw")
  .description("OpenClaw configuration commands")
  .option(
    "-f, --folder <path>",
    "Specify custom OpenClaw folder path (default: ~/.openclaw)"
  );

const openclawProCmd = openclawCmd
  .command("pro")
  .description("Manage OpenClaw Pro features");

openclawProCmd
  .command("activate [token]")
  .description("Activate OpenClaw Pro with your access token")
  .action((token) => {
    openclawProActivateCommand(token);
  });

openclawProCmd
  .command("status")
  .description("Check your OpenClaw Pro token status")
  .action(() => {
    openclawProStatusCommand();
  });

openclawProCmd
  .command("setup")
  .description("Install OpenClaw Pro configurations (requires activation)")
  .action((options, command) => {
    const parentOptions = command.parent.parent.opts();
    const folder = parentOptions.folder;
    openclawProSetupCommand({ folder });
  });

openclawProCmd
  .command("update")
  .description("Update OpenClaw Pro configurations")
  .action((options, command) => {
    const parentOptions = command.parent.parent.opts();
    const folder = parentOptions.folder;
    openclawProUpdateCommand({ folder });
  });

// Register dynamic script commands
try {
  const claudeDir = join(homedir(), ".claude");
  await registerDynamicScriptCommands(agentsCmd, claudeDir);
  await registerDynamicScriptCommands(aiCodingCmd, claudeDir);
  await registerDynamicScriptCommands(claudeCodeCmd, claudeDir);
} catch (error) {
  if (process.env.DEBUG) {
    console.error("Failed to register dynamic commands:", error);
  }
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(chalk.blue("🚀 AIBlueprint CLI"));
  console.log(chalk.gray("Use --help for usage information"));
}
