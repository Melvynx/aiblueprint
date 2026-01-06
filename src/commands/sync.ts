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

export async function proSyncCommand(options: SyncCommandOptions = {}) {
  p.intro(chalk.blue("🔄 Sync Premium Configurations"));

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
    for (const [category, items] of grouped) {
      p.log.message("");
      p.log.message(chalk.cyan.bold(`  ${category.toUpperCase()}`));
      for (const item of items) {
        p.log.message(`    ${formatItem(item)}`);
      }
    }

    p.log.message("");

    const choices: { value: SyncItem; label: string; hint?: string }[] = [];

    for (const item of changedItems) {
      const icons = { new: "🆕", modified: "📝", deleted: "🗑️", unchanged: "" };
      const actions = { new: "add", modified: "update", deleted: "remove", unchanged: "" };
      choices.push({
        value: item,
        label: `${icons[item.status]} ${item.relativePath}`,
        hint: actions[item.status],
      });
    }

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

    const selectedItems = selected as SyncItem[];

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
