import fs from "fs-extra";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { isTextFile, replaceClaudePathPlaceholder } from "./platform.js";

const execAsync = promisify(exec);

const PREMIUM_REPO = "Melvynx/aiblueprint-cli-premium";
const PREMIUM_BRANCH = "main";

export type InstallProgressCallback = (
  file: string,
  type: "file" | "directory"
) => void;

interface InstallProConfigsOptions {
  githubToken: string;
  claudeCodeFolder?: string;
  onProgress?: InstallProgressCallback;
}

/**
 * Get the cache directory path for the premium repository
 */
function getCacheRepoDir(): string {
  return path.join(
    os.homedir(),
    ".config",
    "aiblueprint",
    "pro-repos",
    "aiblueprint-cli-premium",
  );
}

/**
 * Execute a git command with safe authentication using token in URL
 */
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

/**
 * Clone or update the cached premium repository
 * Returns the path to the claude-code-config directory within the cache
 */
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

  return path.join(cacheDir, "claude-code-config");
}

/**
 * Copy files from cache to target directory with progress reporting
 */
async function copyConfigFromCache(
  cacheConfigDir: string,
  targetDir: string,
  onProgress?: InstallProgressCallback,
): Promise<void> {
  const walk = async (dir: string, baseDir: string = dir): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, sourcePath);

      // .claude/ subdirectory merges into target root (target IS ~/.claude)
      if (entry.isDirectory() && entry.name === ".claude" && dir === baseDir) {
        await walk(sourcePath, sourcePath);
        continue;
      }

      const targetPath = path.join(targetDir, relativePath);

      if (entry.isDirectory()) {
        await fs.ensureDir(targetPath);
        onProgress?.(relativePath, "directory");
        await walk(sourcePath, baseDir);
      } else if (isTextFile(entry.name)) {
        const content = await fs.readFile(sourcePath, "utf-8");
        const replaced = replaceClaudePathPlaceholder(content, targetDir);
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

/**
 * Download a file from a private GitHub repository
 */
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

/**
 * Download a directory from a private GitHub repository
 */
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
      const displayPath = relativePath.replace("claude-code-config/", "");

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

/**
 * Install premium configurations from private GitHub repository
 * Uses git-based caching for faster subsequent installs, with API fallback
 */
export async function installProConfigs(
  options: InstallProConfigsOptions,
): Promise<void> {
  const { githubToken, claudeCodeFolder, onProgress } = options;

  const claudeFolder =
    claudeCodeFolder || path.join(os.homedir(), ".claude");

  try {
    const cacheConfigDir = await cloneOrUpdateRepo(githubToken);
    await copyConfigFromCache(cacheConfigDir, claudeFolder, onProgress);
    return;
  } catch (error) {
    console.warn("Git caching failed, falling back to API download");
  }

  const tempDir = path.join(os.tmpdir(), `aiblueprint-premium-${Date.now()}`);

  try {
    const success = await downloadDirectoryFromPrivateGitHub(
      PREMIUM_REPO,
      PREMIUM_BRANCH,
      "claude-code-config",
      tempDir,
      githubToken,
      onProgress,
    );

    if (!success) {
      throw new Error("Failed to download premium configurations");
    }

    // Merge .claude/ subdirectory into root before copying
    const dotClaudeDir = path.join(tempDir, ".claude");
    if (await fs.pathExists(dotClaudeDir)) {
      await fs.copy(dotClaudeDir, tempDir, { overwrite: true });
      await fs.remove(dotClaudeDir);
    }

    await fs.copy(tempDir, claudeFolder, {
      overwrite: true,
    });
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
