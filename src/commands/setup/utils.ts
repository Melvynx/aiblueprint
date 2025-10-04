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
      return false;
    }

    const files = await response.json();
    if (!Array.isArray(files)) {
      return false;
    }

    await fs.ensureDir(targetDir);

    for (const file of files) {
      const relativePath = `${dirPath}/${file.name}`;
      const targetPath = path.join(targetDir, file.name);

      if (file.type === "file") {
        await downloadFromGitHub(relativePath, targetPath);
      } else if (file.type === "dir") {
        await downloadDirectoryFromGitHub(relativePath, targetPath);
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}
