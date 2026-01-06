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

export interface SyncCommandOptions {
  folder?: string;
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

    if (result.newCount === 0 && result.modifiedCount === 0) {
      p.log.success("Everything is up to date!");
      p.outro(chalk.green("✅ No changes needed"));
      return;
    }

    p.log.info(
      `Found ${result.newCount} new, ${result.modifiedCount} modified, ${result.unchangedCount} unchanged`
    );

    const newItems = result.items.filter((i) => i.status === "new");
    const modifiedItems = result.items.filter((i) => i.status === "modified");

    const choices: { value: SyncItem; label: string; hint?: string }[] = [];

    if (newItems.length > 0) {
      for (const item of newItems) {
        choices.push({
          value: item,
          label: `🆕 ${item.name}`,
          hint: `${item.category} (new ${item.type})`,
        });
      }
    }

    if (modifiedItems.length > 0) {
      for (const item of modifiedItems) {
        choices.push({
          value: item,
          label: `📝 ${item.name}`,
          hint: `${item.category} (modified ${item.type})`,
        });
      }
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

    const confirmResult = await p.confirm({
      message: `Sync ${selectedItems.length} item(s)?`,
      initialValue: true,
    });

    if (p.isCancel(confirmResult) || !confirmResult) {
      p.cancel("Sync cancelled");
      process.exit(0);
    }

    spinner.start(`Syncing ${selectedItems.length} item(s)...`);

    const syncResult = await syncSelectedItems(
      claudeDir,
      selectedItems,
      githubToken
    );

    spinner.stop("Sync complete");

    if (syncResult.failed > 0) {
      p.log.warn(`${syncResult.success} succeeded, ${syncResult.failed} failed`);
    } else {
      p.log.success(`${syncResult.success} item(s) synced successfully`);
    }

    const syncedByCategory = {
      commands: selectedItems.filter((i) => i.category === "commands").length,
      agents: selectedItems.filter((i) => i.category === "agents").length,
      skills: selectedItems.filter((i) => i.category === "skills").length,
      scripts: selectedItems.filter((i) => i.category === "scripts").length,
    };

    const summary: string[] = [];
    if (syncedByCategory.commands > 0)
      summary.push(`${syncedByCategory.commands} command(s)`);
    if (syncedByCategory.agents > 0)
      summary.push(`${syncedByCategory.agents} agent(s)`);
    if (syncedByCategory.skills > 0) summary.push("skills folder");
    if (syncedByCategory.scripts > 0) summary.push("scripts folder");

    p.log.info(`Synced: ${summary.join(", ")}`);

    p.outro(chalk.green("✅ Sync completed"));
  } catch (error) {
    if (error instanceof Error) {
      p.log.error(error.message);
    }
    p.outro(chalk.red("❌ Sync failed"));
    process.exit(1);
  }
}
