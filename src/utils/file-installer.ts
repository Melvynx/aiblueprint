import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { downloadAndWriteFile, downloadFromGitHub, isGitHubAvailable } from './github.js';
import { findLocalConfigDir } from './claude-config.js';

export interface FileInstallOptions {
  sourceDir: string;
  targetPath: string;
  fileName: string;
  useGitHub?: boolean;
}

export async function installFileWithGitHubFallback(options: FileInstallOptions): Promise<void> {
  const { sourceDir, targetPath, fileName } = options;

  // Ensure target directory exists
  await fs.ensureDir(path.dirname(targetPath));

  // Determine if we should use GitHub
  const useGitHub = options.useGitHub ?? (await isGitHubAvailable());

  if (useGitHub) {
    // Try to download from GitHub
    const relativePath = `${sourceDir}/${fileName}`;
    const success = await downloadAndWriteFile(relativePath, targetPath);

    if (success) {
      return;
    }

    console.log(chalk.yellow(`⚠️  GitHub download failed for ${fileName}, falling back to local files`));
  }

  // Fallback to local files
  const localConfigDir = await findLocalConfigDir(sourceDir);

  if (!localConfigDir) {
    throw new Error(`Neither GitHub nor local ${sourceDir} directory found`);
  }

  const localFilePath = path.join(localConfigDir, fileName);

  if (!(await fs.pathExists(localFilePath))) {
    throw new Error(`File not found: ${fileName}`);
  }

  await fs.copy(localFilePath, targetPath);
}

export async function getFileContentWithGitHubFallback(sourceDir: string, fileName: string): Promise<string> {
  // Try GitHub first
  const useGitHub = await isGitHubAvailable();

  if (useGitHub) {
    const content = await downloadFromGitHub(`${sourceDir}/${fileName}`);
    if (content) {
      return content;
    }

    console.log(chalk.yellow(`⚠️  GitHub download failed for ${fileName}, falling back to local files`));
  }

  // Fallback to local files
  const localConfigDir = await findLocalConfigDir(sourceDir);

  if (!localConfigDir) {
    throw new Error(`Neither GitHub nor local ${sourceDir} directory found`);
  }

  const localFilePath = path.join(localConfigDir, fileName);

  if (!(await fs.pathExists(localFilePath))) {
    throw new Error(`File not found: ${fileName}`);
  }

  return await fs.readFile(localFilePath, 'utf-8');
}