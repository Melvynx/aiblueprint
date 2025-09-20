import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function parseYamlFrontmatter(content: string): { metadata: any; body: string } {
  const lines = content.split('\n');

  if (lines[0] !== '---') {
    return { metadata: {}, body: content };
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (endIndex === -1) {
    return { metadata: {}, body: content };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join('\n');

  const metadata: any = {};
  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });

  return { metadata, body };
}

export function getLocalConfigPaths(subDir: string): string[] {
  return [
    path.join(__dirname, `../claude-code-config/${subDir}`),  // From dist/
    path.join(__dirname, `../../claude-code-config/${subDir}`), // From src/
  ];
}

export async function findLocalConfigDir(subDir: string): Promise<string | null> {
  const possiblePaths = getLocalConfigPaths(subDir);

  for (const testPath of possiblePaths) {
    if (await fs.pathExists(testPath)) {
      return testPath;
    }
  }

  return null;
}

export async function getTargetDirectory(options: { folder?: string }): Promise<string> {
  let targetDir = options.folder || path.join(process.env.HOME || process.env.USERPROFILE || '~', '.claude');

  // If no custom folder specified, detect project directory
  if (!options.folder) {
    const cwd = process.cwd();
    const isGitRepo = await fs.pathExists(path.join(cwd, '.git'));
    const hasClaudeConfig = await fs.pathExists(path.join(cwd, '.claude'));

    if (isGitRepo || hasClaudeConfig) {
      targetDir = path.join(cwd, '.claude');
    }
  }

  return targetDir;
}