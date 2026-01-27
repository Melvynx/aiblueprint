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
  .description("AIBlueprint CLI for setting up Claude Code configurations")
  .version(packageJson.version);

const claudeCodeCmd = program
  .command("claude-code")
  .description("Claude Code configuration commands")
  .option(
    "-f, --folder <path>",
    "Specify custom Claude Code folder path (default: ~/.claude) - alias for --claudeCodeFolder",
  )
  .option(
    "--claudeCodeFolder <path>",
    "Specify custom Claude Code folder path (default: ~/.claude)",
  )
  .option(
    "--codexFolder <path>",
    "Specify custom Codex folder path (default: ~/.codex)",
  )
  .option(
    "--openCodeFolder <path>",
    "Specify custom OpenCode folder path (default: ~/.config/opencode)",
  )
  .option(
    "--factoryAiFolder <path>",
    "Specify custom FactoryAI folder path (default: ~/.factory)",
  )
  .option("-s, --skip", "Skip interactive prompts and install all features");

claudeCodeCmd
  .command("setup")
  .description("Setup Claude Code configuration with AIBlueprint defaults")
  .action((options, command) => {
    const parentOptions = command.parent.opts();
    setupCommand({
      claudeCodeFolder: parentOptions.claudeCodeFolder || parentOptions.folder,
      skipInteractive: parentOptions.skip,
    });
  });

claudeCodeCmd
  .command("setup-terminal")
  .description("Setup terminal with Oh My ZSH, plugins, and a beautiful theme")
  .action((options, command) => {
    const parentOptions = command.parent.opts();
    setupTerminalCommand({
      skipInteractive: parentOptions.skip,
      homeDir: parentOptions.claudeCodeFolder || parentOptions.folder,
    });
  });

claudeCodeCmd
  .command("symlink")
  .description(
    "Create symlinks between different CLI tools (Claude Code, Codex, OpenCode, FactoryAI)",
  )
  .action((options, command) => {
    const parentOptions = command.parent.opts();
    symlinkCommand({
      claudeCodeFolder: parentOptions.claudeCodeFolder || parentOptions.folder,
      codexFolder: parentOptions.codexFolder,
      openCodeFolder: parentOptions.openCodeFolder,
      factoryAiFolder: parentOptions.factoryAiFolder,
    });
  });

const proCmd = claudeCodeCmd
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
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    proSetupCommand({ folder: claudeCodeFolder });
  });

proCmd
  .command("update")
  .description("Update premium configurations")
  .action((options, command) => {
    const parentOptions = command.parent.parent.opts();
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    proUpdateCommand({ folder: claudeCodeFolder });
  });

proCmd
  .command("sync")
  .description("Sync premium configurations with selective update")
  .action((options, command) => {
    const parentOptions = command.parent.parent.opts();
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    proSyncCommand({ folder: claudeCodeFolder });
  });

const backupCmd = claudeCodeCmd
  .command("backup")
  .description("Manage Claude Code configuration backups");

backupCmd
  .command("load")
  .description("Load a previous backup interactively")
  .action((options, command) => {
    const parentOptions = command.parent.parent.opts();
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    backupLoadCommand({ folder: claudeCodeFolder });
  });

// Register dynamic script commands
try {
  const claudeDir = join(homedir(), ".claude");
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
