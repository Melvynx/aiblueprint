import * as p from "@clack/prompts";
import chalk from "chalk";
import os from "os";
import path from "path";
import { listBackups, loadBackup, createBackup, type BackupInfo } from "../lib/backup-utils.js";

export interface BackupLoadOptions {
  folder?: string;
}

function formatBackupDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  let relative: string;
  if (diffMinutes < 60) {
    relative = `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    relative = date.toLocaleDateString();
  }

  return `${date.toLocaleString()} (${relative})`;
}

export async function backupLoadCommand(options: BackupLoadOptions = {}): Promise<void> {
  const claudeDir = options.folder || path.join(os.homedir(), ".claude");

  p.intro(chalk.blue("📦 Load Backup"));

  const spinner = p.spinner();
  spinner.start("Scanning for backups...");

  const backups = await listBackups();

  spinner.stop(`Found ${backups.length} backup${backups.length !== 1 ? "s" : ""}`);

  if (backups.length === 0) {
    p.log.warn("No backups found in ~/.config/aiblueprint/backup/");
    p.log.info("Backups are created automatically when you run setup or sync commands.");
    p.outro(chalk.gray("Nothing to restore"));
    return;
  }

  const backupOptions = backups.map((backup) => ({
    value: backup,
    label: backup.name,
    hint: formatBackupDate(backup.date),
  }));

  const selected = await p.select<{ value: BackupInfo; label: string; hint: string }[], BackupInfo>({
    message: "Select a backup to restore:",
    options: backupOptions,
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  p.log.info(`Selected: ${chalk.cyan(selected.name)}`);
  p.log.info(`Date: ${chalk.gray(formatBackupDate(selected.date))}`);

  const confirm = await p.confirm({
    message: `This will overwrite your current configuration in ${chalk.cyan(claudeDir)}. Continue?`,
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  spinner.start("Creating backup of current configuration...");
  const currentBackup = await createBackup(claudeDir);
  if (currentBackup) {
    spinner.stop(`Current config backed up to: ${chalk.gray(currentBackup)}`);
  } else {
    spinner.stop("No current config to backup");
  }

  spinner.start("Restoring backup...");

  try {
    await loadBackup(selected.path, claudeDir);
    spinner.stop("Backup restored successfully");

    p.log.success(`Restored configuration from ${chalk.cyan(selected.name)}`);
    p.outro(chalk.green("✅ Backup loaded successfully"));
  } catch (error) {
    spinner.stop("Restore failed");
    p.log.error(`Failed to restore backup: ${error}`);
    process.exit(1);
  }
}
