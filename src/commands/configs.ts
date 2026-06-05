import chalk from "chalk";
import {
  cleanConfigBackups,
  createConfigBackup,
  DEFAULT_BACKUP_RETENTION_DAYS,
  listConfigBackups,
  listSavedConfigs,
  loadBackupSnapshot,
  loadNamedConfig,
  saveNamedConfig,
  undoLastLoad,
  type SnapshotInfo,
} from "../lib/configs-store.js";
import type { FolderOptions } from "../lib/folder-paths.js";

export interface ConfigCommandOptions extends FolderOptions {
  force?: boolean;
}

export interface ConfigBackupsCleanCommandOptions extends ConfigCommandOptions {
  days?: number;
  dryRun?: boolean;
  includeManual?: boolean;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return date.toLocaleString();
}

function formatFolders(folders: string[]): string {
  return folders.length > 0 ? folders.join(", ") : "unknown folders";
}

function printSnapshots(title: string, snapshots: SnapshotInfo[]): void {
  console.log(chalk.blue(title));

  if (snapshots.length === 0) {
    console.log(chalk.gray("No entries found."));
    return;
  }

  for (const snapshot of snapshots) {
    console.log(`${chalk.cyan(snapshot.name)} ${chalk.gray(formatDate(snapshot.metadata.createdAt))}`);
    console.log(chalk.gray(`  reason: ${snapshot.metadata.reason}`));
    console.log(chalk.gray(`  trigger: ${snapshot.metadata.trigger}`));
    console.log(chalk.gray(`  folders: ${formatFolders(snapshot.metadata.folders)}`));
    console.log(chalk.gray(`  path: ${snapshot.path}`));
  }
}

export async function configsSaveCommand(name: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.gray("Saving full .claude, .codex, and .agents folders..."));
    const snapshotPath = await saveNamedConfig(name, options);
    console.log(chalk.green(`Saved config "${name}"`));
    console.log(chalk.gray(snapshotPath));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function configsLoadCommand(name: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.gray(`Loading config "${name}"...`));
    const result = await loadNamedConfig(name, options);
    console.log(chalk.green(`Loaded config "${name}"`));
    if (result.backupPath) {
      console.log(chalk.gray(`Previous config backed up to ${result.backupPath}`));
    }
    console.log(chalk.gray(`Restored: ${formatFolders(result.restored)}`));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function configsUndoCommand(options: ConfigCommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.gray("Restoring the previous config backup..."));
    const result = await undoLastLoad(options);
    console.log(chalk.green(`Undid last config load using backup "${result.backupName}"`));
    if (result.backupPath) {
      console.log(chalk.gray(`Current config backed up to ${result.backupPath}`));
    }
    console.log(chalk.gray(`Restored: ${formatFolders(result.restored)}`));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function configsListCommand(options: ConfigCommandOptions = {}): Promise<void> {
  const configs = await listSavedConfigs(options);
  printSnapshots("Saved configs", configs);
}

export async function configsBackupsListCommand(options: ConfigCommandOptions = {}): Promise<void> {
  const backups = await listConfigBackups(options);
  printSnapshots("Config backups", backups);
}

export async function configsBackupsLoadCommand(name: string, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.gray(`Loading backup "${name}"...`));
    const result = await loadBackupSnapshot(name, options);
    console.log(chalk.green(`Loaded backup "${name}"`));
    if (result.backupPath) {
      console.log(chalk.gray(`Previous config backed up to ${result.backupPath}`));
    }
    console.log(chalk.gray(`Restored: ${formatFolders(result.restored)}`));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function configsBackupsCreateCommand(reason: string | undefined, options: ConfigCommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.gray("Creating config backup..."));
    const backupPath = await createConfigBackup(
      options,
      reason ?? "Manual backup from configs backups create",
      "manual-backup",
      "manual",
    );
    if (!backupPath) {
      console.log(chalk.gray("No .claude, .codex, or .agents configuration found to backup."));
      return;
    }
    console.log(chalk.green("Backup created"));
    console.log(chalk.gray(backupPath));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

export async function configsBackupsCleanCommand(options: ConfigBackupsCleanCommandOptions = {}): Promise<void> {
  try {
    const days = options.days ?? DEFAULT_BACKUP_RETENTION_DAYS;
    console.log(chalk.gray(`Cleaning config backups older than ${days} day${days !== 1 ? "s" : ""}...`));
    const result = await cleanConfigBackups(options);

    if (options.dryRun) {
      console.log(chalk.yellow(`Dry run: ${result.deleted.length} backup${result.deleted.length !== 1 ? "s" : ""} would be deleted.`));
    } else {
      console.log(chalk.green(`Deleted ${result.deleted.length} old backup${result.deleted.length !== 1 ? "s" : ""}.`));
    }

    console.log(chalk.gray(`Cutoff: ${formatDate(result.cutoff)}`));

    for (const backup of result.deleted) {
      console.log(chalk.gray(`  ${backup.name}`));
    }

    if (result.skipped.length > 0) {
      console.log(chalk.gray(`Skipped ${result.skipped.length} backup${result.skipped.length !== 1 ? "s" : ""}.`));
    }

    if (result.failed.length > 0) {
      console.error(chalk.red(`Failed to delete ${result.failed.length} backup${result.failed.length !== 1 ? "s" : ""}.`));
      for (const failure of result.failed) {
        console.error(chalk.red(`  ${failure.snapshot.name}: ${failure.error}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
