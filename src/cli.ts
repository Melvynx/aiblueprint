#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { setupCommand } from "./commands/setup.js";
import { setupTerminalCommand } from "./commands/setup-terminal.js";
import { symlinkCommand } from "./commands/symlink.js";
import { agentsUnifyCommand } from "./commands/agents-unify.js";
import { codexAgentsCommand } from "./commands/codex-agents.js";
import { sessionsUnifyCommand } from "./commands/session-unify.js";
import {
  proActivateCommand,
  proStatusCommand,
  proSetupCommand,
  proUpdateCommand,
} from "./commands/pro.js";
import { proSyncCommand } from "./commands/sync.js";
import { backupLoadCommand } from "./commands/backup.js";
import {
  configsBackupsCreateCommand,
  configsBackupsCleanCommand,
  configsBackupsListCommand,
  configsBackupsLoadCommand,
  configsListCommand,
  configsLoadCommand,
  configsSaveCommand,
  configsUndoCommand,
} from "./commands/configs.js";
import {
  openclawProActivateCommand,
  openclawProStatusCommand,
  openclawProSetupCommand,
  openclawProUpdateCommand,
} from "./commands/openclaw-pro.js";
import { registerDynamicScriptCommands } from "./commands/dynamic-scripts.js";
import { DEFAULT_BACKUP_RETENTION_DAYS, normalizeBackupRetentionDays } from "./lib/configs-store.js";
import chalk from "chalk";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";
import type { UnifiedAgentCategory } from "./lib/agents-unifier.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf8"),
);

const program = new Command();

program
  .name("aiblueprint")
  .description("AIBlueprint CLI for setting up AI coding configurations")
  .version(packageJson.version);

function readUnifyCategories(options: {
  agentsMd?: boolean;
  skills?: boolean;
  agents?: boolean;
  rules?: boolean;
}): UnifiedAgentCategory[] | undefined {
  const categories: UnifiedAgentCategory[] = [];
  if (options.agentsMd) categories.push("instructions");
  if (options.skills) categories.push("skills");
  if (options.agents) categories.push("agents");
  if (options.rules) categories.push("rules");
  return categories.length > 0 ? categories : undefined;
}

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

  cmd
    .command("unify [scope]")
    .description("Unify agent configuration into .agents (scope: global or projects/repository; default: global)")
    .option("-i, --interactive", "Choose which categories to unify")
    .option("--agents-md", "Unify instruction files into .agents/AGENTS.md")
    .option("--skills", "Unify skills")
    .option("--agents", "Unify Markdown agents")
    .option("--rules", "Unify repository rules and memories")
    .action((scope, options, command) => {
      const parentOptions = command.parent.opts();
      const requestedScope = scope ?? "global";
      const selectedScope = requestedScope === "projects" || requestedScope === "project"
        ? "repository"
        : requestedScope;

      if (selectedScope !== "global" && selectedScope !== "repository") {
        console.error(chalk.red(`Invalid unify scope: ${requestedScope}`));
        console.error(chalk.gray("Use `global`, `projects`, or `repository`."));
        process.exitCode = 1;
        return;
      }

      return agentsUnifyCommand({
        folder: parentOptions.folder ?? (selectedScope === "repository" ? process.cwd() : undefined),
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
        scope: selectedScope,
        categories: readUnifyCategories(options),
        interactive: options.interactive,
      });
    });

  cmd
    .command("codex-agents")
    .description("Render shared Markdown agents from .agents/agents into Codex TOML custom agents")
    .option("--overwrite", "Overwrite existing non-generated Codex agent files")
    .action((options, command) => {
      const parentOptions = command.parent.opts();
      return codexAgentsCommand({
        folder: parentOptions.folder,
        claudeCodeFolder: parentOptions.claudeCodeFolder,
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
        overwrite: options.overwrite,
      });
    });

  const configCmd = cmd
    .command("config")
    .description("Manage cross-tool agent configuration data");

  const configUnifyCmd = configCmd
    .command("unify")
    .description("Merge saved configuration data back into the current folders");

  configUnifyCmd
    .command("sessions")
    .description("Import saved session history from configs and backups into current .claude/.codex/.agents folders")
    .action((options, command) => {
      const folderOptions = readConfigOptions(command, options);
      return sessionsUnifyCommand(folderOptions);
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
    .description("Install premium configurations, prompting for activation if needed")
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
        codexFolder: parentOptions.codexFolder,
        agentsFolder: parentOptions.agentsFolder,
      });
    });
}

function addConfigFolderOptions(cmd: Command): Command {
  return cmd
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
    );
}

function readConfigOptions(command: Command, options: Record<string, unknown> = {}) {
  const optionChain: Array<Record<string, unknown>> = [options];
  let current: Command | null = command;

  while (current) {
    optionChain.push(current.opts());
    current = current.parent ?? null;
  }

  const findOption = (name: string): string | undefined => {
    const value = optionChain.find((opts) => opts[name] !== undefined)?.[name];
    return typeof value === "string" ? value : undefined;
  };

  return {
    folder: findOption("folder"),
    claudeCodeFolder: findOption("claudeCodeFolder"),
    codexFolder: findOption("codexFolder"),
    agentsFolder: findOption("agentsFolder"),
  };
}

function parseRetentionDays(value: string): number {
  try {
    return normalizeBackupRetentionDays(Number(value));
  } catch (error) {
    throw new InvalidArgumentError(error instanceof Error ? error.message : String(error));
  }
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

const configsCmd = addConfigFolderOptions(
  program
    .command("configs")
    .description("Save, load, undo, and inspect .claude/.codex/.agents configurations"),
);

addConfigFolderOptions(configsCmd
  .command("save <name>")
  .description("Save the current .claude, .codex, and .agents folders as a named config")
  .option("--force", "Overwrite an existing saved config with the same name"))
  .action((name, options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsSaveCommand(name, {
      ...folderOptions,
      force: options.force,
    });
  });

addConfigFolderOptions(configsCmd
  .command("load <name>")
  .description("Load a named config and backup the current folders first"))
  .action((name, options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsLoadCommand(name, {
      ...folderOptions,
    });
  });

addConfigFolderOptions(configsCmd
  .command("undo")
  .description("Undo the most recent configs load by restoring its automatic backup"))
  .action((options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsUndoCommand({
      ...folderOptions,
    });
  });

addConfigFolderOptions(configsCmd
  .command("list")
  .description("List saved named configs"))
  .action((options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsListCommand({
      ...folderOptions,
    });
  });

const configsBackupsCmd = configsCmd
  .command("backups")
  .description("Manage automatic config backups");

addConfigFolderOptions(configsBackupsCmd
  .command("list")
  .description("List automatic backups with reasons"))
  .action((options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsBackupsListCommand({
      ...folderOptions,
    });
  });

addConfigFolderOptions(configsBackupsCmd
  .command("load <name>")
  .description("Load a backup and backup the current folders first"))
  .action((name, options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsBackupsLoadCommand(name, {
      ...folderOptions,
    });
  });

addConfigFolderOptions(configsBackupsCmd
  .command("create [reason]")
  .description("Create a manual backup of the current config folders"))
  .action((reason, options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsBackupsCreateCommand(reason, {
      ...folderOptions,
    });
  });

addConfigFolderOptions(configsBackupsCmd
  .command("clean")
  .description("Delete old config backups managed by retention")
  .option("-d, --days <days>", "Delete backups older than this many days", parseRetentionDays, DEFAULT_BACKUP_RETENTION_DAYS)
  .option("--dry-run", "Show backups that would be deleted without removing them")
  .option("--include-manual", "Also delete manual backups created with configs backups create"))
  .action((options, command) => {
    const folderOptions = readConfigOptions(command, options);
    configsBackupsCleanCommand({
      ...folderOptions,
      days: options.days,
      dryRun: options.dryRun,
      includeManual: options.includeManual,
    });
  });

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
