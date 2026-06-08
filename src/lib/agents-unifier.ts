import crypto from "crypto";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { createBackupNameSuffix, createTimestampedBackupName, getBackupDir } from "./backup-utils.js";
import { resolveFolders, type FolderOptions, type ResolvedFolders } from "./folder-paths.js";

export type AgentsUnifyScope = "global" | "repository";
export type UnifiedAgentCategory = "skills" | "agents" | "instructions" | "rules";

export interface AgentsUnifyOptions extends FolderOptions {
  scope?: AgentsUnifyScope;
  dryRun?: boolean;
  categories?: UnifiedAgentCategory[];
}

interface ContainerCandidate {
  category: Exclude<UnifiedAgentCategory, "instructions">;
  label: string;
  path: string;
  isDestination?: boolean;
  linkSource?: boolean;
  linkWhenParentExists?: boolean;
  linkWhenMissing?: boolean;
}

interface InstructionFileCandidate {
  label: string;
  path: string;
  isDestination?: boolean;
  linkWhenMissing?: boolean;
  linkWhenParentExists?: boolean;
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
  scope: AgentsUnifyScope;
  backupPath: string | null;
  imported: ImportedEntry[];
  duplicates: DuplicateEntry[];
  renamed: RenamedEntry[];
  linked: LinkedContainer[];
  alreadyLinked: LinkedContainer[];
  skipped: { category: UnifiedAgentCategory; path: string; reason: string }[];
  instructionIndex: {
    agentsPath: string;
    claudePath: string;
    indexedRules: string[];
  } | null;
}

const IGNORED_ENTRY_NAMES = new Set([
  ".DS_Store",
  ".git",
  "node_modules",
]);

const RULE_EXTENSION_RENAME_REASON = "Rule file extension normalized from .mdc to .md";

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

function getContainerCandidates(options: FolderOptions, includeCodex = true): ContainerCandidate[] {
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
    ...(includeCodex ? [{
      category: "skills",
      label: "codex-skills",
      path: path.join(folders.codexDir, "skills"),
      linkWhenMissing: true,
    } satisfies ContainerCandidate] : []),
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

function getInstructionFileCandidates(options: FolderOptions, scope: AgentsUnifyScope): InstructionFileCandidate[] {
  const folders = resolveFolders(options);
  const cursorDir = path.join(folders.rootDir, ".cursor");
  const linkToolInstructionsWhenMissing = scope === "global";

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
      linkWhenMissing: linkToolInstructionsWhenMissing,
      linkWhenParentExists: true,
    },
    {
      label: "cursor-instructions",
      path: path.join(cursorDir, "AGENTS.md"),
      linkWhenParentExists: true,
    },
  ]);
}

function getRepositoryContainerCandidates(options: FolderOptions): ContainerCandidate[] {
  const folders = resolveFolders(options);
  const cursorDir = path.join(folders.rootDir, ".cursor");

  return uniqueByPath([
    ...getContainerCandidates(options, false),
    {
      category: "rules",
      label: "agents-rules",
      path: path.join(folders.agentsDir, "rules"),
      isDestination: true,
    },
    {
      category: "rules",
      label: "claude-rules",
      path: path.join(folders.claudeDir, "rules"),
      linkWhenMissing: true,
    },
    {
      category: "rules",
      label: "cursor-rules",
      path: path.join(cursorDir, "rules"),
      linkWhenParentExists: true,
    },
    {
      category: "rules",
      label: "claude-memories",
      path: path.join(folders.claudeDir, "memories"),
      linkSource: false,
    },
    {
      category: "rules",
      label: "cursor-memories",
      path: path.join(cursorDir, "memories"),
      linkSource: false,
    },
    {
      category: "rules",
      label: "claude-memory",
      path: path.join(folders.claudeDir, "memory.md"),
      linkSource: false,
    },
    {
      category: "rules",
      label: "cursor-memory",
      path: path.join(cursorDir, "memory.md"),
      linkSource: false,
    },
    {
      category: "rules",
      label: "claude-memory-uppercase",
      path: path.join(folders.claudeDir, "MEMORY.md"),
      linkSource: false,
    },
    {
      category: "rules",
      label: "cursor-memory-uppercase",
      path: path.join(cursorDir, "MEMORY.md"),
      linkSource: false,
    },
  ]);
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

async function hashRulePath(targetPath: string): Promise<string> {
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
      .sort(compareRuleEntryNames);
    const canonicalEntries: Array<{ name: string; hash: string }> = [];
    const usedNames = new Set<string>();
    const hashesByName = new Map<string, string>();
    const dirHash = crypto.createHash("sha256");
    dirHash.update("dir:");

    for (const entry of entries) {
      const entryHash = await hashRulePath(path.join(targetPath, entry.name));
      let entryName = entry.isDirectory() ? entry.name : normalizeRuleFileName(entry.name);
      const existingHash = hashesByName.get(entryName);
      if (existingHash) {
        if (existingHash === entryHash) continue;
        entryName = findAvailableRuleName(entryName, usedNames);
      }
      usedNames.add(entryName);
      hashesByName.set(entryName, entryHash);
      canonicalEntries.push({ name: entryName, hash: entryHash });
    }

    for (const entry of canonicalEntries.sort((a, b) => a.name.localeCompare(b.name))) {
      dirHash.update(entry.name);
      dirHash.update("\0");
      dirHash.update(entry.hash);
      dirHash.update("\0");
    }

    return dirHash.digest("hex");
  }

  return hashString(`other:${stat.mode}:${stat.size}`);
}

async function hashPathForCategory(
  category: UnifiedAgentCategory,
  targetPath: string,
): Promise<string> {
  return category === "rules" ? hashRulePath(targetPath) : hashPath(targetPath);
}

function findAvailableRuleName(originalName: string, usedNames: Set<string>): string {
  let index = 1;

  while (true) {
    const candidate = nameWithSuffix(originalName, "agents-rules", index);
    if (!usedNames.has(candidate)) return candidate;
    index++;
  }
}

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".js",
  ".json",
  ".jsonc",
  ".md",
  ".mdc",
  ".mjs",
  ".sh",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const PORTABLE_PATH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\.claude\/skills/g, ".agents/skills"],
  [/\.codex\/skills/g, ".agents/skills"],
  [/\.cursor\/skills-cursor/g, ".agents/skills"],
  [/\.cursor\/skills/g, ".agents/skills"],
  [/\.claude\/agents/g, ".agents/agents"],
  [/\.codex\/agents/g, ".agents/agents"],
  [/\.cursor\/agents/g, ".agents/agents"],
  [/\.claude\/rules/g, ".agents/rules"],
  [/\.codex\/rules/g, ".agents/rules"],
  [/\.cursor\/rules/g, ".agents/rules"],
  [/\.claude\/memories/g, ".agents/rules"],
  [/\.codex\/memories/g, ".agents/rules"],
  [/\.cursor\/memories/g, ".agents/rules"],
];

function normalizePortableText(content: string): string {
  let normalized = content;
  for (const [pattern, replacement] of PORTABLE_PATH_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

function isLikelyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return path.basename(filePath) === "SKILL.md";
}

async function normalizePortableContent(targetPath: string): Promise<void> {
  const stat = await fs.lstat(targetPath).catch(() => null);
  if (!stat || stat.isSymbolicLink()) return;

  if (stat.isDirectory()) {
    const entries = await fs.readdir(targetPath);
    for (const entry of entries) {
      if (IGNORED_ENTRY_NAMES.has(entry)) continue;
      await normalizePortableContent(path.join(targetPath, entry));
    }
    return;
  }

  if (!stat.isFile() || !isLikelyTextFile(targetPath)) return;

  const content = await fs.readFile(targetPath, "utf-8").catch(() => null);
  if (content === null || content.includes("\0")) return;

  const normalized = normalizePortableText(content);
  if (normalized !== content) {
    await fs.writeFile(targetPath, normalized, "utf-8");
  }
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

function normalizeRuleFileName(name: string): string {
  return path.extname(name).toLowerCase() === ".mdc"
    ? `${path.basename(name, path.extname(name))}.md`
    : name;
}

function ruleExtensionPriority(name: string): number {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".md") return 0;
  if (ext === ".mdc") return 1;
  return 2;
}

function compareRuleEntryNames(a: { name: string }, b: { name: string }): number {
  const normalizedCompare = normalizeRuleFileName(a.name).localeCompare(normalizeRuleFileName(b.name));
  if (normalizedCompare !== 0) return normalizedCompare;
  const priorityCompare = ruleExtensionPriority(a.name) - ruleExtensionPriority(b.name);
  if (priorityCompare !== 0) return priorityCompare;
  return a.name.localeCompare(b.name);
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
  category: UnifiedAgentCategory,
  destinationDir: string,
  knownHashes: Map<string, string>,
  result: AgentsUnifyResult,
): Promise<void> {
  if (!(await fs.pathExists(destinationDir))) return;

  const plannedRuleNames = new Map(
    result.renamed
      .filter((entry) => entry.category === "rules")
      .map((entry) => [path.resolve(entry.from), path.basename(entry.to)]),
  );
  const removedRulePaths = new Set(
    result.duplicates
      .filter((entry) => entry.category === "rules")
      .map((entry) => path.resolve(entry.from)),
  );

  const entries = await fs.readdir(destinationDir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_ENTRY_NAMES.has(entry.name)) continue;
    const entryPath = path.join(destinationDir, entry.name);
    if (category === "rules" && removedRulePaths.has(path.resolve(entryPath))) continue;
    const entryName = category === "rules"
      ? plannedRuleNames.get(path.resolve(entryPath)) ?? normalizeRuleFileName(entry.name)
      : entry.name;
    knownHashes.set(await hashPathForCategory(category, entryPath), entryName);
  }
}

async function importCategoryEntries(
  category: UnifiedAgentCategory,
  candidates: ContainerCandidate[],
  destinationDir: string,
  result: AgentsUnifyResult,
  dryRun = false,
): Promise<boolean> {
  const sourceEntries: Array<{ candidate: ContainerCandidate; entries: SourceEntry[] }> = [];
  const destinationExists = await pathExistsOrSymlink(destinationDir);
  const destinationRealPath = destinationExists
    ? await realPathIfPossible(destinationDir)
    : null;

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

    const entries = await collectCandidateEntries(candidate, category).catch(() => null);
    if (!entries) {
      result.skipped.push({
        category,
        path: candidate.path,
        reason: "Could not read directory",
      });
      continue;
    }

    const collectableEntries: SourceEntry[] = [];
    for (const entry of entries) {
      if (!(await shouldCollectPath(category, entry.name, entry.path))) continue;
      collectableEntries.push(entry);
    }

    if (collectableEntries.length > 0) {
      sourceEntries.push({ candidate, entries: collectableEntries });
    }
  }

  if (!destinationExists && sourceEntries.length === 0) {
    return false;
  }

  if (!dryRun) {
    await fs.ensureDir(destinationDir);
  }

  const knownHashes = new Map<string, string>();
  await addExistingDestinationHashes(category, destinationDir, knownHashes, result);
  const knownNames = new Set(knownHashes.values());

  for (const { candidate, entries } of sourceEntries) {
    for (const entry of entries) {
      const sourcePath = entry.path;
      const sourceHash = await hashPathForCategory(category, sourcePath);
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

      let targetName = category === "rules" ? normalizeRuleFileName(entry.name) : entry.name;
      let targetPath = path.join(destinationDir, targetName);

      if ((await pathExistsOrSymlink(targetPath)) || knownNames.has(targetName)) {
        targetName = await findAvailableTargetName(destinationDir, targetName, candidate.label, knownNames);
        targetPath = path.join(destinationDir, targetName);
        result.renamed.push({
          category,
          name: entry.name,
          from: sourcePath,
          to: targetPath,
          reason: "Same name with different content",
        });
      }

      if (!dryRun) {
        await fs.copy(sourcePath, targetPath, {
          dereference: false,
          overwrite: false,
        });
        await normalizePortableContent(targetPath);
      }
      knownNames.add(targetName);
      knownHashes.set(dryRun ? sourceHash : await hashPathForCategory(category, targetPath), targetName);
      result.imported.push({
        category,
        name: entry.name,
        from: sourcePath,
        to: targetPath,
      });
    }
  }

  return true;
}

function recordRuleExtensionRename(
  result: AgentsUnifyResult,
  from: string,
  to: string,
): void {
  result.renamed.push({
    category: "rules",
    name: path.basename(from),
    from,
    to,
    reason: RULE_EXTENSION_RENAME_REASON,
  });
}

async function migrateExistingRuleExtensions(
  rulesDir: string,
  result: AgentsUnifyResult,
  dryRun = false,
): Promise<void> {
  const usedNamesByDir = new Map<string, Set<string>>();

  async function usedNamesForDir(currentDir: string): Promise<Set<string>> {
    const existing = usedNamesByDir.get(currentDir);
    if (existing) return existing;
    const names = new Set(await fs.readdir(currentDir).catch(() => []));
    usedNamesByDir.set(currentDir, names);
    return names;
  }

  async function walk(currentDir: string): Promise<void> {
    const entries = sortSourceEntries(
      await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []),
      "rules",
    );

    for (const entry of entries) {
      if (IGNORED_ENTRY_NAMES.has(entry.name)) continue;

      const sourcePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(sourcePath);
        continue;
      }

      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      if (path.extname(entry.name).toLowerCase() !== ".mdc") continue;

      const targetPath = path.join(currentDir, normalizeRuleFileName(entry.name));
      if (samePath(sourcePath, targetPath)) continue;

      if (await pathExistsOrSymlink(targetPath)) {
        const sourceHash = await hashPath(sourcePath);
        const targetHash = await hashPath(targetPath);

        if (sourceHash === targetHash) {
          const backupRoot = await ensureBackupPath(result, dryRun);
          const backupTarget = path.join(
            backupRoot,
            safeRelativePath(result.rootDir, sourcePath),
          );

          if (!dryRun) {
            await fs.ensureDir(path.dirname(backupTarget));
            await fs.move(sourcePath, backupTarget, { overwrite: false });
          }
          result.duplicates.push({
            category: "rules",
            name: entry.name,
            from: sourcePath,
            keptAs: targetPath,
          });
          const usedNames = await usedNamesForDir(currentDir);
          usedNames.delete(entry.name);
          continue;
        }

        const usedNames = await usedNamesForDir(currentDir);
        const targetName = await findAvailableTargetName(
          currentDir,
          path.basename(targetPath),
          "agents-rules",
          usedNames,
        );
        const renamedTargetPath = path.join(currentDir, targetName);

        if (!dryRun) {
          await fs.move(sourcePath, renamedTargetPath, { overwrite: false });
        }
        usedNames.delete(entry.name);
        usedNames.add(targetName);
        recordRuleExtensionRename(result, sourcePath, renamedTargetPath);
        continue;
      }

      const usedNames = await usedNamesForDir(currentDir);
      if (!dryRun) {
        await fs.move(sourcePath, targetPath, { overwrite: false });
      }
      usedNames.delete(entry.name);
      usedNames.add(path.basename(targetPath));
      recordRuleExtensionRename(result, sourcePath, targetPath);
    }
  }

  await walk(rulesDir);
}

async function findAvailableTargetName(
  destinationDir: string,
  originalName: string,
  label: string,
  knownNames: Set<string>,
): Promise<string> {
  const suffix = suffixFromLabel(label);
  let index = 1;

  while (true) {
    const candidate = nameWithSuffix(originalName, suffix, index);
    if (!knownNames.has(candidate) && !(await pathExistsOrSymlink(path.join(destinationDir, candidate)))) {
      return candidate;
    }
    index++;
  }
}

interface SourceEntry {
  name: string;
  path: string;
}

function sortSourceEntries<T extends { name: string }>(
  entries: T[],
  category: Exclude<UnifiedAgentCategory, "instructions">,
): T[] {
  return [...entries].sort((a, b) => {
    if (category === "rules") return compareRuleEntryNames(a, b);
    return a.name.localeCompare(b.name);
  });
}

async function collectCandidateEntries(
  candidate: ContainerCandidate,
  category: Exclude<UnifiedAgentCategory, "instructions">,
): Promise<SourceEntry[]> {
  const stat = await fs.lstat(candidate.path);

  if (stat.isDirectory()) {
    const entries = await fs.readdir(candidate.path, { withFileTypes: true });
    return sortSourceEntries(entries, category).map((entry) => ({
      name: entry.name,
      path: path.join(candidate.path, entry.name),
    }));
  }

  if (stat.isSymbolicLink()) {
    const targetStat = await fs.stat(candidate.path).catch(() => null);
    if (targetStat?.isDirectory()) {
      const entries = await fs.readdir(candidate.path, { withFileTypes: true });
      return sortSourceEntries(entries, category).map((entry) => ({
        name: entry.name,
        path: path.join(candidate.path, entry.name),
      }));
    }
  }

  return [{
    name: path.basename(candidate.path),
    path: candidate.path,
  }];
}

async function shouldCollectPath(
  category: UnifiedAgentCategory,
  name: string,
  sourcePath: string,
): Promise<boolean> {
  if (IGNORED_ENTRY_NAMES.has(name)) return false;
  if (category === "skills" && name === ".cursor-managed-skills-manifest.json") {
    return true;
  }

  const stat = await fs.lstat(sourcePath).catch(() => null);
  if (!stat) return false;
  return stat.isFile() || stat.isDirectory() || stat.isSymbolicLink();
}

function safeRelativePath(rootDir: string, targetPath: string): string {
  const relativePath = path.relative(rootDir, targetPath);
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return path.join("external", targetPath.replace(/[^a-zA-Z0-9._-]+/g, "-"));
  }
  return relativePath;
}

function createBackupPath(rootDir: string): string {
  const projectKey = createBackupNameSuffix(path.resolve(rootDir));
  return path.join(
    getBackupDir(),
    createTimestampedBackupName(`project-${projectKey}-agents-unify-sources`),
  );
}

async function ensureBackupPath(result: AgentsUnifyResult, dryRun = false): Promise<string> {
  if (!result.backupPath) {
    result.backupPath = createBackupPath(result.rootDir);
    if (!dryRun) {
      await fs.ensureDir(result.backupPath);
    }
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
  dryRun = false,
): Promise<void> {
  if (candidate.linkSource === false) {
    return;
  }

  if (candidate.isDestination || samePath(candidate.path, destinationDir)) {
    return;
  }

  const destinationRealPath = await realPathIfPossible(destinationDir);
  const stat = await fs.lstat(candidate.path).catch(() => null);

  if (!stat) {
    if (!(await shouldLinkMissingContainer(candidate))) return;
    if (!dryRun) {
      await createDirectorySymlink(destinationDir, candidate.path);
    }
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

    if (!dryRun) {
      await fs.remove(candidate.path);
      await createDirectorySymlink(destinationDir, candidate.path);
    }
    result.linked.push({
      category: candidate.category,
      from: candidate.path,
      to: destinationDir,
    });
    return;
  }

  const backupRoot = await ensureBackupPath(result, dryRun);
  const backupTarget = path.join(
    backupRoot,
    safeRelativePath(result.rootDir, candidate.path),
  );

  if (!dryRun) {
    await fs.ensureDir(path.dirname(backupTarget));
    await fs.move(candidate.path, backupTarget, { overwrite: false });
    await createDirectorySymlink(destinationDir, candidate.path);
  }
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
  dryRun = false,
): Promise<boolean> {
  const destinationExists = await pathExistsOrSymlink(destinationPath);
  const destinationRealPath = destinationExists
    ? await realPathIfPossible(destinationPath)
    : null;
  const sourceCandidates: InstructionFileCandidate[] = [];

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

    sourceCandidates.push(candidate);
  }

  if (!destinationExists && sourceCandidates.length === 0) {
    return false;
  }

  if (!dryRun) {
    await fs.ensureDir(path.dirname(destinationPath));
  }
  let destinationHash = destinationExists
    ? await hashPath(destinationPath)
    : null;
  const plannedNames = new Set<string>();

  for (const candidate of sourceCandidates) {
    const sourceHash = await hashPath(candidate.path);

    if (!destinationHash) {
      if (!dryRun) {
        await fs.copy(candidate.path, destinationPath, {
          dereference: false,
          overwrite: false,
        });
      }
      destinationHash = sourceHash;
      plannedNames.add(path.basename(destinationPath));
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

    const targetName = await findAvailableTargetName(
      path.dirname(destinationPath),
      path.basename(destinationPath),
      candidate.label,
      plannedNames,
    );
    const targetPath = path.join(path.dirname(destinationPath), targetName);
    if (!dryRun) {
      await fs.copy(candidate.path, targetPath, {
        dereference: false,
        overwrite: false,
      });
    }
    plannedNames.add(targetName);
    result.renamed.push({
      category: "instructions",
      name: path.basename(candidate.path),
      from: candidate.path,
      to: targetPath,
      reason: "Shared instruction file already exists with different content",
    });
  }

  return true;
}

async function shouldLinkMissingInstruction(candidate: InstructionFileCandidate): Promise<boolean> {
  if (candidate.linkWhenMissing) return true;
  if (candidate.linkWhenParentExists) return fs.pathExists(path.dirname(candidate.path));
  return false;
}

async function linkInstructionFile(
  candidate: InstructionFileCandidate,
  destinationPath: string,
  result: AgentsUnifyResult,
  dryRun = false,
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
    if (!dryRun) {
      await createFileSymlink(destinationPath, candidate.path);
    }
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

    if (!dryRun) {
      await fs.remove(candidate.path);
      await createFileSymlink(destinationPath, candidate.path);
    }
    result.linked.push({
      category: "instructions",
      from: candidate.path,
      to: destinationPath,
    });
    return;
  }

  const backupRoot = await ensureBackupPath(result, dryRun);
  const backupTarget = path.join(
    backupRoot,
    safeRelativePath(result.rootDir, candidate.path),
  );

  if (!dryRun) {
    await fs.ensureDir(path.dirname(backupTarget));
    await fs.move(candidate.path, backupTarget, { overwrite: false });
    await createFileSymlink(destinationPath, candidate.path);
  }
  result.linked.push({
    category: "instructions",
    from: candidate.path,
    to: destinationPath,
    movedToBackup: backupTarget,
  });
}

interface RuleIndexEntry {
  title: string;
  relativePath: string;
}

const RULES_INDEX_START = "<!-- AIBLUEPRINT:RULES:START -->";
const RULES_INDEX_END = "<!-- AIBLUEPRINT:RULES:END -->";

function titleFromRulePath(rulePath: string): string {
  return path.basename(rulePath, path.extname(rulePath))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function readRuleTitle(rulePath: string): Promise<string> {
  const content = await fs.readFile(rulePath, "utf-8").catch(() => "");
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || titleFromRulePath(rulePath);
}

async function collectRuleIndexEntries(
  rulesDir: string,
  rootDir: string,
  currentDir = rulesDir,
): Promise<RuleIndexEntry[]> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);
  const rules: RuleIndexEntry[] = [];

  for (const entry of entries) {
    if (IGNORED_ENTRY_NAMES.has(entry.name)) continue;

    const entryPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      rules.push(...await collectRuleIndexEntries(rulesDir, rootDir, entryPath));
      continue;
    }

    if (!entry.isFile() && !entry.isSymbolicLink()) continue;
    if (path.extname(entry.name).toLowerCase() !== ".md") continue;

    rules.push({
      title: await readRuleTitle(entryPath),
      relativePath: path.relative(rootDir, entryPath),
    });
  }

  return rules.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function stripGeneratedRulesIndex(content: string): string {
  const start = content.indexOf(RULES_INDEX_START);
  const end = content.indexOf(RULES_INDEX_END);
  if (start === -1 || end === -1 || end < start) {
    return content.trimEnd();
  }

  const beforeStart = content.slice(0, start);
  const headingIndex = beforeStart.lastIndexOf("\n## Rules");
  const blockStart = headingIndex === -1
    ? start
    : headingIndex + 1;

  return `${content.slice(0, blockStart).trimEnd()}\n${content.slice(end + RULES_INDEX_END.length).trimStart()}`.trimEnd();
}

function renderRulesIndexBlock(rules: RuleIndexEntry[]): string {
  const lines = [
    "## Rules",
    "",
    "Detailed focused rules live in `.agents/rules/`. Read the relevant file before acting:",
    "",
    RULES_INDEX_START,
  ];

  if (rules.length === 0) {
    lines.push("- No repository rules found yet.");
  } else {
    for (const rule of rules) {
      lines.push(`- **${rule.title}** - [${rule.relativePath}](${rule.relativePath})`);
    }
  }

  lines.push(RULES_INDEX_END);
  return lines.join("\n");
}

async function readExistingInstructions(rootDir: string): Promise<string> {
  const agentsPath = path.join(rootDir, "AGENTS.md");
  const claudePath = path.join(rootDir, "CLAUDE.md");

  const agentsContent = await fs.readFile(agentsPath, "utf-8").catch(() => null);
  const claudeContent = await fs.readFile(claudePath, "utf-8").catch(() => null);
  if (agentsContent !== null && claudeContent !== null && agentsContent.trim() !== claudeContent.trim()) {
    return `${agentsContent.trimEnd()}\n\n## Previous Claude Instructions\n\n${claudeContent.trimStart()}`;
  }

  if (agentsContent !== null) return agentsContent;
  if (claudeContent !== null) return claudeContent;

  return "# Repository Instructions\n";
}

async function copyPathToBackup(result: AgentsUnifyResult, targetPath: string): Promise<string | null> {
  const stat = await fs.lstat(targetPath).catch(() => null);
  if (!stat) return null;

  const backupRoot = await ensureBackupPath(result);
  const backupTarget = path.join(
    backupRoot,
    safeRelativePath(result.rootDir, targetPath),
  );

  await fs.ensureDir(path.dirname(backupTarget));
  await fs.copy(targetPath, backupTarget, {
    dereference: false,
    overwrite: false,
  });

  return backupTarget;
}

async function planPathBackup(result: AgentsUnifyResult, targetPath: string): Promise<string | null> {
  const stat = await fs.lstat(targetPath).catch(() => null);
  if (!stat) return null;

  const backupRoot = await ensureBackupPath(result, true);
  return path.join(
    backupRoot,
    safeRelativePath(result.rootDir, targetPath),
  );
}

async function replaceWithFileSymlink(sourcePath: string, targetPath: string): Promise<void> {
  await fs.ensureDir(path.dirname(targetPath));
  const relativeSource = path.relative(path.dirname(targetPath), sourcePath) || path.basename(sourcePath);
  await fs.symlink(relativeSource, targetPath, "file");
}

async function ensureClaudeInstructionSymlink(
  result: AgentsUnifyResult,
  agentsPath: string,
  claudePath: string,
  dryRun = false,
): Promise<void> {
  const agentsRealPath = await realPathIfPossible(agentsPath);
  const claudeStat = await fs.lstat(claudePath).catch(() => null);

  if (claudeStat?.isSymbolicLink()) {
    const claudeRealPath = await realPathIfPossible(claudePath);
    if (agentsRealPath && claudeRealPath && samePath(agentsRealPath, claudeRealPath)) {
      return;
    }
  }

  if (claudeStat) {
    if (dryRun) {
      await planPathBackup(result, claudePath);
    } else {
      await copyPathToBackup(result, claudePath);
      await fs.remove(claudePath);
    }
  }

  if (!dryRun) {
    await replaceWithFileSymlink(agentsPath, claudePath);
  }
  result.linked.push({
    category: "instructions",
    from: claudePath,
    to: agentsPath,
  });
}

async function writeRepositoryInstructionIndex(
  result: AgentsUnifyResult,
  folders: ResolvedFolders,
  dryRun = false,
  includeRules = true,
): Promise<void> {
  const rulesDir = path.join(folders.agentsDir, "rules");
  const agentsPath = path.join(folders.rootDir, "AGENTS.md");
  const claudePath = path.join(folders.rootDir, "CLAUDE.md");
  const rulesDirExists = await pathExistsOrSymlink(rulesDir);
  const rules = includeRules && (dryRun || rulesDirExists)
    ? dryRun
      ? await collectPlannedRuleIndexEntries(result, folders.rootDir)
      : await collectRuleIndexEntries(rulesDir, folders.rootDir)
    : [];
  const agentsExists = await pathExistsOrSymlink(agentsPath);
  const claudeExists = await pathExistsOrSymlink(claudePath);

  if (rules.length === 0 && !agentsExists && !claudeExists) {
    return;
  }

  const existing = stripGeneratedRulesIndex(await readExistingInstructions(folders.rootDir));
  const content = rules.length > 0
    ? `${existing}\n\n${renderRulesIndexBlock(rules)}\n`
    : `${existing.trimEnd()}\n`;
  const agentsStat = await fs.lstat(agentsPath).catch(() => null);

  if (agentsStat) {
    if (dryRun) {
      await planPathBackup(result, agentsPath);
    } else {
      await copyPathToBackup(result, agentsPath);
      if (agentsStat.isSymbolicLink()) {
        await fs.remove(agentsPath);
      }
    }
  }

  if (!dryRun) {
    await fs.writeFile(agentsPath, content, "utf-8");
  }
  await ensureClaudeInstructionSymlink(result, agentsPath, claudePath, dryRun);

  result.instructionIndex = {
    agentsPath,
    claudePath,
    indexedRules: rules.map((rule) => rule.relativePath),
  };
}

async function collectPlannedRuleIndexEntries(
  result: AgentsUnifyResult,
  rootDir: string,
): Promise<RuleIndexEntry[]> {
  const rules: RuleIndexEntry[] = [];
  const removedRulePaths = new Set(
    [
      ...result.renamed.filter((entry) => entry.category === "rules").map((entry) => path.relative(rootDir, entry.from)),
      ...result.duplicates.filter((entry) => entry.category === "rules").map((entry) => path.relative(rootDir, entry.from)),
    ],
  );
  const plannedRuleEntries = [
    ...result.imported.filter((entry) => entry.category === "rules"),
    ...result.renamed.filter((entry) => entry.category === "rules"),
  ];

  for (const entry of plannedRuleEntries) {
    rules.push(...await collectPlannedRuleEntryFiles(entry, rootDir));
  }

  if (await pathExistsOrSymlink(path.join(rootDir, ".agents", "rules"))) {
    const existingRules = await collectRuleIndexEntries(path.join(rootDir, ".agents", "rules"), rootDir);
    rules.push(...existingRules.filter((rule) => !removedRulePaths.has(rule.relativePath)));
  }

  const byPath = new Map<string, RuleIndexEntry>();
  for (const rule of rules) {
    byPath.set(rule.relativePath, rule);
  }

  return [...byPath.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function collectPlannedRuleEntryFiles(
  entry: ImportedEntry | RenamedEntry,
  rootDir: string,
): Promise<RuleIndexEntry[]> {
  const sourceStat = await fs.lstat(entry.from).catch(() => null);
  if (!sourceStat?.isDirectory()) {
    const ext = path.extname(entry.to).toLowerCase();
    if (ext !== ".md") return [];
    return [{
      title: await readRuleTitle(entry.from),
      relativePath: path.relative(rootDir, entry.to),
    }];
  }

  return collectPlannedRuleDirectoryFiles(entry.from, entry.to, rootDir);
}

async function collectPlannedRuleDirectoryFiles(
  sourceDir: string,
  targetDir: string,
  rootDir: string,
): Promise<RuleIndexEntry[]> {
  const entries = sortSourceEntries(
    await fs.readdir(sourceDir, { withFileTypes: true }).catch(() => []),
    "rules",
  );
  const rules: RuleIndexEntry[] = [];
  const usedNames = new Set<string>();
  const plannedSourcesByName = new Map<string, string>();

  for (const entry of entries) {
    if (IGNORED_ENTRY_NAMES.has(entry.name)) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    if (entry.isDirectory()) {
      const targetPath = path.join(targetDir, entry.name);
      usedNames.add(entry.name);
      rules.push(...await collectPlannedRuleDirectoryFiles(sourcePath, targetPath, rootDir));
      continue;
    }

    if (!entry.isFile() && !entry.isSymbolicLink()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (![".md", ".mdc"].includes(ext)) continue;

    let targetName = normalizeRuleFileName(entry.name);
    const existingSourcePath = plannedSourcesByName.get(targetName);
    if (existingSourcePath) {
      const sourceHash = await hashRulePath(sourcePath);
      const existingHash = await hashRulePath(existingSourcePath);
      if (sourceHash === existingHash) continue;
      targetName = await findAvailableTargetName(targetDir, targetName, "agents-rules", usedNames);
    }
    usedNames.add(targetName);
    plannedSourcesByName.set(targetName, sourcePath);

    const targetPath = path.join(targetDir, targetName);
    rules.push({
      title: await readRuleTitle(sourcePath),
      relativePath: path.relative(rootDir, targetPath),
    });
  }

  return rules;
}

export async function unifyAgentsConfiguration(
  options: AgentsUnifyOptions = {},
): Promise<AgentsUnifyResult> {
  const scope = options.scope ?? "global";
  const dryRun = Boolean(options.dryRun);
  const folders = resolveFolders(options);
  const includeCodex = scope !== "repository";
  const defaultCategories: UnifiedAgentCategory[] = scope === "repository"
    ? ["instructions", "skills", "agents", "rules"]
    : ["instructions", "skills", "agents"];
  const selectedCategories = new Set(
    (options.categories ?? defaultCategories).filter((category) => defaultCategories.includes(category)),
  );
  const instructionCandidates = getInstructionFileCandidates(options, scope);
  const candidates = scope === "repository"
    ? getRepositoryContainerCandidates(options)
    : getContainerCandidates(options);
  const result: AgentsUnifyResult = {
    rootDir: folders.rootDir,
    agentsDir: folders.agentsDir,
    scope,
    backupPath: null,
    imported: [],
    duplicates: [],
    renamed: [],
    linked: [],
    alreadyLinked: [],
    skipped: [],
    instructionIndex: null,
  };

  const destinationByCategory: Record<UnifiedAgentCategory, string> = {
    skills: path.join(folders.agentsDir, "skills"),
    agents: path.join(folders.agentsDir, "agents"),
    instructions: path.join(folders.agentsDir, "AGENTS.md"),
    rules: path.join(folders.agentsDir, "rules"),
  };

  if (selectedCategories.has("instructions")) {
    await importInstructionFiles(
      instructionCandidates,
      destinationByCategory.instructions,
      result,
      dryRun,
    );
  }

  const categories: Array<Exclude<UnifiedAgentCategory, "instructions">> = scope === "repository"
    ? ["skills", "agents", "rules"]
    : ["skills", "agents"];

  if (scope === "repository" && selectedCategories.has("rules") && await pathExistsOrSymlink(destinationByCategory.rules)) {
    await migrateExistingRuleExtensions(destinationByCategory.rules, result, dryRun);
  }

  const activeCategories = new Set<Exclude<UnifiedAgentCategory, "instructions">>();
  for (const category of categories) {
    if (!selectedCategories.has(category)) continue;
    const isActive = await importCategoryEntries(
      category,
      candidates,
      destinationByCategory[category],
      result,
      dryRun,
    );
    if (isActive) {
      activeCategories.add(category);
    }
  }

  for (const candidate of candidates) {
    if (!activeCategories.has(candidate.category)) continue;
    await linkContainer(
      candidate,
      destinationByCategory[candidate.category],
      result,
      dryRun,
    );
  }

  if (selectedCategories.has("instructions")) {
    for (const candidate of instructionCandidates) {
      await linkInstructionFile(
        candidate,
        destinationByCategory.instructions,
        result,
        dryRun,
      );
    }
  }

  if (scope === "repository" && (selectedCategories.has("instructions") || selectedCategories.has("rules"))) {
    if (!dryRun && selectedCategories.has("rules") && await pathExistsOrSymlink(destinationByCategory.rules)) {
      await migrateExistingRuleExtensions(destinationByCategory.rules, result, dryRun);
    }
    await writeRepositoryInstructionIndex(result, folders, dryRun, selectedCategories.has("rules"));
  }

  return result;
}

export async function previewAgentsConfiguration(
  options: AgentsUnifyOptions = {},
): Promise<AgentsUnifyResult> {
  return unifyAgentsConfiguration({ ...options, dryRun: true });
}
