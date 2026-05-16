import os from "os";
import path from "path";

export interface FolderOptions {
  folder?: string;
  claudeCodeFolder?: string;
  codexFolder?: string;
  agentsFolder?: string;
}

export interface ResolvedFolders {
  rootDir: string;
  claudeDir: string;
  codexDir: string;
  agentsDir: string;
}

export function resolveFolders(options: FolderOptions = {}): ResolvedFolders {
  const rootDir = options.folder
    ? path.resolve(options.folder)
    : os.homedir();

  const claudeDir = options.claudeCodeFolder
    ? path.resolve(options.claudeCodeFolder)
    : path.join(rootDir, ".claude");

  const codexDir = options.codexFolder
    ? path.resolve(options.codexFolder)
    : path.join(rootDir, ".codex");

  const agentsDir = options.agentsFolder
    ? path.resolve(options.agentsFolder)
    : path.join(rootDir, ".agents");

  return { rootDir, claudeDir, codexDir, agentsDir };
}
