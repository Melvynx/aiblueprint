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
  download_url: string | null;
}

export interface SyncItem {
  name: string;
  relativePath: string;
  type: "file" | "folder";
  status: "new" | "modified" | "unchanged";
  remoteSha?: string;
  localSha?: string;
  category: "commands" | "agents" | "skills" | "scripts";
}

export interface SyncResult {
  items: SyncItem[];
  newCount: number;
  modifiedCount: number;
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

async function computeLocalFileSha(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath);
    return computeFileSha(content);
  } catch {
    return null;
  }
}

async function computeFolderSha(folderPath: string): Promise<string | null> {
  try {
    if (!(await fs.pathExists(folderPath))) {
      return null;
    }

    const files = await getAllFilesRecursive(folderPath);
    if (files.length === 0) {
      return null;
    }

    const hashes: string[] = [];
    for (const file of files.sort()) {
      const content = await fs.readFile(file);
      hashes.push(computeFileSha(content));
    }

    return crypto.createHash("sha1").update(hashes.join("")).digest("hex");
  } catch {
    return null;
  }
}

async function getAllFilesRecursive(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      const subFiles = await getAllFilesRecursive(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function computeRemoteFolderSha(
  dirPath: string,
  githubToken: string
): Promise<string> {
  const hashes: string[] = [];
  await collectRemoteFolderHashes(dirPath, githubToken, hashes);
  hashes.sort();
  return crypto.createHash("sha1").update(hashes.join("")).digest("hex");
}

async function collectRemoteFolderHashes(
  dirPath: string,
  githubToken: string,
  hashes: string[]
): Promise<void> {
  const files = await listRemoteDirectory(dirPath, githubToken);

  for (const file of files) {
    if (file.type === "file") {
      hashes.push(file.sha);
    } else if (file.type === "dir") {
      await collectRemoteFolderHashes(
        `${dirPath}/${file.name}`,
        githubToken,
        hashes
      );
    }
  }
}

export async function analyzeSyncChanges(
  claudeDir: string,
  githubToken: string
): Promise<SyncResult> {
  const items: SyncItem[] = [];

  const commandsRemote = await listRemoteDirectory("commands", githubToken);
  for (const file of commandsRemote) {
    if (file.type === "file" && file.name.endsWith(".md")) {
      const localPath = path.join(claudeDir, "commands", file.name);
      const localSha = await computeLocalFileSha(localPath);

      let status: SyncItem["status"] = "new";
      if (localSha) {
        status = localSha === file.sha ? "unchanged" : "modified";
      }

      items.push({
        name: file.name.replace(".md", ""),
        relativePath: `commands/${file.name}`,
        type: "file",
        status,
        remoteSha: file.sha,
        localSha: localSha || undefined,
        category: "commands",
      });
    }
  }

  const agentsRemote = await listRemoteDirectory("agents", githubToken);
  for (const file of agentsRemote) {
    if (file.type === "file" && file.name.endsWith(".md")) {
      const localPath = path.join(claudeDir, "agents", file.name);
      const localSha = await computeLocalFileSha(localPath);

      let status: SyncItem["status"] = "new";
      if (localSha) {
        status = localSha === file.sha ? "unchanged" : "modified";
      }

      items.push({
        name: file.name.replace(".md", ""),
        relativePath: `agents/${file.name}`,
        type: "file",
        status,
        remoteSha: file.sha,
        localSha: localSha || undefined,
        category: "agents",
      });
    }
  }

  const skillsRemote = await listRemoteDirectory("skills", githubToken);
  if (skillsRemote.length > 0) {
    const remoteSha = await computeRemoteFolderSha("skills", githubToken);
    const localSha = await computeFolderSha(path.join(claudeDir, "skills"));

    let status: SyncItem["status"] = "new";
    if (localSha) {
      status = localSha === remoteSha ? "unchanged" : "modified";
    }

    items.push({
      name: "skills",
      relativePath: "skills",
      type: "folder",
      status,
      remoteSha,
      localSha: localSha || undefined,
      category: "skills",
    });
  }

  const scriptsRemote = await listRemoteDirectory("scripts", githubToken);
  if (scriptsRemote.length > 0) {
    const remoteSha = await computeRemoteFolderSha("scripts", githubToken);
    const localSha = await computeFolderSha(path.join(claudeDir, "scripts"));

    let status: SyncItem["status"] = "new";
    if (localSha) {
      status = localSha === remoteSha ? "unchanged" : "modified";
    }

    items.push({
      name: "scripts",
      relativePath: "scripts",
      type: "folder",
      status,
      remoteSha,
      localSha: localSha || undefined,
      category: "scripts",
    });
  }

  return {
    items,
    newCount: items.filter((i) => i.status === "new").length,
    modifiedCount: items.filter((i) => i.status === "modified").length,
    unchangedCount: items.filter((i) => i.status === "unchanged").length,
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

async function downloadDirectoryFromPrivateGitHub(
  dirPath: string,
  targetDir: string,
  githubToken: string
): Promise<boolean> {
  try {
    const files = await listRemoteDirectory(dirPath, githubToken);
    await fs.ensureDir(targetDir);

    for (const file of files) {
      const relativePath = `${dirPath}/${file.name}`;
      const targetPath = path.join(targetDir, file.name);

      if (file.type === "file") {
        await downloadFromPrivateGitHub(relativePath, targetPath, githubToken);
      } else if (file.type === "dir") {
        await downloadDirectoryFromPrivateGitHub(
          relativePath,
          targetPath,
          githubToken
        );
      }
    }

    return true;
  } catch {
    return false;
  }
}

export async function syncSelectedItems(
  claudeDir: string,
  items: SyncItem[],
  githubToken: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const item of items) {
    const targetPath = path.join(claudeDir, item.relativePath);

    if (item.type === "file") {
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
    } else {
      const ok = await downloadDirectoryFromPrivateGitHub(
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

  return { success, failed };
}
