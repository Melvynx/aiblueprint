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

const AGENTS_BACKUP_SUBDIR = ".agents";
const CLAUDE_ITEMS = ["commands", "agents", "skills", "scripts", "settings.json"];

async function copyForBackup(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  // Skip symlinks: they reference paths that get backed up separately
  // (e.g. ~/.claude/skills/* -> ~/.agents/skills/*). Recreating them in
  // the backup folder is fragile (Windows EPERM without admin) and
  // unnecessary because setup re-creates the links from .agents content.
  await fs.copy(sourcePath, destPath, {
    overwrite: true,
    dereference: false,
    filter: async (src) => {
      try {
        const stat = await fs.lstat(src);
        return !stat.isSymbolicLink();
      } catch {
        return true;
      }
    },
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
  agentsDir?: string,
): Promise<void> {
  const exists = await fs.pathExists(backupPath);
  if (!exists) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

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

export async function createBackup(
  claudeDir: string,
  agentsDir?: string,
): Promise<string | null> {
  const claudeHasContent = await hasMeaningfulContent(claudeDir);
  const agentsHasContent = agentsDir
    ? await hasMeaningfulContent(agentsDir)
    : false;

  if (!claudeHasContent && !agentsHasContent) {
    return null;
  }

  const timestamp = formatDate(new Date());
  const backupPath = path.join(BACKUP_BASE_DIR, timestamp);

  await fs.ensureDir(backupPath);

  if (claudeHasContent) {
    for (const item of CLAUDE_ITEMS) {
      const sourcePath = path.join(claudeDir, item);
      const destPath = path.join(backupPath, item);

      if (await fs.pathExists(sourcePath)) {
        await copyForBackup(sourcePath, destPath);
      }
    }
  }

  if (agentsHasContent && agentsDir) {
    const destPath = path.join(backupPath, AGENTS_BACKUP_SUBDIR);
    await copyForBackup(agentsDir, destPath);
  }

  return backupPath;
}
