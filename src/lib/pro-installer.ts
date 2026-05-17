import fs from "fs-extra";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { isTextFile, replaceClaudePathPlaceholder, replacePathPlaceholdersInDir } from "./platform.js";
import {
  AGENT_CATEGORIES,
  syncCategorySymlinks,
  isAgentCategory,
  applyPathPlaceholders,
} from "./agents-installer.js";
import { resolveFolders } from "./folder-paths.js";

const execAsync = promisify(exec);

const PREMIUM_REPO = "Melvynx/aiblueprint-cli-premium";
const PREMIUM_BRANCH = "main";
const CONFIG_FOLDER_CANDIDATES = ["agents-config", "ai-coding", "claude-code-config", "ai-config"] as const;

export type InstallProgressCallback = (
  file: string,
  type: "file" | "directory"
) => void;

interface InstallProConfigsOptions {
  githubToken: string;
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
  agentsFolder?: string;
  onProgress?: InstallProgressCallback;
}

type Route =
  | { kind: "claude"; relativePath: string }
  | { kind: "codex"; relativePath: string }
  | { kind: "agents-category"; category: "skills" | "agents"; relativePath: string }
  | { kind: "skip" };

/**
 * Maps a path inside the source config tree (relative to the config root) to
 * its install destination. Supports the new layout (claude-config/, codex-config/,
 * skills/, agents/) and the legacy flat layout (scripts/, settings.json,
 * commands/, .claude/...).
 */
function routePath(relativePath: string): Route {
  const segments = relativePath.split(path.sep);
  const first = segments[0];
  const rest = segments.slice(1).join(path.sep);

  if (first === "claude-config") {
    return { kind: "claude", relativePath: rest };
  }
  if (first === "codex-config") {
    return { kind: "codex", relativePath: rest };
  }
  if (isAgentCategory(first)) {
    return { kind: "agents-category", category: first, relativePath };
  }
  // Legacy: .claude/<stuff> means it goes into claudeDir/<stuff>
  if (first === ".claude") {
    return { kind: "claude", relativePath: rest };
  }
  // Legacy flat: scripts/, settings.json, commands/ at root → claudeDir
  return { kind: "claude", relativePath };
}

function getCacheRepoDir(): string {
  return path.join(
    os.homedir(),
    ".config",
    "aiblueprint",
    "pro-repos",
    "aiblueprint-cli-premium",
  );
}

async function execGitWithAuth(
  command: string,
  token: string,
  repoUrl: string,
  cwd?: string,
): Promise<void> {
  const authenticatedUrl = `https://x-access-token:${token}@${repoUrl.replace(/^https?:\/\//, '')}`;
  const fullCommand = `git ${command.replace(repoUrl, authenticatedUrl)}`;

  try {
    await execAsync(fullCommand, { cwd, timeout: 120000 });
  } catch (error) {
    throw new Error(
      `Git command failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

async function cloneOrUpdateRepo(token: string): Promise<string> {
  const cacheDir = getCacheRepoDir();
  const repoUrl = `https://github.com/${PREMIUM_REPO}.git`;

  if (await fs.pathExists(path.join(cacheDir, ".git"))) {
    try {
      await execGitWithAuth("pull", token, repoUrl, cacheDir);
    } catch (error) {
      await fs.remove(cacheDir);
      await fs.ensureDir(path.dirname(cacheDir));
      await execGitWithAuth(`clone ${repoUrl} ${cacheDir}`, token, repoUrl);
    }
  } else {
    await fs.ensureDir(path.dirname(cacheDir));
    await execGitWithAuth(`clone ${repoUrl} ${cacheDir}`, token, repoUrl);
  }

  for (const candidate of CONFIG_FOLDER_CANDIDATES) {
    const candidatePath = path.join(cacheDir, candidate);
    if (await fs.pathExists(candidatePath)) {
      return candidatePath;
    }
  }
  throw new Error("Premium repo missing config folder (agents-config, ai-coding, or claude-code-config)");
}

interface InstallDestinations {
  claudeDir: string;
  codexDir: string;
  agentsDir: string;
}

async function copyConfigFromCache(
  cacheConfigDir: string,
  dest: InstallDestinations,
  onProgress?: InstallProgressCallback,
): Promise<void> {
  const walk = async (dir: string, baseDir: string = dir): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".DS_Store" || entry.name === "node_modules") continue;

      const sourcePath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, sourcePath);
      const route = routePath(relativePath);

      if (route.kind === "skip") continue;

      // Agent categories: full tree handled by installCategoryToAgents-style copy.
      if (route.kind === "agents-category") {
        // Only handle when we hit the top-level category dir.
        if (relativePath.split(path.sep).length === 1) {
          await copyAgentCategory(
            sourcePath,
            route.category,
            dest.agentsDir,
            dest.claudeDir,
            onProgress,
          );
        }
        continue;
      }

      const targetBase =
        route.kind === "claude" ? dest.claudeDir : dest.codexDir;
      const targetPath = path.join(targetBase, route.relativePath);

      if (entry.isDirectory()) {
        await fs.ensureDir(targetPath);
        onProgress?.(relativePath, "directory");
        await walk(sourcePath, baseDir);
      } else if (isTextFile(entry.name)) {
        const content = await fs.readFile(sourcePath, "utf-8");
        const replaced = replaceClaudePathPlaceholder(content, dest.claudeDir);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, replaced, "utf-8");
        onProgress?.(relativePath, "file");
      } else {
        await fs.copy(sourcePath, targetPath, { overwrite: true });
        onProgress?.(relativePath, "file");
      }
    }
  };

  await walk(cacheConfigDir);
}

export async function copyAgentCategory(
  sourceCategoryDir: string,
  category: "skills" | "agents",
  agentsDir: string,
  claudeDir: string,
  onProgress?: InstallProgressCallback,
): Promise<void> {
  const agentsCategoryDir = path.join(agentsDir, category);
  await fs.ensureDir(agentsCategoryDir);

  const entries = await fs.readdir(sourceCategoryDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const src = path.join(sourceCategoryDir, entry.name);
    const dst = path.join(agentsCategoryDir, entry.name);

    const claudeTop = path.join(claudeDir, category, entry.name);
    const claudeStat = await fs.lstat(claudeTop).catch(() => null);
    if (claudeStat && !claudeStat.isSymbolicLink()) {
      onProgress?.(`${category}/${entry.name} (skipped - real dir in claude)`, "file");
      continue;
    }

    await fs.copy(src, dst, { overwrite: true });
    await applyPathPlaceholders(dst, claudeDir);
    onProgress?.(`${category}/${entry.name}`, entry.isDirectory() ? "directory" : "file");
  }
}

async function downloadFromPrivateGitHub(
  repo: string,
  branch: string,
  relativePath: string,
  targetPath: string,
  githubToken: string,
): Promise<boolean> {
  try {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${relativePath}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3.raw",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to download ${relativePath}: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    const content = await response.arrayBuffer();
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, Buffer.from(content));
    return true;
  } catch (error) {
    console.error(`Error downloading ${relativePath}:`, error);
    return false;
  }
}

async function downloadDirectoryFromPrivateGitHub(
  repo: string,
  branch: string,
  dirPath: string,
  targetDir: string,
  githubToken: string,
  onProgress?: InstallProgressCallback,
): Promise<boolean> {
  try {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${dirPath}?ref=${branch}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to list directory ${dirPath}: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    const files = await response.json();
    if (!Array.isArray(files)) {
      console.error(`Unexpected response for directory ${dirPath}`);
      return false;
    }

    await fs.ensureDir(targetDir);

    for (const file of files) {
      const relativePath = dirPath ? `${dirPath}/${file.name}` : file.name;
      const targetPath = path.join(targetDir, file.name);
      const displayPath = relativePath.replace(/^(agents-config|ai-coding|claude-code-config|ai-config)\//, "");

      if (file.type === "file") {
        onProgress?.(displayPath, "file");
        await downloadFromPrivateGitHub(
          repo,
          branch,
          relativePath,
          targetPath,
          githubToken,
        );
      } else if (file.type === "dir") {
        await downloadDirectoryFromPrivateGitHub(
          repo,
          branch,
          relativePath,
          targetPath,
          githubToken,
          onProgress,
        );
      }
    }

    return true;
  } catch (error) {
    console.error(`Error downloading directory ${dirPath}:`, error);
    return false;
  }
}

export async function installProConfigs(
  options: InstallProConfigsOptions,
): Promise<void> {
  const { githubToken, folder, claudeCodeFolder, codexFolder, agentsFolder, onProgress } = options;

  const { claudeDir, codexDir, agentsDir } = resolveFolders({
    folder,
    claudeCodeFolder,
    codexFolder,
    agentsFolder,
  });

  await fs.ensureDir(claudeDir);
  await fs.ensureDir(agentsDir);

  const dest: InstallDestinations = { claudeDir, codexDir, agentsDir };

  try {
    const cacheConfigDir = await cloneOrUpdateRepo(githubToken);
    await copyConfigFromCache(cacheConfigDir, dest, onProgress);
    await syncAllAgentSymlinks(agentsDir, claudeDir);
    return;
  } catch (error) {
    console.warn("Git caching failed, falling back to API download");
  }

  const tempDir = path.join(os.tmpdir(), `aiblueprint-premium-${Date.now()}`);

  try {
    let success = false;
    for (const candidate of CONFIG_FOLDER_CANDIDATES) {
      success = await downloadDirectoryFromPrivateGitHub(
        PREMIUM_REPO,
        PREMIUM_BRANCH,
        candidate,
        tempDir,
        githubToken,
        onProgress,
      );
      if (success) break;
    }

    if (!success) {
      throw new Error("Failed to download premium configurations");
    }

    await copyConfigFromCache(tempDir, dest, onProgress);
    await replacePathPlaceholdersInDir(claudeDir, claudeDir);
    for (const category of AGENT_CATEGORIES) {
      const agentsCategoryDir = path.join(agentsDir, category);
      if (await fs.pathExists(agentsCategoryDir)) {
        await replacePathPlaceholdersInDir(agentsCategoryDir, claudeDir);
      }
    }
    await syncAllAgentSymlinks(agentsDir, claudeDir);
  } catch (error) {
    throw new Error(
      `Failed to install premium configs: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    try {
      await fs.remove(tempDir);
    } catch {
    }
  }
}

async function syncAllAgentSymlinks(agentsDir: string, claudeDir: string): Promise<void> {
  for (const category of AGENT_CATEGORIES) {
    await syncCategorySymlinks(category, agentsDir, claudeDir, undefined, true);
  }
}
