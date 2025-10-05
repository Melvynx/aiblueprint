import fs from 'fs-extra';
import path from 'path';

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config';

export async function downloadFromGitHub(relativePath: string): Promise<string | null> {
  try {
    const url = `${GITHUB_RAW_BASE}/${relativePath}`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    return null;
  }
}

export async function listFilesFromGitHub(dirPath: string): Promise<string[]> {
  try {
    const apiUrl = `https://api.github.com/repos/Melvynx/aiblueprint-cli/contents/claude-code-config/${dirPath}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return [];
    }
    const files = await response.json();
    return files
      .filter((file: any) => file.type === 'file')
      .map((file: any) => file.name);
  } catch (error) {
    return [];
  }
}

export async function isGitHubAvailable(): Promise<boolean> {
  try {
    const testUrl = `${GITHUB_RAW_BASE}/commands/commit.md`;
    const testResponse = await fetch(testUrl);
    return testResponse.ok;
  } catch {
    return false;
  }
}

export async function downloadAndWriteFile(relativePath: string, targetPath: string): Promise<boolean> {
  const content = await downloadFromGitHub(relativePath);
  if (content) {
    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content);
    return true;
  }
  return false;
}