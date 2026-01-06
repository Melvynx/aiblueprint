import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

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
  category: "commands" | "agents" | "skills" | "scripts";
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

async function listRemoteDirectory(
  dirPath: string,
  githubToken: string
): Promise<RemoteFile[]> {
  const apiUrl = `https://api.github.com/repos/${PREMIUM_REPO}/contents/claude-code-config/${dirPath}?ref=${PREMIUM_BRANCH}`;
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
    if (file.name === "node_modules") continue;

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
    if (item === "node_modules") continue;

    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
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
  const items = await fs.readdir(dir);

  for (const item of items) {
    if (item === "node_modules") continue;

    const fullPath = path.join(dir, item);
    const relativePath = `${basePath}/${item}`;
    const stat = await fs.stat(fullPath);
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
  githubToken: string
): Promise<SyncItem[]> {
  const items: SyncItem[] = [];
  const localDir = path.join(claudeDir, category);

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

  for (const localPath of localSet) {
    if (!remoteSet.has(localPath)) {
      const fullPath = path.join(localDir, localPath);
      const stat = await fs.stat(fullPath).catch(() => null);
      if (stat && !stat.isDirectory()) {
        items.push({
          name: localPath,
          relativePath: `${category}/${localPath}`,
          status: "deleted",
          category,
        });
      }
    }
  }

  return items;
}

export async function analyzeSyncChanges(
  claudeDir: string,
  githubToken: string
): Promise<SyncResult> {
  const allItems: SyncItem[] = [];

  const categories: Array<"commands" | "agents" | "skills" | "scripts"> = [
    "commands",
    "agents",
    "skills",
    "scripts",
  ];

  for (const category of categories) {
    const items = await analyzeCategory(category, claudeDir, githubToken);
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
  githubToken: string
): Promise<boolean> {
  try {
    const url = `https://raw.githubusercontent.com/${PREMIUM_REPO}/${PREMIUM_BRANCH}/claude-code-config/${relativePath}`;
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
    await fs.writeFile(targetPath, Buffer.from(content));
    return true;
  } catch {
    return false;
  }
}

export async function syncSelectedItems(
  claudeDir: string,
  items: SyncItem[],
  githubToken: string,
  onProgress?: (file: string, action: string) => void
): Promise<{ success: number; failed: number; deleted: number }> {
  let success = 0;
  let failed = 0;
  let deleted = 0;

  for (const item of items) {
    const targetPath = path.join(claudeDir, item.relativePath);

    if (item.status === "deleted") {
      onProgress?.(item.relativePath, "deleting");
      try {
        await fs.remove(targetPath);
        deleted++;
      } catch {
        failed++;
      }
    } else {
      onProgress?.(item.relativePath, item.status === "new" ? "adding" : "updating");
      const ok = await downloadFromPrivateGitHub(
        item.relativePath,
        targetPath,
        githubToken
      );
      if (ok) {
        success++;
      } else {
        failed++;
      }
    }
  }

  return { success, failed, deleted };
}
