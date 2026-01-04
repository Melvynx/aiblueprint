import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

export class SimpleSpinner {
  private message: string = "";

  start(message: string) {
    this.message = message;
    console.log(chalk.gray(`⏳ ${message}...`));
  }

  stop(message: string) {
    console.log(chalk.green(`✓ ${message}`));
  }
}

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config";

export async function downloadFromGitHub(
  relativePath: string,
  targetPath: string,
): Promise<boolean> {
  try {
    const url = `${GITHUB_RAW_BASE}/${relativePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    const content = await response.arrayBuffer();
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, Buffer.from(content));
    return true;
  } catch (error) {
    return false;
  }
}

export async function downloadDirectoryFromGitHub(
  dirPath: string,
  targetDir: string,
): Promise<boolean> {
  try {
    const apiUrl = `https://api.github.com/repos/Melvynx/aiblueprint-cli/contents/claude-code-config/${dirPath}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(
        chalk.yellow(
          `  Warning: Failed to fetch directory from GitHub: ${dirPath} (HTTP ${response.status})`,
        ),
      );
      return false;
    }

    const files = await response.json();
    if (!Array.isArray(files)) {
      console.error(
        chalk.yellow(
          `  Warning: Invalid response from GitHub API for: ${dirPath}`,
        ),
      );
      return false;
    }

    await fs.ensureDir(targetDir);

    let allSuccess = true;
    for (const file of files) {
      const relativePath = `${dirPath}/${file.name}`;
      const targetPath = path.join(targetDir, file.name);

      if (file.type === "file") {
        const success = await downloadFromGitHub(relativePath, targetPath);
        if (!success) {
          console.error(
            chalk.yellow(`  Warning: Failed to download file: ${relativePath}`),
          );
          allSuccess = false;
        }
      } else if (file.type === "dir") {
        const success = await downloadDirectoryFromGitHub(
          relativePath,
          targetPath,
        );
        if (!success) {
          allSuccess = false;
        }
      }
    }

    return allSuccess;
  } catch (error) {
    console.error(
      chalk.yellow(
        `  Warning: Error downloading directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return false;
  }
}
