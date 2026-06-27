import fs from "fs-extra";
import os from "os";
import path from "path";
import { resolveFolders, type FolderOptions, type ResolvedFolders } from "./folder-paths.js";

const MANAGED_FOLDER_NAMES = [".claude", ".codex", ".agents"] as const;
type ManagedFolderName = typeof MANAGED_FOLDER_NAMES[number];
const RETENTION_MANAGED_BACKUP_TRIGGERS = new Set(["setup", "sync", "load", "backup-load"]);
export const DEFAULT_BACKUP_RETENTION_DAYS = 30;

export interface ConfigStorePaths {
  baseDir: string;
  configsDir: string;
  backupsDir: string;
  historyPath: string;
}

export interface SnapshotMetadata {
  name: string;
  type: "config" | "backup";
  createdAt: string;
  reason: string;
  trigger: string;
  source?: string;
  folders: ManagedFolderName[];
}

export interface SnapshotInfo {
  name: string;
  path: string;
  metadata: SnapshotMetadata;
}

export interface ConfigStoreOptions extends FolderOptions {
  force?: boolean;
}

export interface CleanConfigBackupsOptions extends FolderOptions {
  days?: number;
  dryRun?: boolean;
  includeManual?: boolean;
  now?: Date;
}

export interface SkippedConfigBackup {
  snapshot: SnapshotInfo;
  reason: string;
}

export interface FailedConfigBackupClean {
  snapshot: SnapshotInfo;
  error: string;
}

export interface CleanConfigBackupsResult {
  cutoff: string;
  deleted: SnapshotInfo[];
  failed: FailedConfigBackupClean[];
  kept: SnapshotInfo[];
  skipped: SkippedConfigBackup[];
}

export function getConfigStorePaths(rootDir: string): ConfigStorePaths {
  const baseDir = path.join(rootDir, ".aiblueprint");
  return {
    baseDir,
    configsDir: path.join(baseDir, "configs"),
    backupsDir: path.join(baseDir, "backups"),
    historyPath: path.join(baseDir, "history.jsonl"),
  };
}

export function resolveConfigStoreFolders(options: FolderOptions = {}): ResolvedFolders {
  return resolveFolders(options);
}

function timestamp(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
}

export function sanitizeSnapshotName(name: string): string {
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitized) {
    throw new Error("Snapshot name cannot be empty");
  }

  if (sanitized === "." || sanitized === ".." || sanitized.includes("..")) {
    throw new Error("Snapshot name is not allowed");
  }

  return sanitized;
}

function managedFolders(folders: ResolvedFolders): Array<{ name: ManagedFolderName; path: string }> {
  return [
    { name: ".claude", path: folders.claudeDir },
    { name: ".codex", path: folders.codexDir },
    { name: ".agents", path: folders.agentsDir },
  ];
}

async function hasContent(folderPath: string): Promise<boolean> {
  if (!(await fs.pathExists(folderPath))) return false;
  const entries = await fs.readdir(folderPath);
  return entries.some((entry) => entry !== ".DS_Store");
}

async function copyManagedFolder(source: string, destination: string): Promise<void> {
  await fs.copy(source, destination, {
    overwrite: true,
    dereference: os.platform() === "win32",
  });
}

async function writeMetadata(snapshotPath: string, metadata: SnapshotMetadata): Promise<void> {
  await fs.writeJson(path.join(snapshotPath, "metadata.json"), metadata, { spaces: 2 });
}

async function readMetadata(snapshotPath: string, fallbackType: "config" | "backup"): Promise<SnapshotMetadata> {
  const metadataPath = path.join(snapshotPath, "metadata.json");
  if (await fs.pathExists(metadataPath)) {
    return fs.readJson(metadataPath);
  }

  const name = path.basename(snapshotPath);
  return {
    name,
    type: fallbackType,
    createdAt: new Date(0).toISOString(),
    reason: "Legacy snapshot without metadata",
    trigger: "legacy",
    folders: [],
  };
}

async function appendHistory(paths: ConfigStorePaths, event: Record<string, unknown>): Promise<void> {
  await fs.ensureDir(paths.baseDir);
  await fs.appendFile(paths.historyPath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
}

async function snapshotByCopy(
  snapshotPath: string,
  folders: ResolvedFolders,
  metadata: SnapshotMetadata,
): Promise<string | null> {
  const copied: ManagedFolderName[] = [];
  await fs.ensureDir(snapshotPath);

  for (const folder of managedFolders(folders)) {
    if (!(await hasContent(folder.path))) continue;
    await copyManagedFolder(folder.path, path.join(snapshotPath, folder.name));
    copied.push(folder.name);
  }

  if (copied.length === 0) {
    await fs.remove(snapshotPath);
    return null;
  }

  await writeMetadata(snapshotPath, { ...metadata, folders: copied });
  return snapshotPath;
}

export async function saveNamedConfig(name: string, options: ConfigStoreOptions = {}): Promise<string> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  const safeName = sanitizeSnapshotName(name);
  const snapshotPath = path.join(paths.configsDir, safeName);

  if ((await fs.pathExists(snapshotPath)) && !options.force) {
    throw new Error(`Config "${safeName}" already exists. Use --force to overwrite it.`);
  }

  if (await fs.pathExists(snapshotPath)) {
    const backupName = `${timestamp()}-replace-saved-${safeName}`;
    await fs.ensureDir(paths.backupsDir);
    await fs.move(snapshotPath, path.join(paths.backupsDir, backupName), { overwrite: false });
  }

  const result = await snapshotByCopy(snapshotPath, folders, {
    name: safeName,
    type: "config",
    createdAt: new Date().toISOString(),
    reason: `Manual save as "${safeName}"`,
    trigger: "save",
    folders: [],
  });

  if (!result) {
    throw new Error("No .claude, .codex, or .agents configuration found to save.");
  }

  await appendHistory(paths, { action: "save", name: safeName, path: result });
  return result;
}

export async function createConfigBackup(
  options: FolderOptions = {},
  reason = "Backup current configuration",
  trigger = "manual",
  source?: string,
): Promise<string | null> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  const safeSource = source ? sanitizeSnapshotName(source) : trigger;
  const name = `${timestamp()}-${safeSource}`;
  const snapshotPath = path.join(paths.backupsDir, name);

  const result = await snapshotByCopy(snapshotPath, folders, {
    name,
    type: "backup",
    createdAt: new Date().toISOString(),
    reason,
    trigger,
    source,
    folders: [],
  });

  if (result) {
    await appendHistory(paths, { action: "backup", name, reason, trigger, source, path: result });
  }

  return result;
}

async function backupCurrentByMove(
  folders: ResolvedFolders,
  reason: string,
  trigger: string,
  source?: string,
): Promise<string | null> {
  const paths = getConfigStorePaths(folders.rootDir);
  const safeSource = source ? sanitizeSnapshotName(source) : trigger;
  const name = `${timestamp()}-${safeSource}`;
  const backupPath = path.join(paths.backupsDir, name);
  const moved: ManagedFolderName[] = [];

  await fs.ensureDir(backupPath);

  for (const folder of managedFolders(folders)) {
    if (!(await hasContent(folder.path))) continue;
    await fs.move(folder.path, path.join(backupPath, folder.name), { overwrite: false });
    moved.push(folder.name);
  }

  if (moved.length === 0) {
    await fs.remove(backupPath);
    return null;
  }

  await writeMetadata(backupPath, {
    name,
    type: "backup",
    createdAt: new Date().toISOString(),
    reason,
    trigger,
    source,
    folders: moved,
  });
  await appendHistory(paths, { action: "backup", name, reason, trigger, source, path: backupPath });

  return backupPath;
}

async function restoreSnapshot(snapshotPath: string, folders: ResolvedFolders): Promise<ManagedFolderName[]> {
  const restored: ManagedFolderName[] = [];

  for (const folder of managedFolders(folders)) {
    const source = path.join(snapshotPath, folder.name);
    if (!(await fs.pathExists(source))) continue;
    await fs.ensureDir(path.dirname(folder.path));
    await copyManagedFolder(source, folder.path);
    restored.push(folder.name);
  }

  return restored;
}

export async function loadNamedConfig(name: string, options: FolderOptions = {}): Promise<{ backupPath: string | null; restored: ManagedFolderName[] }> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  const safeName = sanitizeSnapshotName(name);
  const snapshotPath = path.join(paths.configsDir, safeName);

  if (!(await fs.pathExists(snapshotPath))) {
    throw new Error(`Saved config not found: ${safeName}`);
  }

  const backupPath = await backupCurrentByMove(
    folders,
    `Before loading saved config "${safeName}"`,
    "load",
    safeName,
  );
  const restored = await restoreSnapshot(snapshotPath, folders);
  await appendHistory(paths, { action: "load", name: safeName, backupPath, restored });

  return { backupPath, restored };
}

export async function loadBackupSnapshot(name: string, options: FolderOptions = {}): Promise<{ backupPath: string | null; restored: ManagedFolderName[] }> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  const safeName = sanitizeSnapshotName(name);
  const snapshotPath = path.join(paths.backupsDir, safeName);

  if (!(await fs.pathExists(snapshotPath))) {
    throw new Error(`Backup not found: ${safeName}`);
  }

  const backupPath = await backupCurrentByMove(
    folders,
    `Before restoring backup "${safeName}"`,
    "backup-load",
    safeName,
  );
  const restored = await restoreSnapshot(snapshotPath, folders);
  await appendHistory(paths, { action: "backup-load", name: safeName, backupPath, restored });

  return { backupPath, restored };
}

export async function undoLastLoad(options: FolderOptions = {}): Promise<{ backupName: string; backupPath: string | null; restored: ManagedFolderName[] }> {
  const backups = await listConfigBackups(options);
  const lastLoadBackup = backups.find((backup) => (
    backup.metadata.trigger === "load" || backup.metadata.trigger === "backup-load"
  ));

  if (!lastLoadBackup) {
    throw new Error("No load backup found to undo.");
  }

  const result = await loadBackupSnapshot(lastLoadBackup.name, options);
  return { backupName: lastLoadBackup.name, ...result };
}

async function listSnapshots(dir: string, type: "config" | "backup"): Promise<SnapshotInfo[]> {
  if (!(await fs.pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const snapshots: SnapshotInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const snapshotPath = path.join(dir, entry.name);
    const metadata = await readMetadata(snapshotPath, type);
    snapshots.push({ name: entry.name, path: snapshotPath, metadata });
  }

  return snapshots.sort((a, b) => b.metadata.createdAt.localeCompare(a.metadata.createdAt));
}

export async function listSavedConfigs(options: FolderOptions = {}): Promise<SnapshotInfo[]> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  return listSnapshots(paths.configsDir, "config");
}

export async function listConfigBackups(options: FolderOptions = {}): Promise<SnapshotInfo[]> {
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  return listSnapshots(paths.backupsDir, "backup");
}

export function normalizeBackupRetentionDays(value = DEFAULT_BACKUP_RETENTION_DAYS): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Backup retention days must be a positive integer.");
  }

  return value;
}

function isRetentionManagedBackup(metadata: SnapshotMetadata, includeManual = false): boolean {
  return RETENTION_MANAGED_BACKUP_TRIGGERS.has(metadata.trigger)
    || (includeManual && metadata.trigger === "manual-backup");
}

function isPathInside(childPath: string, parentPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

async function realBackupStorePath(backupsDir: string): Promise<string | null> {
  if (!(await fs.pathExists(backupsDir))) return null;

  const stats = await fs.lstat(backupsDir);
  if (stats.isSymbolicLink()) {
    throw new Error("Backup directory cannot be a symlink.");
  }

  if (!stats.isDirectory()) {
    throw new Error("Backup path is not a directory.");
  }

  return fs.realpath(backupsDir);
}

function cleanupDateForSnapshot(snapshot: SnapshotInfo): Date | null {
  if (snapshot.metadata.type !== "backup") return null;

  const createdAt = new Date(snapshot.metadata.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  return createdAt;
}

async function removeBackupSnapshot(snapshot: SnapshotInfo, backupsRealPath: string): Promise<void> {
  const snapshotRealPath = await fs.realpath(snapshot.path);
  if (!isPathInside(snapshotRealPath, backupsRealPath)) {
    throw new Error(`Refusing to delete backup outside store: ${snapshot.name}`);
  }

  await fs.remove(snapshot.path);
}

export async function cleanConfigBackups(options: CleanConfigBackupsOptions = {}): Promise<CleanConfigBackupsResult> {
  const days = normalizeBackupRetentionDays(options.days);
  const folders = resolveConfigStoreFolders(options);
  const paths = getConfigStorePaths(folders.rootDir);
  const backupsRealPath = await realBackupStorePath(paths.backupsDir);
  const now = options.now ?? new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  if (!backupsRealPath) {
    return {
      cutoff: cutoffDate.toISOString(),
      deleted: [],
      failed: [],
      kept: [],
      skipped: [],
    };
  }

  const backups = await listSnapshots(paths.backupsDir, "backup");
  const deleted: SnapshotInfo[] = [];
  const failed: FailedConfigBackupClean[] = [];
  const kept: SnapshotInfo[] = [];
  const skipped: SkippedConfigBackup[] = [];
  const deletionCandidates: SnapshotInfo[] = [];

  for (const backup of backups) {
    if (!isRetentionManagedBackup(backup.metadata, options.includeManual)) {
      skipped.push({ snapshot: backup, reason: "not retention-managed" });
      continue;
    }

    const cleanupDate = cleanupDateForSnapshot(backup);
    if (!cleanupDate) {
      skipped.push({ snapshot: backup, reason: "missing valid backup metadata date" });
      continue;
    }

    if (cleanupDate < cutoffDate) {
      deletionCandidates.push(backup);
    } else {
      kept.push(backup);
    }
  }

  if (options.dryRun) {
    deleted.push(...deletionCandidates);
  } else {
    for (const backup of deletionCandidates) {
      try {
        await removeBackupSnapshot(backup, backupsRealPath);
        deleted.push(backup);
      } catch (error) {
        failed.push({
          snapshot: backup,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (deleted.length > 0 || failed.length > 0) {
      await appendHistory(paths, {
        action: "backup-clean",
        days,
        cutoff: cutoffDate.toISOString(),
        deleted: deleted.map((backup) => backup.name),
        failed: failed.map((entry) => ({ name: entry.snapshot.name, error: entry.error })),
        skipped: skipped.map((entry) => ({ name: entry.snapshot.name, reason: entry.reason })),
      });
    }
  }

  return {
    cutoff: cutoffDate.toISOString(),
    deleted,
    failed,
    kept,
    skipped,
  };
}
