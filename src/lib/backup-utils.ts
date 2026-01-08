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
