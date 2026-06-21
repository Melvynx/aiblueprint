import inquirer from "inquirer";
import chalk from "chalk";
import {
  getToolPaths,
  createSymlink,
  type ToolType,
} from "./setup/symlinks.js";
import { resolveFolders } from "../lib/folder-paths.js";
import { getVersion } from "../lib/version.js";

export interface SymlinkCommandParams {
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
}

interface ToolConfig {
  name: string;
  value: ToolType;
}

const TOOLS: ToolConfig[] = [
  {
    name: "Claude Code",
    value: "claude-code",
  },
  {
    name: "Codex",
    value: "codex",
  },
  {
    name: "FactoryAI",
    value: "factoryai",
  },
];

interface DestinationChoice {
  name: string;
  value: string;
  tool: ToolType;
}

export async function symlinkCommand(params: SymlinkCommandParams = {}) {
  try {
    console.log(chalk.blue.bold(`\n🔗 Symlink Manager ${chalk.gray(`v${getVersion()}`)}\n`));
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

    const destinationChoices: DestinationChoice[] = [];

    for (const tool of TOOLS) {
      if (tool.value === sourceTool) continue;

      destinationChoices.push({
        name: tool.name,
        value: `${tool.value}-agents`,
        tool: tool.value,
      });
    }

    if (destinationChoices.length === 0) {
      console.log(
        chalk.yellow(
          "\n⚠️  No compatible destination tools found for agent syncing",
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

    const { claudeDir, codexDir } = resolveFolders({
      folder: params.folder,
      claudeCodeFolder: params.claudeCodeFolder,
      codexFolder: params.codexFolder,
    });

    const customFolders: Record<ToolType, string | undefined> = {
      "claude-code": claudeDir,
      codex: codexDir,
      factoryai: undefined,
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

      const sourcePath = sourcePaths.agentsPath;
      const targetPath = destPaths.agentsPath;

      const toolName =
        TOOLS.find((t) => t.value === destChoice.tool)?.name || destChoice.tool;
      const contentLabel = "agents";

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
