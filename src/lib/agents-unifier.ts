import crypto from "crypto";
import fs from "fs-extra";
import os from "os";
import path from "path";
import type { Dirent } from "fs";
import { resolveFolders, type FolderOptions } from "./folder-paths.js";

export type UnifiedAgentCategory = "skills" | "agents" | "instructions";

interface ContainerCandidate {
  category: Exclude<UnifiedAgentCategory, "instructions">;
  label: string;
  path: string;
  isDestination?: boolean;
  linkWhenParentExists?: boolean;
  linkWhenMissing?: boolean;
}

interface InstructionFileCandidate {
  label: string;
  path: string;
  isDestination?: boolean;
  linkWhenMissing?: boolean;
}

interface ImportedEntry {
  category: UnifiedAgentCategory;
  name: string;
  from: string;
  to: string;
}

interface DuplicateEntry {
  category: UnifiedAgentCategory;
  name: string;
  from: string;
  keptAs: string;
}

interface RenamedEntry {
  category: UnifiedAgentCategory;
  name: string;
  from: string;
  to: string;
  reason: string;
}

interface LinkedContainer {
  category: UnifiedAgentCategory;
  from: string;
  to: string;
  movedToBackup?: string;
}

export interface AgentsUnifyResult {
  rootDir: string;
  agentsDir: string;
  backupPath: string | null;
  imported: ImportedEntry[];
  duplicates: DuplicateEntry[];
  renamed: RenamedEntry[];
  linked: LinkedContainer[];
  alreadyLinked: LinkedContainer[];
  skipped: { category: UnifiedAgentCategory; path: string; reason: string }[];
}

const IGNORED_ENTRY_NAMES = new Set([
  ".DS_Store",
  ".git",
  "node_modules",
]);

function uniqueByPath<T extends { path: string }>(candidates: T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate.path);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    unique.push({ ...candidate, path: resolved });
  }

  return unique;
}

function getContainerCandidates(options: FolderOptions): ContainerCandidate[] {
  const folders = resolveFolders(options);
  const cursorDir = path.join(folders.rootDir, ".cursor");
  const factoryDir = path.join(folders.rootDir, ".factory");
  const opencodeDir = path.join(folders.rootDir, ".config", "opencode");

  return uniqueByPath([
    {
      category: "skills",
      label: "agents-skills",
      path: path.join(folders.agentsDir, "skills"),
      isDestination: true,
    },
    {
      category: "skills",
      label: "claude-skills",
      path: path.join(folders.claudeDir, "skills"),
      linkWhenMissing: true,
    },
    {
      category: "skills",
      label: "codex-skills",
      path: path.join(folders.codexDir, "skills"),
      linkWhenMissing: true,
    },
    {
      category: "skills",
      label: "cursor-skills",
      path: path.join(cursorDir, "skills"),
      linkWhenParentExists: true,
    },
    {
      category: "skills",
      label: "cursor-skills-cursor",
      path: path.join(cursorDir, "skills-cursor"),
      linkWhenParentExists: true,
    },
    {
      category: "skills",
      label: "factory-skills",
      path: path.join(factoryDir, "skills"),
      linkWhenParentExists: true,
    },
    {
      category: "skills",
      label: "opencode-skill",
      path: path.join(opencodeDir, "skill"),
      linkWhenParentExists: true,
    },
    {
      category: "skills",
      label: "opencode-skills",
      path: path.join(opencodeDir, "skills"),
      linkWhenParentExists: true,
    },
    {
      category: "agents",
      label: "agents-agents",
      path: path.join(folders.agentsDir, "agents"),
      isDestination: true,
    },
    {
      category: "agents",
      label: "claude-agents",
      path: path.join(folders.claudeDir, "agents"),
      linkWhenMissing: true,
    },
    {
      category: "agents",
      label: "claude-agnets",
      path: path.join(folders.claudeDir, "agnets"),
    },
    {
      category: "agents",
      label: "cursor-agents",
      path: path.join(cursorDir, "agents"),
      linkWhenParentExists: true,
    },
    {
      category: "agents",
      label: "factory-droids",
      path: path.join(factoryDir, "droids"),
      linkWhenParentExists: true,
    },
    {
      category: "agents",
      label: "opencode-agent",
      path: path.join(opencodeDir, "agent"),
      linkWhenParentExists: true,
    },
    {
      category: "agents",
      label: "opencode-agents",
      path: path.join(opencodeDir, "agents"),
      linkWhenParentExists: true,
    },
  ]);
}

function getInstructionFileCandidates(options: FolderOptions): InstructionFileCandidate[] {
  const folders = resolveFolders(options);

  return uniqueByPath([
    {
      label: "agents-instructions",
      path: path.join(folders.agentsDir, "AGENTS.md"),
      isDestination: true,
    },
    {
      label: "claude-instructions",
      path: path.join(folders.claudeDir, "CLAUDE.md"),
      linkWhenMissing: true,
    },
    {
      label: "codex-instructions",
      path: path.join(folders.codexDir, "AGENTS.md"),
      linkWhenMissing: true,
    },
  ]);
}

function shouldCollectEntry(category: UnifiedAgentCategory, entry: Dirent): boolean {
  if (IGNORED_ENTRY_NAMES.has(entry.name)) return false;
  if (category === "skills" && entry.name === ".cursor-managed-skills-manifest.json") {
    return true;
  }
  return entry.isFile() || entry.isDirectory() || entry.isSymbolicLink();
}

async function pathExistsOrSymlink(targetPath: string): Promise<boolean> {
  const stat = await fs.lstat(targetPath).catch(() => null);
  return Boolean(stat);
}

async function realPathIfPossible(targetPath: string): Promise<string | null> {
  try {
    return await fs.realpath(targetPath);
  } catch {
    return null;
  }
}

function samePath(a: string, b: string): boolean {
  return path.resolve(a) === path.resolve(b);
}

function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function hashPath(targetPath: string): Promise<string> {
  const stat = await fs.lstat(targetPath);

  if (stat.isSymbolicLink()) {
    const linkTarget = await fs.readlink(targetPath);
    return hashString(`symlink:${linkTarget}`);
  }

  if (stat.isFile()) {
    const fileHash = crypto.createHash("sha256");
    fileHash.update("file:");
    fileHash.update(await fs.readFile(targetPath));
    return fileHash.digest("hex");
  }

  if (stat.isDirectory()) {
    const entries = (await fs.readdir(targetPath, { withFileTypes: true }))
      .filter((entry) => !IGNORED_ENTRY_NAMES.has(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const dirHash = crypto.createHash("sha256");
    dirHash.update("dir:");

    for (const entry of entries) {
      dirHash.update(entry.name);
      dirHash.update("\0");
      dirHash.update(await hashPath(path.join(targetPath, entry.name)));
      dirHash.update("\0");
    }

    return dirHash.digest("hex");
  }

  return hashString(`other:${stat.mode}:${stat.size}`);
}

function suffixFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "source";
}

function nameWithSuffix(name: string, suffix: string, index: number): string {
  const parsed = path.parse(name);
  const numberedSuffix = index === 1 ? suffix : `${suffix}-${index}`;

  if (parsed.ext && parsed.name) {
    return `${parsed.name}--${numberedSuffix}${parsed.ext}`;
  }

  return `${name}--${numberedSuffix}`;
}

async function findTargetName(
  destinationDir: string,
  originalName: string,
  label: string,
): Promise<string> {
  const suffix = suffixFromLabel(label);
  let index = 1;

  while (true) {
    const candidate = nameWithSuffix(originalName, suffix, index);
    if (!(await pathExistsOrSymlink(path.join(destinationDir, candidate)))) {
      return candidate;
    }
    index++;
  }
}

async function addExistingDestinationHashes(
  destinationDir: string,
  knownHashes: Map<string, string>,
): Promise<void> {
  if (!(await fs.pathExists(destinationDir))) return;

  const entries = await fs.readdir(destinationDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_ENTRY_NAMES.has(entry.name)) continue;
    const entryPath = path.join(destinationDir, entry.name);
    knownHashes.set(await hashPath(entryPath), entry.name);
  }
}

async function importCategoryEntries(
  category: UnifiedAgentCategory,
  candidates: ContainerCandidate[],
  destinationDir: string,
  result: AgentsUnifyResult,
): Promise<void> {
  await fs.ensureDir(destinationDir);

  const destinationRealPath = await realPathIfPossible(destinationDir);
  const knownHashes = new Map<string, string>();
  await addExistingDestinationHashes(destinationDir, knownHashes);

  for (const candidate of candidates) {
    if (candidate.category !== category || candidate.isDestination) continue;

    const candidateStat = await fs.lstat(candidate.path).catch(() => null);
    if (!candidateStat) continue;

    const candidateRealPath = await realPathIfPossible(candidate.path);
    if (
      destinationRealPath &&
      candidateRealPath &&
      samePath(destinationRealPath, candidateRealPath)
    ) {
      continue;
    }

    const entries = await fs.readdir(candidate.path, { withFileTypes: true }).catch(() => null);
    if (!entries) {
      result.skipped.push({
        category,
        path: candidate.path,
        reason: "Could not read directory",
      });
      continue;
    }

    for (const entry of entries) {
      if (!shouldCollectEntry(category, entry)) continue;

      const sourcePath = path.join(candidate.path, entry.name);
      const sourceHash = await hashPath(sourcePath);
      const existingName = knownHashes.get(sourceHash);

      if (existingName) {
        result.duplicates.push({
          category,
          name: entry.name,
          from: sourcePath,
          keptAs: path.join(destinationDir, existingName),
        });
        continue;
      }

      let targetName = entry.name;
      let targetPath = path.join(destinationDir, targetName);

      if (await pathExistsOrSymlink(targetPath)) {
        targetName = await findTargetName(destinationDir, entry.name, candidate.label);
        targetPath = path.join(destinationDir, targetName);
        result.renamed.push({
          category,
          name: entry.name,
          from: sourcePath,
          to: targetPath,
          reason: "Same name with different content",
        });
      }

      await fs.copy(sourcePath, targetPath, {
        dereference: false,
        overwrite: false,
      });
      knownHashes.set(sourceHash, targetName);
      result.imported.push({
        category,
        name: entry.name,
        from: sourcePath,
        to: targetPath,
      });
    }
  }
}

function timestamp(date = new Date()): string {
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, "")
    .replace(/[:T]/g, "-");
}

function safeRelativePath(rootDir: string, targetPath: string): string {
  const relativePath = path.relative(rootDir, targetPath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return path.join("external", targetPath.replace(/[^a-zA-Z0-9._-]+/g, "-"));
  }
  return relativePath;
}

function createBackupPath(rootDir: string): string {
  return path.join(
    rootDir,
    ".aiblueprint",
    "backups",
    "agents-unify-sources",
    timestamp(),
  );
}

async function ensureBackupPath(result: AgentsUnifyResult): Promise<string> {
  if (!result.backupPath) {
    result.backupPath = createBackupPath(result.rootDir);
    await fs.ensureDir(result.backupPath);
  }
  return result.backupPath;
}

async function createDirectorySymlink(source: string, target: string): Promise<void> {
  await fs.ensureDir(path.dirname(target));
  if (os.platform() === "win32") {
    await fs.symlink(source, target, "junction");
    return;
  }
  await fs.symlink(source, target, "dir");
}

async function createFileSymlink(source: string, target: string): Promise<void> {
  await fs.ensureDir(path.dirname(target));
  if (os.platform() === "win32") {
    await fs.symlink(source, target, "file");
    return;
  }
  await fs.symlink(source, target);
}

async function shouldLinkMissingContainer(candidate: ContainerCandidate): Promise<boolean> {
  if (candidate.linkWhenMissing) return true;
  if (!candidate.linkWhenParentExists) return false;
  return fs.pathExists(path.dirname(candidate.path));
}

async function linkContainer(
  candidate: ContainerCandidate,
  destinationDir: string,
  result: AgentsUnifyResult,
): Promise<void> {
  if (candidate.isDestination || samePath(candidate.path, destinationDir)) {
    return;
  }

  const destinationRealPath = await realPathIfPossible(destinationDir);
  const stat = await fs.lstat(candidate.path).catch(() => null);

  if (!stat) {
    if (!(await shouldLinkMissingContainer(candidate))) return;
    await createDirectorySymlink(destinationDir, candidate.path);
    result.linked.push({
      category: candidate.category,
      from: candidate.path,
      to: destinationDir,
    });
    return;
  }

  if (stat.isSymbolicLink()) {
    const existingRealPath = await realPathIfPossible(candidate.path);
    if (
      destinationRealPath &&
      existingRealPath &&
      samePath(destinationRealPath, existingRealPath)
    ) {
      result.alreadyLinked.push({
        category: candidate.category,
        from: candidate.path,
        to: destinationDir,
      });
      return;
    }

    await fs.remove(candidate.path);
    await createDirectorySymlink(destinationDir, candidate.path);
    result.linked.push({
      category: candidate.category,
      from: candidate.path,
      to: destinationDir,
    });
    return;
  }

  const backupRoot = await ensureBackupPath(result);
  const backupTarget = path.join(
    backupRoot,
    safeRelativePath(result.rootDir, candidate.path),
  );

  await fs.ensureDir(path.dirname(backupTarget));
  await fs.move(candidate.path, backupTarget, { overwrite: false });
  await createDirectorySymlink(destinationDir, candidate.path);
  result.linked.push({
    category: candidate.category,
    from: candidate.path,
    to: destinationDir,
    movedToBackup: backupTarget,
  });
}

async function importInstructionFiles(
  candidates: InstructionFileCandidate[],
  destinationPath: string,
  result: AgentsUnifyResult,
): Promise<void> {
  await fs.ensureDir(path.dirname(destinationPath));

  const destinationRealPath = await realPathIfPossible(destinationPath);
  let destinationHash = await pathExistsOrSymlink(destinationPath)
    ? await hashPath(destinationPath)
    : null;

  for (const candidate of candidates) {
    if (candidate.isDestination) continue;

    const sourceStat = await fs.lstat(candidate.path).catch(() => null);
    if (!sourceStat) continue;

    const sourceRealPath = await realPathIfPossible(candidate.path);
    if (
      destinationRealPath &&
      sourceRealPath &&
      samePath(destinationRealPath, sourceRealPath)
    ) {
      continue;
    }

    const sourceHash = await hashPath(candidate.path);

    if (!destinationHash) {
      await fs.copy(candidate.path, destinationPath, {
        dereference: false,
        overwrite: false,
      });
      destinationHash = sourceHash;
      result.imported.push({
        category: "instructions",
        name: path.basename(candidate.path),
        from: candidate.path,
        to: destinationPath,
      });
      continue;
    }

    if (sourceHash === destinationHash) {
      result.duplicates.push({
        category: "instructions",
        name: path.basename(candidate.path),
        from: candidate.path,
        keptAs: destinationPath,
      });
      continue;
    }

    const targetName = await findTargetName(
      path.dirname(destinationPath),
      path.basename(destinationPath),
      candidate.label,
    );
    const targetPath = path.join(path.dirname(destinationPath), targetName);
    await fs.copy(candidate.path, targetPath, {
      dereference: false,
      overwrite: false,
    });
    result.renamed.push({
      category: "instructions",
      name: path.basename(candidate.path),
      from: candidate.path,
      to: targetPath,
      reason: "Shared instruction file already exists with different content",
    });
  }
}

async function shouldLinkMissingInstruction(candidate: InstructionFileCandidate): Promise<boolean> {
  if (candidate.linkWhenMissing) return true;
  return false;
}

async function linkInstructionFile(
  candidate: InstructionFileCandidate,
  destinationPath: string,
  result: AgentsUnifyResult,
): Promise<void> {
  if (candidate.isDestination || samePath(candidate.path, destinationPath)) {
    return;
  }

  if (!(await pathExistsOrSymlink(destinationPath))) {
    return;
  }

  const destinationRealPath = await realPathIfPossible(destinationPath);
  const stat = await fs.lstat(candidate.path).catch(() => null);

  if (!stat) {
    if (!(await shouldLinkMissingInstruction(candidate))) return;
    await createFileSymlink(destinationPath, candidate.path);
    result.linked.push({
      category: "instructions",
      from: candidate.path,
      to: destinationPath,
    });
    return;
  }

  if (stat.isSymbolicLink()) {
    const existingRealPath = await realPathIfPossible(candidate.path);
    if (
      destinationRealPath &&
      existingRealPath &&
      samePath(destinationRealPath, existingRealPath)
    ) {
      result.alreadyLinked.push({
        category: "instructions",
        from: candidate.path,
        to: destinationPath,
      });
      return;
    }

    await fs.remove(candidate.path);
    await createFileSymlink(destinationPath, candidate.path);
    result.linked.push({
      category: "instructions",
      from: candidate.path,
      to: destinationPath,
    });
    return;
  }

  const backupRoot = await ensureBackupPath(result);
  const backupTarget = path.join(
    backupRoot,
    safeRelativePath(result.rootDir, candidate.path),
  );

  await fs.ensureDir(path.dirname(backupTarget));
  await fs.move(candidate.path, backupTarget, { overwrite: false });
  await createFileSymlink(destinationPath, candidate.path);
  result.linked.push({
    category: "instructions",
    from: candidate.path,
    to: destinationPath,
    movedToBackup: backupTarget,
  });
}

export async function unifyAgentsConfiguration(
  options: FolderOptions = {},
): Promise<AgentsUnifyResult> {
  const folders = resolveFolders(options);
  const candidates = getContainerCandidates(options);
  const instructionCandidates = getInstructionFileCandidates(options);
  const result: AgentsUnifyResult = {
    rootDir: folders.rootDir,
    agentsDir: folders.agentsDir,
    backupPath: null,
    imported: [],
    duplicates: [],
    renamed: [],
    linked: [],
    alreadyLinked: [],
    skipped: [],
  };

  const destinationByCategory: Record<UnifiedAgentCategory, string> = {
    skills: path.join(folders.agentsDir, "skills"),
    agents: path.join(folders.agentsDir, "agents"),
    instructions: path.join(folders.agentsDir, "AGENTS.md"),
  };

  await fs.ensureDir(folders.agentsDir);

  await importInstructionFiles(
    instructionCandidates,
    destinationByCategory.instructions,
    result,
  );

  for (const category of ["skills", "agents"] as const) {
    await importCategoryEntries(
      category,
      candidates,
      destinationByCategory[category],
      result,
    );
  }

  for (const candidate of candidates) {
    await linkContainer(
      candidate,
      destinationByCategory[candidate.category],
      result,
    );
  }

  for (const candidate of instructionCandidates) {
    await linkInstructionFile(
      candidate,
      destinationByCategory.instructions,
      result,
    );
  }

  return result;
}
