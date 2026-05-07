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
import { createBackup } from "../lib/backup-utils.js";
import { trackEvent, trackError, flushTelemetry } from "../lib/telemetry.js";
import { getAgentsDir } from "../lib/agents-installer.js";

export interface SyncCommandOptions {
  folder?: string;
  agentsFolder?: string;
}

function formatItem(item: SyncItem): string {
  const icons = {
    new: "🆕",
    modified: "📝",
    deleted: "🗑️",
    unchanged: "✅",
    migration: "📦",
  };

  const colors = {
    new: chalk.green,
    modified: chalk.yellow,
    deleted: chalk.red,
    unchanged: chalk.gray,
    migration: chalk.blue,
  };

  const folderPrefix = item.isFolder ? "📁 " : "";
  const suffix =
    item.status === "migration" && item.migrationKind === "move-from-claude"
      ? chalk.gray(" (move .claude → .agents)")
      : item.status === "migration"
        ? chalk.gray(" (preserve in .agents)")
        : "";
  return `${icons[item.status]} ${folderPrefix}${colors[item.status](item.relativePath)}${suffix}`;
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
  migrationCount: number;
}

function aggregateByTopLevelFolder(items: SyncItem[]): FolderSummary[] {
  const folderMap = new Map<string, FolderSummary>();

  for (const item of items) {
    const parts = item.name.split("/");
    const topLevel = parts[0];

    if (!folderMap.has(topLevel)) {
      folderMap.set(topLevel, {
        name: topLevel,
        newCount: 0,
        modifiedCount: 0,
        deletedCount: 0,
        migrationCount: 0,
      });
    }

    const summary = folderMap.get(topLevel)!;
    if (item.status === "new") summary.newCount++;
    else if (item.status === "modified") summary.modifiedCount++;
    else if (item.status === "deleted") summary.deletedCount++;
    else if (item.status === "migration") summary.migrationCount++;
  }

  return Array.from(folderMap.values());
}

function formatFolderSummary(summary: FolderSummary): string {
  const parts: string[] = [];
  if (summary.newCount > 0) parts.push(chalk.green(`+${summary.newCount}`));
  if (summary.modifiedCount > 0) parts.push(chalk.yellow(`~${summary.modifiedCount}`));
  if (summary.deletedCount > 0) parts.push(chalk.red(`-${summary.deletedCount}`));
  if (summary.migrationCount > 0) parts.push(chalk.blue(`→${summary.migrationCount}`));

  const countStr = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `📁 ${summary.name}${countStr}`;
}

type SelectionItem =
  | { type: "file"; item: SyncItem }
  | { type: "folder"; folder: string; category: string; items: SyncItem[] };

function createSelectionChoices(
  changedItems: SyncItem[],
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
        const icons = {
          new: "🆕",
          modified: "📝",
          deleted: "🗑️",
          unchanged: "",
          migration: "📦",
        };
        const actions = {
          new: "add",
          modified: "update",
          deleted: "remove",
          unchanged: "",
          migration: "migrate",
        };
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
  if (summary.migrationCount > 0) parts.push(`→${summary.migrationCount}`);
  return parts.join(", ");
}

function expandSelections(selections: SelectionItem[]): { items: SyncItem[] } {
  const items: SyncItem[] = [];

  for (const sel of selections) {
    if (sel.type === "file") {
      items.push(sel.item);
    } else if (sel.type === "folder") {
      items.push(...sel.items);
    }
  }

  return { items };
}

export async function proSyncCommand(options: SyncCommandOptions = {}) {
  p.intro(chalk.blue(`🔄 Sync Premium Configurations ${chalk.gray(`v${getVersion()}`)}`));

  try {
    const githubToken = await getToken();

    if (!githubToken) {
      p.log.error("No token found");
      p.log.info("Run: npx aiblueprint-cli@latest claude-code pro activate <token>");
      p.outro(chalk.red("❌ Not activated"));
      process.exit(1);
    }

    const claudeDir = options.folder
      ? path.resolve(options.folder)
      : path.join(os.homedir(), ".claude");
    const agentsDir = getAgentsDir(options.agentsFolder);

    const spinner = p.spinner();
    spinner.start("Analyzing changes...");

    const result = await analyzeSyncChanges(claudeDir, githubToken, agentsDir);

    spinner.stop("Analysis complete");

    const changedItems = result.items.filter((i) => i.status !== "unchanged");

    if (changedItems.length === 0) {
      p.log.success("Everything is up to date!");
      p.outro(chalk.green("✅ No changes needed"));
      return;
    }

    const summaryParts: string[] = [
      chalk.green(`${result.newCount} new`),
      chalk.yellow(`${result.modifiedCount} modified`),
    ];
    if (result.migrationCount > 0) {
      summaryParts.push(chalk.blue(`${result.migrationCount} to migrate`));
    }
    summaryParts.push(chalk.red(`${result.deletedCount} to remove`));
    summaryParts.push(chalk.gray(`${result.unchangedCount} unchanged`));
    p.log.info(`Found: ${summaryParts.join(", ")}`);

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

    const newItems = changedItems.filter((i) => i.status === "new");
    const modifiedItems = changedItems.filter((i) => i.status === "modified");
    const deletedItems = changedItems.filter((i) => i.status === "deleted");
    const migrationItems = changedItems.filter((i) => i.status === "migration");

    const hasDeletions = deletedItems.length > 0;
    const hasMigrations = migrationItems.length > 0;

    type SyncMode = "updates" | "updates_and_delete" | "custom";

    const updatesHintParts = [
      `add ${newItems.length}`,
      `update ${modifiedItems.length}`,
    ];
    if (hasMigrations) {
      updatesHintParts.push(`migrate ${migrationItems.length}`);
    }

    const syncModeOptions: { value: SyncMode; label: string; hint: string }[] = [
      {
        value: "updates",
        label: "Import all updates",
        hint: `${updatesHintParts.join(" + ")} files`,
      },
    ];

    if (hasDeletions) {
      const deleteHintParts = [...updatesHintParts, `delete ${deletedItems.length}`];
      syncModeOptions.push({
        value: "updates_and_delete",
        label: "Import all updates and delete files",
        hint: `${deleteHintParts.join(" + ")} files`,
      });
    }

    syncModeOptions.push({
      value: "custom",
      label: "Custom choice",
      hint: "select specific files to sync",
    });

    const syncMode = await p.select({
      message: "How would you like to sync?",
      options: syncModeOptions,
    });

    if (p.isCancel(syncMode)) {
      p.cancel("Sync cancelled");
      process.exit(0);
    }

    let selectedItems: SyncItem[] = [];

    if (syncMode === "updates") {
      selectedItems = [...newItems, ...modifiedItems, ...migrationItems];
    } else if (syncMode === "updates_and_delete") {
      p.log.message("");
      p.log.message(chalk.red.bold("⚠️  WARNING: DESTRUCTIVE ACTION"));
      p.log.message(chalk.red("━".repeat(50)));
      p.log.message(
        chalk.red(
          `${deletedItems.length} commands/agents/scripts not in the premium version`
        )
      );
      p.log.message(
        chalk.red("will be PERMANENTLY DELETED and replaced by the new version.")
      );
      if (hasMigrations) {
        p.log.message(
          chalk.gray(
            `(Skills are NOT deleted - they will be migrated to ~/.agents instead.)`
          )
        );
      }
      p.log.message(chalk.red("━".repeat(50)));
      p.log.message("");

      const deleteConfirm = await p.confirm({
        message: chalk.red.bold("Are you sure you want to delete and replace all files?"),
        initialValue: false,
      });

      if (p.isCancel(deleteConfirm) || !deleteConfirm) {
        p.cancel("Sync cancelled");
        process.exit(0);
      }

      selectedItems = [...newItems, ...modifiedItems, ...migrationItems, ...deletedItems];
    } else {
      const fileChoices = choices;
      const nonDeleteChoices = fileChoices.filter((c) => {
        if (c.value.type === "file") return c.value.item.status !== "deleted";
        if (c.value.type === "folder") return !c.value.items.every((i) => i.status === "deleted");
        return true;
      });

      const nonDeleteInitialValues = nonDeleteChoices.map((c) => c.value);

      const customSelected = await p.multiselect({
        message: "Select files to sync (deletions excluded by default):",
        options: fileChoices as any,
        initialValues: nonDeleteInitialValues,
        required: false,
      });

      if (p.isCancel(customSelected)) {
        p.cancel("Sync cancelled");
        process.exit(0);
      }

      const expanded = expandSelections(customSelected as SelectionItem[]);
      selectedItems = expanded.items;
    }

    if (selectedItems.length === 0) {
      p.log.warn("No files selected");
      p.outro(chalk.yellow("⚠️ Nothing to sync"));
      return;
    }

    const toAdd = selectedItems.filter((i) => i.status === "new").length;
    const toUpdate = selectedItems.filter((i) => i.status === "modified").length;
    const toRemove = selectedItems.filter((i) => i.status === "deleted").length;
    const toMigrate = selectedItems.filter((i) => i.status === "migration").length;

    p.log.message("");
    p.log.message(chalk.bold("What will happen:"));
    if (toAdd > 0) p.log.message(chalk.green(`  ✓ Add ${toAdd} new file${toAdd > 1 ? "s" : ""}`));
    if (toUpdate > 0) p.log.message(chalk.yellow(`  ✓ Update ${toUpdate} file${toUpdate > 1 ? "s" : ""}`));
    if (toMigrate > 0) p.log.message(chalk.blue(`  ✓ Migrate ${toMigrate} item${toMigrate > 1 ? "s" : ""} to .agents (preserve, no data loss)`));
    if (toRemove > 0) p.log.message(chalk.red(`  ✓ Delete ${toRemove} file${toRemove > 1 ? "s" : ""}`));
    p.log.message(chalk.gray(`  ✓ Backup current config to ~/.config/aiblueprint/backup/`));
    p.log.message("");

    const confirmResult = await p.confirm({
      message: "Proceed with sync?",
      initialValue: true,
    });

    if (p.isCancel(confirmResult) || !confirmResult) {
      p.cancel("Sync cancelled");
      process.exit(0);
    }

    spinner.start("Creating backup...");
    const backupPath = await createBackup(claudeDir, agentsDir);
    if (backupPath) {
      spinner.stop(`Backup created: ${chalk.gray(backupPath)}`);
    } else {
      spinner.stop("No existing config to backup");
    }

    spinner.start("Syncing...");

    const syncResult = await syncSelectedItems(
      claudeDir,
      selectedItems,
      githubToken,
      agentsDir,
      (file, action) => {
        spinner.message(`${action}: ${chalk.cyan(file)}`);
      }
    );

    spinner.stop("Files synced");

    const results: string[] = [];
    if (syncResult.success > 0) results.push(chalk.green(`${syncResult.success} added/updated`));
    if (syncResult.migrated > 0) results.push(chalk.blue(`${syncResult.migrated} migrated`));
    if (syncResult.deleted > 0) results.push(chalk.red(`${syncResult.deleted} removed`));
    if (syncResult.failed > 0) results.push(chalk.yellow(`${syncResult.failed} failed`));

    p.log.success(results.join(", "));

    const scriptsWereSynced = selectedItems.some((i) => i.category === "scripts");
    if (scriptsWereSynced) {
      spinner.start("Installing scripts dependencies...");
      await installScriptsDependencies(claudeDir);
      spinner.stop("Scripts dependencies installed");
    }

    trackEvent("pro-sync", {
      added: syncResult.success,
      migrated: syncResult.migrated,
      deleted: syncResult.deleted,
      failed: syncResult.failed,
    });

    p.outro(chalk.green("✅ Sync completed"));
  } catch (error) {
    trackError(error, { command: "pro-sync" });
    await flushTelemetry();
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Sync failed"));
    process.exit(1);
  }
}
