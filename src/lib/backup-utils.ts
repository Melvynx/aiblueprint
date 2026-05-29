import fs from "fs-extra";
import path from "path";
import os from "os";

const BACKUP_BASE_DIR = path.join(os.homedir(), ".config", "aiblueprint", "backup");

export function getBackupDir(): string {
  return process.env.AIBLUEPRINT_BACKUP_DIR || BACKUP_BASE_DIR;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

export interface BackupInfo {
  name: string;
  path: string;
  date: Date;
}

export function createBackupNameSuffix(value: string): string {
  return value
    .trim()
    .replace(/^[a-zA-Z]:/, (drive) => drive.replace(":", ""))
    .replace(/[\\/]+/g, "--")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "root";
}

export function createTimestampedBackupName(suffix?: string, date = new Date()): string {
  const base = formatDate(date);
  if (!suffix) return base;
  return `${base}--${createBackupNameSuffix(suffix)}`;
}

export async function listBackups(): Promise<BackupInfo[]> {
  const backupBaseDir = getBackupDir();
  const exists = await fs.pathExists(backupBaseDir);
  if (!exists) {
    return [];
  }

  const entries = await fs.readdir(backupBaseDir, { withFileTypes: true });
  const backups: BackupInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const match = entry.name.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})(?:--.+)?$/);
    if (!match) continue;

    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );

    backups.push({
      name: entry.name,
      path: path.join(backupBaseDir, entry.name),
      date,
    });
  }

  return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

const AGENTS_BACKUP_SUBDIR = ".agents";
const CLAUDE_ITEMS = ["commands", "agents", "skills", "scripts", "settings.json"];
const MANAGED_FOLDERS = [".claude", ".codex", ".agents"] as const;

async function copyForBackup(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  await fs.copy(sourcePath, destPath, {
    overwrite: true,
    dereference: false,
  });
}

async function hasMeaningfulContent(dir: string): Promise<boolean> {
  if (!(await fs.pathExists(dir))) return false;
  const files = await fs.readdir(dir);
  return files.some((f) => f !== ".DS_Store");
}

export async function loadBackup(
  backupPath: string,
  claudeDir: string,
  codexDir?: string,
  agentsDir?: string,
): Promise<void> {
  const exists = await fs.pathExists(backupPath);
  if (!exists) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  const managedDestinations: Record<typeof MANAGED_FOLDERS[number], string | undefined> = {
    ".claude": claudeDir,
    ".codex": codexDir,
    ".agents": agentsDir,
  };

  let restoredManagedFolder = false;
  for (const folderName of MANAGED_FOLDERS) {
    const sourcePath = path.join(backupPath, folderName);
    const destPath = managedDestinations[folderName];
    if (!destPath || !(await fs.pathExists(sourcePath))) continue;

    await fs.ensureDir(destPath);
    await copyForBackup(sourcePath, destPath);
    restoredManagedFolder = true;
  }

  if (!restoredManagedFolder) {
    await fs.ensureDir(claudeDir);

    for (const item of CLAUDE_ITEMS) {
      const sourcePath = path.join(backupPath, item);
      const destPath = path.join(claudeDir, item);

      if (await fs.pathExists(sourcePath)) {
        await copyForBackup(sourcePath, destPath);
      }
    }

    if (agentsDir) {
      const agentsBackupPath = path.join(backupPath, AGENTS_BACKUP_SUBDIR);
      if (await fs.pathExists(agentsBackupPath)) {
        await fs.ensureDir(agentsDir);
        await copyForBackup(agentsBackupPath, agentsDir);
      }
    }
  }
}

export async function createBackup(
  claudeDir: string,
  codexDir?: string,
  agentsDir?: string,
): Promise<string | null> {
  const claudeHasContent = await hasMeaningfulContent(claudeDir);
  const codexHasContent = codexDir
    ? await hasMeaningfulContent(codexDir)
    : false;
  const agentsHasContent = agentsDir
    ? await hasMeaningfulContent(agentsDir)
    : false;

  if (!claudeHasContent && !codexHasContent && !agentsHasContent) {
    return null;
  }

  const backupPath = path.join(getBackupDir(), createTimestampedBackupName());

  await fs.ensureDir(backupPath);

  if (claudeHasContent) {
    await copyForBackup(claudeDir, path.join(backupPath, ".claude"));
  }

  if (codexHasContent && codexDir) {
    await copyForBackup(codexDir, path.join(backupPath, ".codex"));
  }

  if (agentsHasContent && agentsDir) {
    const destPath = path.join(backupPath, AGENTS_BACKUP_SUBDIR);
    await copyForBackup(agentsDir, destPath);
  }

  return backupPath;
}
