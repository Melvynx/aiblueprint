import fs from "fs-extra";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const OPENCLAW_PRO_REPO = "Melvynx/openclawpro";
const OPENCLAW_PRO_BRANCH = "main";

export type InstallProgressCallback = (
  file: string,
  type: "file" | "directory"
) => void;

interface InstallOpenclawProConfigsOptions {
  githubToken: string;
  openclawFolder?: string;
  onProgress?: InstallProgressCallback;
}

function getCacheRepoDir(): string {
  return path.join(
    os.homedir(),
    ".config",
    "openclaw",
    "pro-repos",
    "openclawpro"
  );
}

async function execGitWithAuth(
  command: string,
  token: string,
  repoUrl: string,
  cwd?: string
): Promise<void> {
  const authenticatedUrl = `https://x-access-token:${token}@${repoUrl.replace(/^https?:\/\//, "")}`;
  const fullCommand = `git ${command.replace(repoUrl, authenticatedUrl)}`;

  try {
    await execAsync(fullCommand, { cwd, timeout: 120000 });
  } catch (error) {
    throw new Error(
      `Git command failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function cloneOrUpdateRepo(token: string): Promise<string> {
  const cacheDir = getCacheRepoDir();
  const repoUrl = `https://github.com/${OPENCLAW_PRO_REPO}.git`;

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

  return path.join(cacheDir, "openclaw-config");
}

async function copyConfigFromCache(
  cacheConfigDir: string,
  targetDir: string,
  onProgress?: InstallProgressCallback
): Promise<void> {
  const walk = async (dir: string, baseDir: string = dir): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, sourcePath);
      const targetPath = path.join(targetDir, relativePath);

      if (entry.isDirectory()) {
        await fs.ensureDir(targetPath);
        onProgress?.(relativePath, "directory");
        await walk(sourcePath, baseDir);
      } else {
        await fs.copy(sourcePath, targetPath, { overwrite: true });
        onProgress?.(relativePath, "file");
      }
    }
  };

  await walk(cacheConfigDir);
}

export async function installOpenclawProConfigs(
  options: InstallOpenclawProConfigsOptions
): Promise<void> {
  const { githubToken, openclawFolder, onProgress } = options;

  const targetFolder = openclawFolder || path.join(os.homedir(), ".openclaw");

  try {
    const cacheConfigDir = await cloneOrUpdateRepo(githubToken);
    await copyConfigFromCache(cacheConfigDir, targetFolder, onProgress);
    return;
  } catch (error) {
    throw new Error(
      `Failed to install OpenClaw Pro configs: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
