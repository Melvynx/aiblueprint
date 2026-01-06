import * as p from "@clack/prompts";
import chalk from "chalk";
import os from "os";
import path from "path";
import { getToken } from "../lib/token-storage.js";
import {
  analyzeSyncChanges,
  syncSelectedItems,
  type SyncItem,
} from "../lib/sync-utils.js";
import { installScriptsDependencies } from "./setup/dependencies.js";
import { getVersion } from "../lib/version.js";

export interface SyncCommandOptions {
  folder?: string;
}

function formatItem(item: SyncItem): string {
  const icons = {
    new: "🆕",
    modified: "📝",
    deleted: "🗑️",
    unchanged: "✅",
  };

  const colors = {
    new: chalk.green,
    modified: chalk.yellow,
    deleted: chalk.red,
    unchanged: chalk.gray,
  };

  return `${icons[item.status]} ${colors[item.status](item.relativePath)}`;
}

function groupByCategory(items: SyncItem[]): Map<string, SyncItem[]> {
  const grouped = new Map<string, SyncItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.category) || [];
    existing.push(item);
    grouped.set(item.category, existing);
  }
  return grouped;
}

interface FolderSummary {
  name: string;
  newCount: number;
  modifiedCount: number;
  deletedCount: number;
}

function aggregateByTopLevelFolder(items: SyncItem[]): FolderSummary[] {
  const folderMap = new Map<string, FolderSummary>();

  for (const item of items) {
    const parts = item.name.split("/");
    const topLevel = parts[0];

    if (!folderMap.has(topLevel)) {
      folderMap.set(topLevel, { name: topLevel, newCount: 0, modifiedCount: 0, deletedCount: 0 });
    }

    const summary = folderMap.get(topLevel)!;
    if (item.status === "new") summary.newCount++;
    else if (item.status === "modified") summary.modifiedCount++;
    else if (item.status === "deleted") summary.deletedCount++;
  }

  return Array.from(folderMap.values());
}

function formatFolderSummary(summary: FolderSummary): string {
  const parts: string[] = [];
  if (summary.newCount > 0) parts.push(chalk.green(`+${summary.newCount}`));
  if (summary.modifiedCount > 0) parts.push(chalk.yellow(`~${summary.modifiedCount}`));
  if (summary.deletedCount > 0) parts.push(chalk.red(`-${summary.deletedCount}`));

  const countStr = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `📁 ${summary.name}${countStr}`;
}

type SelectionItem =
  | { type: "file"; item: SyncItem }
  | { type: "folder"; folder: string; category: string; items: SyncItem[] };

function createSelectionChoices(
  changedItems: SyncItem[]
): { value: SelectionItem; label: string; hint?: string }[] {
  const choices: { value: SelectionItem; label: string; hint?: string }[] = [];
  const folderedCategories = ["scripts", "skills"];

  const grouped = groupByCategory(changedItems);

  for (const [category, items] of grouped) {
    if (folderedCategories.includes(category)) {
      const folderMap = new Map<string, SyncItem[]>();
      for (const item of items) {
        const topLevel = item.name.split("/")[0];
        if (!folderMap.has(topLevel)) folderMap.set(topLevel, []);
        folderMap.get(topLevel)!.push(item);
      }

      for (const [folder, folderItems] of folderMap) {
        const summary = aggregateByTopLevelFolder(folderItems)[0];
        choices.push({
          value: { type: "folder", folder, category, items: folderItems },
          label: `📁 ${category}/${folder}`,
          hint: formatFolderHint(summary),
        });
      }
    } else {
      for (const item of items) {
        const icons = { new: "🆕", modified: "📝", deleted: "🗑️", unchanged: "" };
        const actions = { new: "add", modified: "update", deleted: "remove", unchanged: "" };
        choices.push({
          value: { type: "file", item },
          label: `${icons[item.status]} ${item.relativePath}`,
          hint: actions[item.status],
        });
      }
    }
  }

  return choices;
}

function formatFolderHint(summary: FolderSummary): string {
  const parts: string[] = [];
  if (summary.newCount > 0) parts.push(`+${summary.newCount}`);
  if (summary.modifiedCount > 0) parts.push(`~${summary.modifiedCount}`);
  if (summary.deletedCount > 0) parts.push(`-${summary.deletedCount}`);
  return parts.join(", ");
}

function expandSelections(selections: SelectionItem[]): SyncItem[] {
  const items: SyncItem[] = [];
  for (const sel of selections) {
    if (sel.type === "file") {
      items.push(sel.item);
    } else {
      items.push(...sel.items);
    }
  }
  return items;
}

export async function proSyncCommand(options: SyncCommandOptions = {}) {
  p.intro(chalk.blue(`🔄 Sync Premium Configurations ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: aiblueprint claude-code pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const claudeDir = options.folder
      ? path.resolve(options.folder)
      : path.join(os.homedir(), ".claude");

    const spinner = p.spinner();
    spinner.start("Analyzing changes...");

    const result = await analyzeSyncChanges(claudeDir, githubToken);

    spinner.stop("Analysis complete");

    const changedItems = result.items.filter((i) => i.status !== "unchanged");

    if (changedItems.length === 0) {
      p.log.success("Everything is up to date!");
      p.outro(chalk.green("✅ No changes needed"));
      return;
    }

    p.log.info(
      `Found: ${chalk.green(`${result.newCount} new`)}, ${chalk.yellow(`${result.modifiedCount} modified`)}, ${chalk.red(`${result.deletedCount} to remove`)}, ${chalk.gray(`${result.unchangedCount} unchanged`)}`
    );

    p.log.message("");
    p.log.message(chalk.bold("Changes by category:"));

    const grouped = groupByCategory(changedItems);
    const folderedCategories = ["scripts", "skills"];

    for (const [category, items] of grouped) {
      p.log.message("");
      p.log.message(chalk.cyan.bold(`  ${category.toUpperCase()}`));

      if (folderedCategories.includes(category)) {
        const folderSummaries = aggregateByTopLevelFolder(items);
        for (const summary of folderSummaries) {
          p.log.message(`    ${formatFolderSummary(summary)}`);
        }
      } else {
        for (const item of items) {
          p.log.message(`    ${formatItem(item)}`);
        }
      }
    }

    p.log.message("");

    const choices = createSelectionChoices(changedItems);

    const selected = await p.multiselect({
      message: "Select items to sync:",
      options: choices,
      initialValues: choices.map((c) => c.value),
      required: false,
    });

    if (p.isCancel(selected)) {
      p.cancel("Sync cancelled");
      process.exit(0);
    }

    const selectedItems = expandSelections(selected as SelectionItem[]);

    if (selectedItems.length === 0) {
      p.log.warn("No items selected");
      p.outro(chalk.yellow("⚠️ Nothing to sync"));
      return;
    }

    const toAdd = selectedItems.filter((i) => i.status === "new").length;
    const toUpdate = selectedItems.filter((i) => i.status === "modified").length;
    const toRemove = selectedItems.filter((i) => i.status === "deleted").length;

    const summary = [
      toAdd > 0 ? `add ${toAdd}` : "",
      toUpdate > 0 ? `update ${toUpdate}` : "",
      toRemove > 0 ? `remove ${toRemove}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const confirmResult = await p.confirm({
      message: `Proceed? (${summary})`,
      initialValue: true,
    });

    if (p.isCancel(confirmResult) || !confirmResult) {
      p.cancel("Sync cancelled");
      process.exit(0);
    }

    spinner.start("Syncing...");

    const syncResult = await syncSelectedItems(
      claudeDir,
      selectedItems,
      githubToken,
      (file, action) => {
        spinner.message(`${action}: ${chalk.cyan(file)}`);
      }
    );

    spinner.stop("Sync complete");

    const results: string[] = [];
    if (syncResult.success > 0) results.push(chalk.green(`${syncResult.success} added/updated`));
    if (syncResult.deleted > 0) results.push(chalk.red(`${syncResult.deleted} removed`));
    if (syncResult.failed > 0) results.push(chalk.yellow(`${syncResult.failed} failed`));

    p.log.success(results.join(", "));

    const scriptsWereSynced = selectedItems.some((i) => i.category === "scripts");
    if (scriptsWereSynced) {
      spinner.start("Installing scripts dependencies...");
      await installScriptsDependencies(claudeDir);
      spinner.stop("Scripts dependencies installed");
    }

    p.outro(chalk.green("✅ Sync completed"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Sync failed"));
    process.exit(1);
  }
}
