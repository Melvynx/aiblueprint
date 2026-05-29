import crypto from "crypto";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { getBackupDir } from "./backup-utils.js";
import { getConfigStorePaths } from "./configs-store.js";
import { resolveFolders, type FolderOptions, type ResolvedFolders } from "./folder-paths.js";

const MANAGED_FOLDERS = [".claude", ".codex", ".agents"] as const;
type ManagedFolderName = typeof MANAGED_FOLDERS[number];

const SESSION_PATHS: Record<ManagedFolderName, string[]> = {
  ".claude": ["projects", "sessions"],
  ".codex": ["sessions", "archived_sessions", "browser/sessions"],
  ".agents": ["sessions"],
};

type SnapshotType = "config" | "backup" | "legacy-backup";

interface SnapshotSource {
  name: string;
  path: string;
  type: SnapshotType;
}

export interface SessionImportEntry {
  folder: ManagedFolderName;
  sessionRoot: string;
  from: string;
  to: string;
  snapshot: string;
}

export interface SessionDuplicateEntry {
  folder: ManagedFolderName;
  sessionRoot: string;
  from: string;
  existing: string;
  snapshot: string;
}

export interface SessionConflictEntry {
  folder: ManagedFolderName;
  sessionRoot: string;
  from: string;
  to: string;
  snapshot: string;
  reason: string;
}

export interface SessionUnifyResult {
  rootDir: string;
  scannedSnapshots: SnapshotSource[];
  imported: SessionImportEntry[];
  duplicates: SessionDuplicateEntry[];
  conflicts: SessionConflictEntry[];
}

export interface SessionUnifyOptions extends FolderOptions {
  dryRun?: boolean;
}

async function listSnapshotSources(parentDir: string, type: SnapshotType): Promise<SnapshotSource[]> {
  if (!(await fs.pathExists(parentDir))) return [];

  const entries = await fs.readdir(parentDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      path: path.join(parentDir, entry.name),
      type,
    }));
}

async function collectSnapshotSources(folders: ResolvedFolders): Promise<SnapshotSource[]> {
  const storePaths = getConfigStorePaths(folders.rootDir);
  const sources = [
    ...await listSnapshotSources(storePaths.configsDir, "config"),
    ...await listSnapshotSources(storePaths.backupsDir, "backup"),
  ];

  if (path.resolve(folders.rootDir) === os.homedir()) {
    sources.push(...await listSnapshotSources(getBackupDir(), "legacy-backup"));
  }

  return sources.sort((a, b) => a.name.localeCompare(b.name));
}

async function snapshotFolderPath(snapshot: SnapshotSource, folder: ManagedFolderName): Promise<string | null> {
  const managedPath = path.join(snapshot.path, folder);
  if (await fs.pathExists(managedPath)) return managedPath;

  if (snapshot.type === "legacy-backup") {
    if (folder === ".claude") return snapshot.path;

    const legacyAgentsPath = path.join(snapshot.path, ".agents");
    if (folder === ".agents" && await fs.pathExists(legacyAgentsPath)) {
      return legacyAgentsPath;
    }
  }

  return null;
}

function sanitizeSourceTag(snapshot: SnapshotSource): string {
  return `${snapshot.type}-${snapshot.name}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "snapshot";
}

function withSourceSuffix(targetPath: string, sourceTag: string, index: number): string {
  const parsed = path.parse(targetPath);
  const suffix = index === 1 ? sourceTag : `${sourceTag}-${index}`;

  if (parsed.ext && parsed.name) {
    return path.join(parsed.dir, `${parsed.name}--${suffix}${parsed.ext}`);
  }

  return path.join(parsed.dir, `${parsed.base}--${suffix}`);
}

async function uniqueConflictPath(targetPath: string, sourceTag: string): Promise<string> {
  let index = 1;

  while (true) {
    const candidate = withSourceSuffix(targetPath, sourceTag, index);
    if (!(await fs.pathExists(candidate))) return candidate;
    index++;
  }
}

function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function hashPath(targetPath: string): Promise<string> {
  const stat = await fs.lstat(targetPath);

  if (stat.isSymbolicLink()) {
    return hashString(`symlink:${await fs.readlink(targetPath)}`);
  }

  if (stat.isFile()) {
    const hash = crypto.createHash("sha256");
    hash.update("file:");
    hash.update(await fs.readFile(targetPath));
    return hash.digest("hex");
  }

  if (stat.isDirectory()) {
    const entries = (await fs.readdir(targetPath, { withFileTypes: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const hash = crypto.createHash("sha256");
    hash.update("dir:");

    for (const entry of entries) {
      hash.update(entry.name);
      hash.update("\0");
      hash.update(await hashPath(path.join(targetPath, entry.name)));
      hash.update("\0");
    }

    return hash.digest("hex");
  }

  return hashString(`other:${stat.mode}:${stat.size}`);
}

async function mergeSessionPath(params: {
  sourcePath: string;
  destinationPath: string;
  folder: ManagedFolderName;
  sessionRoot: string;
  snapshot: SnapshotSource;
  sourceTag: string;
  result: SessionUnifyResult;
  dryRun: boolean;
}): Promise<void> {
  const {
    sourcePath,
    destinationPath,
    folder,
    sessionRoot,
    snapshot,
    sourceTag,
    result,
    dryRun,
  } = params;
  const sourceStat = await fs.lstat(sourcePath).catch(() => null);
  if (!sourceStat) return;

  const destinationStat = await fs.lstat(destinationPath).catch(() => null);

  if (sourceStat.isDirectory() && (destinationStat?.isDirectory() || dryRun)) {
    const entries = await fs.readdir(sourcePath);
    if (!dryRun && destinationStat?.isDirectory()) {
      await fs.ensureDir(destinationPath);
    }
    for (const entry of entries) {
      await mergeSessionPath({
        sourcePath: path.join(sourcePath, entry),
        destinationPath: path.join(destinationPath, entry),
        folder,
        sessionRoot,
        snapshot,
        sourceTag,
        result,
        dryRun,
      });
    }
    return;
  }

  if (!destinationStat) {
    if (!dryRun) {
      await fs.ensureDir(path.dirname(destinationPath));
      await fs.copy(sourcePath, destinationPath, {
        overwrite: false,
        dereference: false,
      });
    }
    result.imported.push({
      folder,
      sessionRoot,
      from: sourcePath,
      to: destinationPath,
      snapshot: snapshot.name,
    });
    return;
  }

  if (await hashPath(sourcePath) === await hashPath(destinationPath)) {
    result.duplicates.push({
      folder,
      sessionRoot,
      from: sourcePath,
      existing: destinationPath,
      snapshot: snapshot.name,
    });
    return;
  }

  const conflictPath = await uniqueConflictPath(destinationPath, sourceTag);
  if (!dryRun) {
    await fs.ensureDir(path.dirname(conflictPath));
    await fs.copy(sourcePath, conflictPath, {
      overwrite: false,
      dereference: false,
    });
  }
  result.conflicts.push({
    folder,
    sessionRoot,
    from: sourcePath,
    to: conflictPath,
    snapshot: snapshot.name,
    reason: "Same session path with different content",
  });
}

export async function unifySessionsFromSnapshots(
  options: SessionUnifyOptions = {},
): Promise<SessionUnifyResult> {
  const folders = resolveFolders(options);
  const dryRun = Boolean(options.dryRun);
  const snapshots = await collectSnapshotSources(folders);
  const destinationByFolder: Record<ManagedFolderName, string> = {
    ".claude": folders.claudeDir,
    ".codex": folders.codexDir,
    ".agents": folders.agentsDir,
  };
  const result: SessionUnifyResult = {
    rootDir: folders.rootDir,
    scannedSnapshots: snapshots,
    imported: [],
    duplicates: [],
    conflicts: [],
  };

  for (const snapshot of snapshots) {
    const sourceTag = sanitizeSourceTag(snapshot);

    for (const folder of MANAGED_FOLDERS) {
      const sourceFolder = await snapshotFolderPath(snapshot, folder);
      if (!sourceFolder) continue;

      for (const sessionRoot of SESSION_PATHS[folder]) {
        const sourcePath = path.join(sourceFolder, sessionRoot);
        if (!(await fs.pathExists(sourcePath))) continue;

        await mergeSessionPath({
          sourcePath,
          destinationPath: path.join(destinationByFolder[folder], sessionRoot),
          folder,
          sessionRoot,
          snapshot,
          sourceTag,
          result,
          dryRun,
        });
      }
    }
  }

  return result;
}

export async function previewSessionsFromSnapshots(
  options: SessionUnifyOptions = {},
): Promise<SessionUnifyResult> {
  return unifySessionsFromSnapshots({ ...options, dryRun: true });
}
