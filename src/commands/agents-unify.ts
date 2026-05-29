import chalk from "chalk";
import { getVersion } from "../lib/version.js";
import {
  unifyAgentsConfiguration,
  type AgentsUnifyResult,
  type AgentsUnifyScope,
  type UnifiedAgentCategory,
} from "../lib/agents-unifier.js";
import { renderCodexAgentsFromMarkdown } from "../lib/codex-agents-renderer.js";

export interface AgentsUnifyCommandParams {
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
  agentsFolder?: string;
  scope?: AgentsUnifyScope;
}

function countByCategory(
  result: AgentsUnifyResult,
  key: "imported" | "duplicates" | "renamed" | "linked" | "alreadyLinked",
  category: UnifiedAgentCategory,
): number {
  return result[key].filter((entry) => entry.category === category).length;
}

function printCategorySummary(result: AgentsUnifyResult, category: UnifiedAgentCategory) {
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
    console.log(chalk.gray(`Scope: ${params.scope ?? "global"}`));
    console.log(chalk.gray(
      params.scope === "repository"
        ? "Centralizing project agent configuration into .agents"
        : "Centralizing reusable agent configuration into .agents, then rendering Codex agents",
    ));

    const result = await unifyAgentsConfiguration(params);
    const codexResult = params.scope === "repository"
      ? null
      : await renderCodexAgentsFromMarkdown(params);

    console.log(chalk.green("\nUnify complete"));
    console.log(chalk.gray(`  Shared folder: ${result.agentsDir}`));
    printCategorySummary(result, "instructions");
    printCategorySummary(result, "skills");
    printCategorySummary(result, "agents");
    if (result.scope === "repository") {
      printCategorySummary(result, "rules");
    }
    if (codexResult) {
      console.log(
        chalk.gray(
          `  codex agents: ${codexResult.rendered.length} rendered, ${codexResult.skipped.length} skipped`,
        ),
      );
    }
    if (result.instructionIndex) {
      console.log(
        chalk.gray(
          `  rules index: ${result.instructionIndex.indexedRules.length} rules indexed in ${result.instructionIndex.agentsPath}`,
        ),
      );
      console.log(chalk.gray(`  Claude instructions: ${result.instructionIndex.claudePath}`));
    }

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
