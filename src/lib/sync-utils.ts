import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import { transformFileContent, isTextFile } from "./platform.js";
import {
  isAgentCategory,
  syncCategorySymlinks,
} from "./agents-installer.js";

const PREMIUM_REPO = "Melvynx/aiblueprint-cli-premium";
const PREMIUM_BRANCH = "main";

export interface RemoteFile {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

export interface SyncItem {
  name: string;
  relativePath: string;
  status: "new" | "modified" | "unchanged" | "deleted";
  category: "commands" | "agents" | "skills" | "scripts" | "settings";
  isFolder?: boolean;
}

export interface SyncResult {
  items: SyncItem[];
  newCount: number;
  modifiedCount: number;
  deletedCount: number;
  unchangedCount: number;
}

function computeFileSha(content: Buffer): string {
  const size = content.length;
  const header = `blob ${size}\0`;
  const fullContent = Buffer.concat([Buffer.from(header), content]);
  return crypto.createHash("sha1").update(fullContent).digest("hex");
}

let resolvedConfigFolder: string | null = null;

async function resolveRemoteConfigFolder(githubToken: string): Promise<string> {
  if (resolvedConfigFolder) return resolvedConfigFolder;
  for (const candidate of ["ai-config", "claude-code-config"]) {
    const apiUrl = `https://api.github.com/repos/${PREMIUM_REPO}/contents/${candidate}?ref=${PREMIUM_BRANCH}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (response.ok) {
      resolvedConfigFolder = candidate;
      return candidate;
    }
  }
  resolvedConfigFolder = "ai-config";
  return "ai-config";
}

async function listRemoteDirectory(
  dirPath: string,
  githubToken: string
): Promise<RemoteFile[]> {
  const configFolder = await resolveRemoteConfigFolder(githubToken);
  const apiUrl = `https://api.github.com/repos/${PREMIUM_REPO}/contents/${configFolder}/${dirPath}?ref=${PREMIUM_BRANCH}`;
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to list directory ${dirPath}: ${response.status}`);
  }

  const files = await response.json();
  if (!Array.isArray(files)) {
    return [];
  }

  return files;
}

async function listRemoteFilesRecursive(
  dirPath: string,
  githubToken: string,
  basePath: string = ""
): Promise<{ path: string; sha: string; isFolder: boolean }[]> {
  const results: { path: string; sha: string; isFolder: boolean }[] = [];
  const files = await listRemoteDirectory(dirPath, githubToken);

  for (const file of files) {
    if (file.name === "node_modules" || file.name === ".DS_Store") continue;

    const relativePath = basePath ? `${basePath}/${file.name}` : file.name;

    if (file.type === "file") {
      results.push({ path: relativePath, sha: file.sha, isFolder: false });
    } else if (file.type === "dir") {
      results.push({ path: relativePath, sha: "", isFolder: true });
      const subFiles = await listRemoteFilesRecursive(
        `${dirPath}/${file.name}`,
        githubToken,
        relativePath
      );
      results.push(...subFiles);
    }
  }

  return results;
}

async function computeLocalFileSha(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath);
    return computeFileSha(content);
  } catch {
    return null;
  }
}

async function listLocalFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  if (!(await fs.pathExists(dir))) {
    return files;
  }

  const items = await fs.readdir(dir);
  for (const item of items) {
    if (item === "node_modules" || item === ".DS_Store") continue;

    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory()) {
      files.push(item);
      const subFiles = await listLocalFilesRecursive(fullPath, item);
      files.push(...subFiles);
    } else {
      files.push(item);
    }
  }

  return files;
}

async function listLocalFilesRecursive(dir: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir).catch(() => [] as string[]);

  for (const item of items) {
    if (item === "node_modules" || item === ".DS_Store") continue;

    const fullPath = path.join(dir, item);
    const relativePath = `${basePath}/${item}`;
    const stat = await fs.stat(fullPath).catch(() => null);
    if (!stat) continue;
    if (stat.isDirectory()) {
      files.push(relativePath);
      const subFiles = await listLocalFilesRecursive(fullPath, relativePath);
      files.push(...subFiles);
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

async function analyzeCategory(
  category: "commands" | "agents" | "skills" | "scripts",
  claudeDir: string,
  agentsDir: string,
  githubToken: string
): Promise<SyncItem[]> {
  const items: SyncItem[] = [];
  const localBase = isAgentCategory(category) ? agentsDir : claudeDir;
  const localDir = path.join(localBase, category);

  const remoteFiles = await listRemoteFilesRecursive(category, githubToken);
  const localFiles = await listLocalFiles(localDir);

  const remoteSet = new Map<string, { sha: string; isFolder: boolean }>();
  for (const rf of remoteFiles) {
    remoteSet.set(rf.path, { sha: rf.sha, isFolder: rf.isFolder });
  }

  const localSet = new Set(localFiles);

  for (const [remotePath, { sha, isFolder }] of remoteSet) {
    const localPath = path.join(localDir, remotePath);

    if (isFolder) {
      continue;
    }

    if (!localSet.has(remotePath)) {
      items.push({
        name: remotePath,
        relativePath: `${category}/${remotePath}`,
        status: "new",
        category,
      });
    } else {
      const localSha = await computeLocalFileSha(localPath);
      if (localSha !== sha) {
        items.push({
          name: remotePath,
          relativePath: `${category}/${remotePath}`,
          status: "modified",
          category,
        });
      } else {
        items.push({
          name: remotePath,
          relativePath: `${category}/${remotePath}`,
          status: "unchanged",
          category,
        });
      }
    }
  }

  const deletedPaths = new Set<string>();

  for (const localPath of localSet) {
    if (!remoteSet.has(localPath)) {
      const pathParts = localPath.split("/");
      const parentAlreadyDeleted = pathParts.some((_, idx) => {
        if (idx === 0) return false;
        const parentPath = pathParts.slice(0, idx).join("/");
        return deletedPaths.has(parentPath);
      });

      if (parentAlreadyDeleted) {
        continue;
      }

      const fullPath = path.join(localDir, localPath);
      const stat = await fs.stat(fullPath).catch(() => null);
      if (stat) {
        const isFolder = stat.isDirectory();
        items.push({
          name: localPath,
          relativePath: `${category}/${localPath}`,
          status: "deleted",
          category,
          isFolder,
        });
        if (isFolder) {
          deletedPaths.add(localPath);
        }
      }
    }
  }

  return items;
}

export async function analyzeSyncChanges(
  claudeDir: string,
  githubToken: string,
  agentsDir: string
): Promise<SyncResult> {
  const allItems: SyncItem[] = [];

  const categories: Array<"commands" | "agents" | "skills" | "scripts"> = [
    "commands",
    "agents",
    "skills",
    "scripts",
  ];

  for (const category of categories) {
    const items = await analyzeCategory(category, claudeDir, agentsDir, githubToken);
    allItems.push(...items);
  }

  return {
    items: allItems,
    newCount: allItems.filter((i) => i.status === "new").length,
    modifiedCount: allItems.filter((i) => i.status === "modified").length,
    deletedCount: allItems.filter((i) => i.status === "deleted").length,
    unchangedCount: allItems.filter((i) => i.status === "unchanged").length,
  };
}

async function downloadFromPrivateGitHub(
  relativePath: string,
  targetPath: string,
  githubToken: string,
  claudeDir: string
): Promise<boolean> {
  try {
    const configFolder = await resolveRemoteConfigFolder(githubToken);
    const url = `https://raw.githubusercontent.com/${PREMIUM_REPO}/${PREMIUM_BRANCH}/${configFolder}/${relativePath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) {
      return false;
    }

    const content = await response.arrayBuffer();
    await fs.ensureDir(path.dirname(targetPath));

    if (isTextFile(relativePath)) {
      const textContent = Buffer.from(content).toString("utf-8");
      const transformedContent = transformFileContent(textContent, claudeDir);
      await fs.writeFile(targetPath, transformedContent, "utf-8");
    } else {
      await fs.writeFile(targetPath, Buffer.from(content));
    }

    return true;
  } catch {
    return false;
  }
}

export async function syncSelectedItems(
  claudeDir: string,
  items: SyncItem[],
  githubToken: string,
  agentsDir: string,
  onProgress?: (file: string, action: string) => void
): Promise<{ success: number; failed: number; deleted: number }> {
  let success = 0;
  let failed = 0;
  let deleted = 0;
  const touchedAgentCategories = new Set<string>();

  for (const item of items) {
    const useAgents = isAgentCategory(item.category);
    const baseDir = useAgents ? agentsDir : claudeDir;
    const targetPath = path.join(baseDir, item.relativePath);

    if (useAgents) {
      const topName = item.name.split("/")[0];
      const claudeTop = path.join(claudeDir, item.category, topName);
      const claudeTopStat = await fs.lstat(claudeTop).catch(() => null);
      if (claudeTopStat && !claudeTopStat.isSymbolicLink()) {
        onProgress?.(item.relativePath, "skipping (real dir in .claude)");
        failed++;
        continue;
      }
    }

    if (item.status === "deleted") {
      onProgress?.(item.relativePath, "deleting");
      try {
        await fs.remove(targetPath);
        deleted++;
        if (useAgents) touchedAgentCategories.add(item.category);
      } catch {
        failed++;
      }
    } else {
      onProgress?.(item.relativePath, item.status === "new" ? "adding" : "updating");
      const ok = await downloadFromPrivateGitHub(
        item.relativePath,
        targetPath,
        githubToken,
        claudeDir
      );
      if (ok) {
        success++;
        if (useAgents) touchedAgentCategories.add(item.category);
      } else {
        failed++;
      }
    }
  }

  for (const category of touchedAgentCategories) {
    if (isAgentCategory(category)) {
      await syncCategorySymlinks(category, agentsDir, claudeDir, undefined, true);
    }
  }

  return { success, failed, deleted };
}
