import * as p from "@clack/prompts";
import chalk from "chalk";
import os from "os";
import path from "path";
import { getToken } from "../lib/token-storage.js";
import {
  analyzeSyncChanges,
  syncSelectedItems,
  syncSelectedHooks,
  type SyncItem,
  type HookSyncItem,
} from "../lib/sync-utils.js";
import { installScriptsDependencies } from "./setup/dependencies.js";
import { getVersion } from "../lib/version.js";
import { createBackup } from "../lib/backup-utils.js";
import { transformHook } from "../lib/platform.js";

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
  | { type: "folder"; folder: string; category: string; items: SyncItem[] }
  | { type: "hook"; hook: HookSyncItem };

function createSelectionChoices(
  changedItems: SyncItem[],
  hooks: HookSyncItem[] = []
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

  for (const hook of hooks) {
    const icon = hook.status === "new" ? "🆕" : "📝";
    const action = hook.status === "new" ? "add" : "update";
    const matcherDisplay = hook.matcher || "*";
    choices.push({
      value: { type: "hook", hook },
      label: `${icon} settings.json → ${hook.hookType}[${matcherDisplay}]`,
      hint: action,
    });
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

function expandSelections(selections: SelectionItem[]): { items: SyncItem[]; hooks: HookSyncItem[] } {
  const items: SyncItem[] = [];
  const hooks: HookSyncItem[] = [];

  for (const sel of selections) {
    if (sel.type === "file") {
      items.push(sel.item);
    } else if (sel.type === "folder") {
      items.push(...sel.items);
    } else if (sel.type === "hook") {
      hooks.push(sel.hook);
    }
  }

  return { items, hooks };
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

    const spinner = p.spinner();
    spinner.start("Analyzing changes...");

    const result = await analyzeSyncChanges(claudeDir, githubToken);

    spinner.stop("Analysis complete");

    const changedItems = result.items.filter((i) => i.status !== "unchanged");
    const changedHooks = result.hooks;

    if (changedItems.length === 0 && changedHooks.length === 0) {
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

    if (changedHooks.length > 0) {
      p.log.message("");
      p.log.message(chalk.cyan.bold(`  SETTINGS (hooks)`));
      for (const hook of changedHooks) {
        const icon = hook.status === "new" ? "🆕" : "📝";
        const color = hook.status === "new" ? chalk.green : chalk.yellow;
        const matcherDisplay = hook.matcher || "*";
        p.log.message(`    ${icon} ${color(`${hook.hookType}[${matcherDisplay}]`)}`);
      }
    }

    p.log.message("");

    const choices = createSelectionChoices(changedItems, changedHooks);

    const newItems = changedItems.filter((i) => i.status === "new");
    const modifiedItems = changedItems.filter((i) => i.status === "modified");
    const deletedItems = changedItems.filter((i) => i.status === "deleted");
    const newHooks = changedHooks.filter((h) => h.status === "new");
    const modifiedHooks = changedHooks.filter((h) => h.status === "modified");

    const hasDeletions = deletedItems.length > 0;

    type SyncMode = "updates" | "updates_and_delete" | "custom";

    const syncModeOptions: { value: SyncMode; label: string; hint: string }[] = [
      {
        value: "updates",
        label: "Import all updates",
        hint: `add ${newItems.length} + update ${modifiedItems.length} files`,
      },
    ];

    if (hasDeletions) {
      syncModeOptions.push({
        value: "updates_and_delete",
        label: "Import all updates and delete files",
        hint: `add ${newItems.length} + update ${modifiedItems.length} + delete ${deletedItems.length} files`,
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
    let selectedHooks: HookSyncItem[] = [];

    if (syncMode === "updates") {
      selectedItems = [...newItems, ...modifiedItems];
    } else if (syncMode === "updates_and_delete") {
      selectedItems = [...newItems, ...modifiedItems, ...deletedItems];
    } else {
      const fileChoices = choices.filter((c) => c.value.type !== "hook");
      const nonDeleteChoices = fileChoices.filter((c) => {
        if (c.value.type === "file") return c.value.item.status !== "deleted";
        if (c.value.type === "folder") return !c.value.items.every((i) => i.status === "deleted");
        return true;
      });

      const nonDeleteInitialValues = nonDeleteChoices.map((c) => c.value);

      const customSelected = await p.multiselect({
        message: "Select files to sync (deletions excluded by default):",
        options: fileChoices,
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

    p.log.message("");
    p.log.message(chalk.bold("What will happen:"));
    if (toAdd > 0) p.log.message(chalk.green(`  ✓ Add ${toAdd} new file${toAdd > 1 ? "s" : ""}`));
    if (toUpdate > 0) p.log.message(chalk.yellow(`  ✓ Update ${toUpdate} file${toUpdate > 1 ? "s" : ""}`));
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
    const backupPath = await createBackup(claudeDir);
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
      (file, action) => {
        spinner.message(`${action}: ${chalk.cyan(file)}`);
      }
    );

    spinner.stop("Files synced");

    const results: string[] = [];
    if (syncResult.success > 0) results.push(chalk.green(`${syncResult.success} added/updated`));
    if (syncResult.deleted > 0) results.push(chalk.red(`${syncResult.deleted} removed`));
    if (syncResult.failed > 0) results.push(chalk.yellow(`${syncResult.failed} failed`));

    p.log.success(results.join(", "));

    if (changedHooks.length > 0) {
      const hookDescriptions: Record<string, string> = {
        Stop: "Play sound when Claude finishes a task",
        Notification: "Play sound when Claude needs human input",
        PreToolUse: "Run before Claude uses a tool (e.g., command validation)",
        PostToolUse: "Run after Claude uses a tool (e.g., auto-format)",
      };

      const getHookCommand = (hookData: any): string | null => {
        if (hookData?.hooks?.[0]?.command) return hookData.hooks[0].command;
        if (hookData?.command) return hookData.command;
        return null;
      };

      p.log.message("");
      p.log.message(chalk.bold.yellow("⚠️  Settings.json Sync (Optional)"));
      p.log.message(chalk.gray("The following hooks can be synced to your settings.json:"));
      p.log.message("");

      for (const hook of changedHooks) {
        const icon = hook.status === "new" ? "🆕" : "📝";
        const color = hook.status === "new" ? chalk.green : chalk.yellow;
        const matcherDisplay = hook.matcher ? `[${hook.matcher}]` : "";
        const description = hookDescriptions[hook.hookType] || "";

        p.log.message(`  ${icon} ${color(`${hook.hookType}${matcherDisplay}`)} ${chalk.gray(description)}`);

        const transformedHook = transformHook(hook.remoteHook, claudeDir);
        const newCommand = getHookCommand(transformedHook);

        if (hook.status === "modified" && hook.localHook) {
          const oldCommand = getHookCommand(hook.localHook);
          if (oldCommand) {
            p.log.message(chalk.red(`     - ${oldCommand}`));
          }
        }

        if (newCommand) {
          p.log.message(chalk.green(`     + ${newCommand}`));
        }

        p.log.message("");
      }

      p.log.message(chalk.gray("This will add/update hooks in ~/.claude/settings.json"));
      p.log.message("");

      const syncSettingsResult = await p.confirm({
        message: "Do you want to sync these hooks to settings.json?",
        initialValue: false,
      });

      if (!p.isCancel(syncSettingsResult) && syncSettingsResult) {
        const spinner2 = p.spinner();
        spinner2.start("Syncing hooks to settings.json...");

        selectedHooks = [...changedHooks];
        const hooksResult = await syncSelectedHooks(
          claudeDir,
          selectedHooks,
          (hook, action) => {
            spinner2.message(`${action}: ${chalk.cyan(hook)}`);
          }
        );

        spinner2.stop("Hooks synced to settings.json");
        if (hooksResult.success > 0) {
          p.log.success(chalk.green(`${hooksResult.success} hook${hooksResult.success > 1 ? "s" : ""} synced`));
        }
        if (hooksResult.failed > 0) {
          p.log.warn(chalk.yellow(`${hooksResult.failed} hook${hooksResult.failed > 1 ? "s" : ""} failed`));
        }
      } else {
        p.log.info(chalk.gray("Skipped settings.json sync"));
      }
    }

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
