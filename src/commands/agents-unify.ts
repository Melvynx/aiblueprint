import chalk from "chalk";
import { getVersion } from "../lib/version.js";
import {
  unifyAgentsConfiguration,
  type AgentsUnifyResult,
} from "../lib/agents-unifier.js";
import { renderCodexAgentsFromMarkdown } from "../lib/codex-agents-renderer.js";

export interface AgentsUnifyCommandParams {
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
  agentsFolder?: string;
}

function countByCategory(
  result: AgentsUnifyResult,
  key: "imported" | "duplicates" | "renamed" | "linked" | "alreadyLinked",
  category: "skills" | "agents",
): number {
  return result[key].filter((entry) => entry.category === category).length;
}

function printCategorySummary(result: AgentsUnifyResult, category: "skills" | "agents") {
  const imported = countByCategory(result, "imported", category);
  const duplicates = countByCategory(result, "duplicates", category);
  const renamed = countByCategory(result, "renamed", category);
  const linked = countByCategory(result, "linked", category);
  const alreadyLinked = countByCategory(result, "alreadyLinked", category);

  console.log(
    chalk.gray(
      `  ${category}: ${imported} imported, ${duplicates} duplicates skipped, ${renamed} renamed, ${linked} linked, ${alreadyLinked} already linked`,
    ),
  );
}

export async function agentsUnifyCommand(params: AgentsUnifyCommandParams = {}) {
  try {
    console.log(chalk.blue.bold(`\nAIBlueprint agents unify ${chalk.gray(`v${getVersion()}`)}\n`));
    console.log(chalk.gray("Centralizing reusable skills and agents into .agents, then rendering Codex agents"));

    const result = await unifyAgentsConfiguration(params);
    const codexResult = await renderCodexAgentsFromMarkdown(params);

    console.log(chalk.green("\nUnify complete"));
    console.log(chalk.gray(`  Shared folder: ${result.agentsDir}`));
    printCategorySummary(result, "skills");
    printCategorySummary(result, "agents");
    console.log(
      chalk.gray(
        `  codex agents: ${codexResult.rendered.length} rendered, ${codexResult.skipped.length} skipped`,
      ),
    );

    if (result.backupPath) {
      console.log(chalk.gray(`  Source backups: ${result.backupPath}`));
    }

    if (result.skipped.length > 0) {
      console.log(chalk.yellow("\nSkipped paths:"));
      for (const skipped of result.skipped) {
        console.log(chalk.yellow(`  ${skipped.path}: ${skipped.reason}`));
      }
    }
  } catch (error) {
    console.error(chalk.red("\nAgents unify failed:"), error);
    process.exit(1);
  }
}
