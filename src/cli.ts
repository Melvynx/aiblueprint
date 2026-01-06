#!/usr/bin/env node
import { Command } from "commander";
import { setupCommand } from "./commands/setup.js";
import { addHookCommand } from "./commands/addHook.js";
import { addCommandCommand } from "./commands/addCommand.js";
import { symlinkCommand } from "./commands/symlink.js";
import { statuslineCommand } from "./commands/statusline.js";
import {
  proActivateCommand,
  proStatusCommand,
  proSetupCommand,
  proUpdateCommand,
} from "./commands/pro.js";
import { proSyncCommand } from "./commands/sync.js";
import chalk from "chalk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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
      codexFolder: parentOptions.codexFolder,
      openCodeFolder: parentOptions.openCodeFolder,
      skipInteractive: parentOptions.skip,
    });
  });

const addCmd = claudeCodeCmd
  .command("add")
  .description(
    "Add components to your Claude Code configuration\n" +
      "Examples:\n" +
      "  aiblueprint claude-code add hook post-edit-typescript\n" +
      "  aiblueprint claude-code add commands\n" +
      "  aiblueprint claude-code add commands commit",
  );

addCmd
  .command("hook <type>")
  .description(
    "Add a hook to your Claude Code configuration. Available types: post-edit-typescript",
  )
  .action((type, options, command) => {
    const parentOptions = command.parent.parent.opts();
    const claudeCodeFolder =
      parentOptions.claudeCodeFolder || parentOptions.folder;
    addHookCommand(type, { folder: claudeCodeFolder });
  });

addCmd
  .command("commands [command-name]")
  .description(
    "Install a Claude Code command or list all available commands (use without argument to list)",
  )
  .action((commandName, options, command) => {
    const parentOptions = command.parent.parent.opts();
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    addCommandCommand(commandName, { folder: claudeCodeFolder });
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

claudeCodeCmd
  .command("statusline")
  .description("Setup custom statusline with git status, costs, and token usage")
  .action((options, command) => {
    const parentOptions = command.parent.opts();
    const claudeCodeFolder = parentOptions.claudeCodeFolder || parentOptions.folder;
    statuslineCommand({ folder: claudeCodeFolder });
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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(chalk.blue("🚀 AIBlueprint CLI"));
  console.log(chalk.gray("Use --help for usage information"));
}
