import * as p from "@clack/prompts";
import chalk from "chalk";
import { getVersion } from "../lib/version.js";
import {
  previewAgentsConfiguration,
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

function printPreviewList(title: string, entries: string[]) {
  if (entries.length === 0) return;
  console.log(chalk.gray(`\n${title}:`));
  for (const entry of entries.slice(0, 12)) {
    console.log(chalk.gray(`  - ${entry}`));
  }
  if (entries.length > 12) {
    console.log(chalk.gray(`  ...and ${entries.length - 12} more`));
  }
}

function printAgentsUnifyPreview(result: AgentsUnifyResult) {
  console.log(chalk.yellow("\nPlanned changes"));
  console.log(chalk.gray(`  Root: ${result.rootDir}`));
  console.log(chalk.gray(`  Shared folder: ${result.agentsDir}`));
  console.log(chalk.gray(`  Imports: ${result.imported.length}`));
  console.log(chalk.gray(`  Renames: ${result.renamed.length}`));
  console.log(chalk.gray(`  Symlinks/relinks: ${result.linked.length}`));
  console.log(chalk.gray(`  Already linked: ${result.alreadyLinked.length}`));
  console.log(chalk.gray(`  Duplicates skipped: ${result.duplicates.length}`));
  if (result.backupPath) {
    console.log(chalk.gray(`  Backups: ${result.backupPath}`));
  }
  if (result.instructionIndex) {
    console.log(chalk.gray(`  AGENTS.md rules index: ${result.instructionIndex.indexedRules.length} rules`));
    console.log(chalk.gray(`  CLAUDE.md symlink target: ${result.instructionIndex.agentsPath}`));
  }

  printPreviewList(
    "Files/folders to import",
    result.imported.map((entry) => `${entry.from} -> ${entry.to}`),
  );
  printPreviewList(
    "Name conflicts to preserve",
    result.renamed.map((entry) => `${entry.from} -> ${entry.to} (${entry.reason})`),
  );
  printPreviewList(
    "Symlinks/relinks to create",
    result.linked.map((entry) => (
      entry.movedToBackup
        ? `${entry.from} -> ${entry.to} (backup: ${entry.movedToBackup})`
        : `${entry.from} -> ${entry.to}`
    )),
  );
  printPreviewList(
    "Skipped duplicates",
    result.duplicates.map((entry) => `${entry.from} (kept: ${entry.keptAs})`),
  );
}

async function confirmUnify(): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return true;
  }

  const answer = await p.confirm({
    message: "Continue with these unify changes?",
    initialValue: false,
  });

  if (p.isCancel(answer)) {
    return false;
  }

  return Boolean(answer);
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

    const preview = await previewAgentsConfiguration(params);
    printAgentsUnifyPreview(preview);

    if (!(await confirmUnify())) {
      console.log(chalk.gray("\nUnify cancelled"));
      return;
    }

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
