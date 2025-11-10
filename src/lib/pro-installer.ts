import fs from "fs-extra";
import os from "os";
import path from "path";

const PREMIUM_REPO = "Melvynx/aiblueprint-cli-premium";
const PREMIUM_BRANCH = "main";

interface InstallProConfigsOptions {
  githubToken: string;
  claudeCodeFolder?: string;
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

      if (file.type === "file") {
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
 */
export async function installProConfigs(
  options: InstallProConfigsOptions,
): Promise<void> {
  const { githubToken, claudeCodeFolder } = options;

  // Determine Claude Code folder
  const claudeFolder =
    claudeCodeFolder || path.join(os.homedir(), ".claude");

  // Create a temporary directory for premium configs
  const tempDir = path.join(os.tmpdir(), `aiblueprint-premium-${Date.now()}`);

  try {
    // Download the entire claude-code-config directory from premium repo
    const success = await downloadDirectoryFromPrivateGitHub(
      PREMIUM_REPO,
      PREMIUM_BRANCH,
      "claude-code-config",
      tempDir,
      githubToken,
    );

    if (!success) {
      throw new Error("Failed to download premium configurations");
    }

    // Copy premium configs to Claude Code folder
    // We merge the configs, premium files will override free files
    await fs.copy(tempDir, claudeFolder, {
      overwrite: true,
      recursive: true,
    });

    console.log(`✓ Premium configurations installed to ${claudeFolder}`);
  } catch (error) {
    throw new Error(
      `Failed to install premium configs: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    // Clean up temp directory
    try {
      await fs.remove(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}
