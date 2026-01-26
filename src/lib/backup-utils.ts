import fs from "fs-extra";
import path from "path";
import os from "os";

const BACKUP_BASE_DIR = path.join(os.homedir(), ".config", "aiblueprint", "backup");

export function getBackupDir(): string {
  return BACKUP_BASE_DIR;
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

export async function listBackups(): Promise<BackupInfo[]> {
  const exists = await fs.pathExists(BACKUP_BASE_DIR);
  if (!exists) {
    return [];
  }

  const entries = await fs.readdir(BACKUP_BASE_DIR, { withFileTypes: true });
  const backups: BackupInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const match = entry.name.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/);
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
      path: path.join(BACKUP_BASE_DIR, entry.name),
      date,
    });
  }

  return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function loadBackup(backupPath: string, claudeDir: string): Promise<void> {
  const exists = await fs.pathExists(backupPath);
  if (!exists) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  await fs.ensureDir(claudeDir);

  const itemsToCopy = ["commands", "agents", "skills", "scripts", "song", "settings.json"];

  for (const item of itemsToCopy) {
    const sourcePath = path.join(backupPath, item);
    const destPath = path.join(claudeDir, item);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, destPath, { overwrite: true });
    }
  }
}

export async function createBackup(claudeDir: string): Promise<string | null> {
  const exists = await fs.pathExists(claudeDir);
  if (!exists) {
    return null;
  }

  const files = await fs.readdir(claudeDir);
  const hasContent = files.some((f) => f !== ".DS_Store");
  if (!hasContent) {
    return null;
  }

  const timestamp = formatDate(new Date());
  const backupPath = path.join(BACKUP_BASE_DIR, timestamp);

  await fs.ensureDir(backupPath);

  const itemsToCopy = ["commands", "agents", "skills", "scripts", "song", "settings.json"];

  for (const item of itemsToCopy) {
    const sourcePath = path.join(claudeDir, item);
    const destPath = path.join(backupPath, item);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, destPath, { overwrite: true });
    }
  }

  return backupPath;
}
