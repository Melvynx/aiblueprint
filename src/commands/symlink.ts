import inquirer from "inquirer";
import chalk from "chalk";
import {
  getToolPaths,
  createSymlink,
  type ToolType,
  type ContentType,
} from "./setup/symlinks.js";

export interface SymlinkCommandParams {
  claudeCodeFolder?: string;
  codexFolder?: string;
  openCodeFolder?: string;
  factoryAiFolder?: string;
}

interface ToolConfig {
  name: string;
  value: ToolType;
  supportsCommands: boolean;
  supportsAgents: boolean;
}

const TOOLS: ToolConfig[] = [
  {
    name: "Claude Code",
    value: "claude-code",
    supportsCommands: true,
    supportsAgents: true,
  },
  {
    name: "Codex",
    value: "codex",
    supportsCommands: true,
    supportsAgents: false,
  },
  {
    name: "OpenCode",
    value: "opencode",
    supportsCommands: true,
    supportsAgents: false,
  },
  {
    name: "FactoryAI",
    value: "factoryai",
    supportsCommands: true,
    supportsAgents: true,
  },
];

interface DestinationChoice {
  name: string;
  value: string;
  tool: ToolType;
  contentType: ContentType;
}

export async function symlinkCommand(params: SymlinkCommandParams = {}) {
  try {
    console.log(chalk.blue.bold("\n🔗 Symlink Manager\n"));
    console.log(
      chalk.gray("Create symlinks between different CLI tool configurations"),
    );

    const sourceAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "source",
        message: "Select source tool:",
        choices: TOOLS.map((tool) => ({
          name: tool.name,
          value: tool.value,
        })),
      },
    ]);

    const sourceTool = sourceAnswer.source as ToolType;
    const sourceConfig = TOOLS.find((t) => t.value === sourceTool)!;

    const contentTypeChoices: Array<{ name: string; value: string }> = [];
    if (sourceConfig.supportsCommands) {
      contentTypeChoices.push({ name: "Commands only", value: "commands" });
    }
    if (sourceConfig.supportsAgents) {
      contentTypeChoices.push({ name: "Agents only", value: "agents" });
    }
    if (sourceConfig.supportsCommands && sourceConfig.supportsAgents) {
      contentTypeChoices.push({ name: "Both", value: "both" });
    }

    if (contentTypeChoices.length === 0) {
      console.log(
        chalk.red(
          `\n❌ Error: ${sourceConfig.name} doesn't support any syncable content`,
        ),
      );
      process.exit(1);
    }

    const contentAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "contentType",
        message: "What would you like to sync?",
        choices: contentTypeChoices,
      },
    ]);

    const syncType = contentAnswer.contentType as "commands" | "agents" | "both";
    const syncCommands = syncType === "commands" || syncType === "both";
    const syncAgents = syncType === "agents" || syncType === "both";

    const destinationChoices: DestinationChoice[] = [];

    for (const tool of TOOLS) {
      if (tool.value === sourceTool) continue;

      if (syncCommands && tool.supportsCommands) {
        destinationChoices.push({
          name: syncAgents
            ? `${tool.name} (commands)`
            : tool.name,
          value: `${tool.value}-commands`,
          tool: tool.value,
          contentType: "commands",
        });
      }

      if (syncAgents && tool.supportsAgents) {
        destinationChoices.push({
          name: syncCommands
            ? `${tool.name} (agents)`
            : tool.name,
          value: `${tool.value}-agents`,
          tool: tool.value,
          contentType: "agents",
        });
      }
    }

    if (destinationChoices.length === 0) {
      console.log(
        chalk.yellow(
          "\n⚠️  No compatible destination tools found for the selected sync type",
        ),
      );
      process.exit(0);
    }

    const destinationAnswer = await inquirer.prompt([
      {
        type: "checkbox",
        name: "destinations",
        message: "Select destination tools (multi-select):",
        choices: destinationChoices.map((choice) => ({
          name: choice.name,
          value: choice.value,
          checked: false,
        })),
        validate: (answer) => {
          if (answer.length === 0) {
            return "Please select at least one destination";
          }
          return true;
        },
      },
    ]);

    const selectedDestinations = destinationAnswer.destinations as string[];

    const customFolders = {
      "claude-code": params.claudeCodeFolder,
      codex: params.codexFolder,
      opencode: params.openCodeFolder,
      factoryai: params.factoryAiFolder,
    };

    const sourcePaths = await getToolPaths(
      sourceTool,
      customFolders[sourceTool],
    );

    console.log(chalk.blue("\n📦 Creating symlinks...\n"));

    let successCount = 0;
    let skipCount = 0;

    for (const destValue of selectedDestinations) {
      const destChoice = destinationChoices.find(
        (c) => c.value === destValue,
      )!;
      const destPaths = await getToolPaths(
        destChoice.tool,
        customFolders[destChoice.tool],
      );

      let sourcePath: string;
      let targetPath: string;

      if (destChoice.contentType === "commands") {
        sourcePath = sourcePaths.commandsPath!;
        targetPath = destPaths.commandsPath!;
      } else {
        sourcePath = sourcePaths.agentsPath!;
        targetPath = destPaths.agentsPath!;
      }

      const toolName =
        TOOLS.find((t) => t.value === destChoice.tool)?.name || destChoice.tool;
      const contentLabel =
        destChoice.contentType === "commands" ? "commands" : "agents";

      try {
        const success = await createSymlink(sourcePath, targetPath, {
          skipMessage: chalk.yellow(
            `  ⚠️  ${toolName} ${contentLabel} path already exists and is not a symlink. Skipping...`,
          ),
        });

        if (success) {
          console.log(
            chalk.green(`  ✓ ${toolName} (${contentLabel}) symlink created`),
          );
          successCount++;
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(
          chalk.red(`  ✗ Failed to create ${toolName} (${contentLabel}) symlink:`),
          error,
        );
      }
    }

    console.log(
      chalk.green(
        `\n✨ Symlink setup complete! ${successCount} created, ${skipCount} skipped`,
      ),
    );
  } catch (error) {
    console.error(chalk.red("\n❌ Symlink setup failed:"), error);
    process.exit(1);
  }
}
