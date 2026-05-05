import fs from "fs-extra";
import os from "os";
import path from "path";
import chalk from "chalk";
import { replacePathPlaceholdersInDir } from "./platform.js";

export type AgentCategory = "skills";

export const AGENT_CATEGORIES: AgentCategory[] = ["skills"];

export function getAgentsDir(custom?: string): string {
  return custom ? path.resolve(custom) : path.join(os.homedir(), ".agents");
}

export interface InstallToAgentsOptions {
  /**
   * When true, real directories at claudeDir/<category>/<name> are moved
   * into agentsDir as part of install. Used by the setup command which
   * has already taken a backup.
   */
  migrateClaudeDirs?: boolean;
  /**
   * When true, an existing entry at agentsDir/<category>/<name> is replaced
   * by the source content. Used for sync "modified" updates.
   */
  overwrite?: boolean;
  silent?: boolean;
}

export interface InstallToAgentsResult {
  copied: string[];
  migrated: string[];
  symlinked: string[];
  skipped: { name: string; reason: string }[];
}

async function platformSymlink(source: string, target: string): Promise<void> {
  await fs.ensureDir(path.dirname(target));
  const isWindows = os.platform() === "win32";
  const sourceStat = await fs.stat(source).catch(() => null);

  if (isWindows && sourceStat?.isDirectory()) {
    await fs.symlink(source, target, "junction");
  } else {
    await fs.symlink(source, target);
  }
}

/**
 * Copy each top-level entry from sourceCategoryDir into agentsDir/<category>,
 * then ensure claudeDir/<category>/<name> is symlinked to it.
 *
 * Conflict policy:
 *  - agentsDir/<category>/<name> already exists  -> keep, unless overwrite=true
 *  - claudeDir/<category>/<name> is a real dir   -> skip symlink (never destroy)
 *  - claudeDir/<category>/<name> is a symlink    -> recreate (idempotent)
 *  - claudeDir/<category>/<name> missing         -> create symlink
 *  - migrateClaudeDirs=true and .agents target absent and .claude is real
 *    -> move .claude content into .agents, then symlink back
 */
export async function installCategoryToAgents(
  sourceCategoryDir: string,
  category: AgentCategory,
  agentsDir: string,
  claudeDir: string,
  options: InstallToAgentsOptions = {},
): Promise<InstallToAgentsResult> {
  const result: InstallToAgentsResult = {
    copied: [],
    migrated: [],
    symlinked: [],
    skipped: [],
  };

  if (!(await fs.pathExists(sourceCategoryDir))) {
    return result;
  }

  const agentsCategoryDir = path.join(agentsDir, category);
  await fs.ensureDir(agentsCategoryDir);

  const entries = await fs.readdir(sourceCategoryDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store" || entry.name === "node_modules") continue;

    const sourcePath = path.join(sourceCategoryDir, entry.name);
    const agentsTarget = path.join(agentsCategoryDir, entry.name);
    const claudeTarget = path.join(claudeDir, category, entry.name);

    const agentsExists = await fs.pathExists(agentsTarget);

    if (!agentsExists) {
      let migrated = false;
      if (options.migrateClaudeDirs) {
        const claudeStat = await fs.lstat(claudeTarget).catch(() => null);
        if (claudeStat && !claudeStat.isSymbolicLink()) {
          await fs.move(claudeTarget, agentsTarget);
          result.migrated.push(entry.name);
          migrated = true;
        }
      }

      if (!migrated) {
        await fs.copy(sourcePath, agentsTarget, { overwrite: false });
        await replacePathPlaceholdersInDir(agentsTarget, claudeDir);
        result.copied.push(entry.name);
      }
    } else if (options.overwrite) {
      await fs.remove(agentsTarget);
      await fs.copy(sourcePath, agentsTarget, { overwrite: false });
      await replacePathPlaceholdersInDir(agentsTarget, claudeDir);
      result.copied.push(entry.name);
    }
  }

  await syncCategorySymlinks(category, agentsDir, claudeDir, result, options.silent);

  return result;
}

/**
 * Ensure claudeDir/<category>/<name> is a symlink to agentsDir/<category>/<name>
 * for every entry in agentsDir/<category>. Skips real dirs/files. Cleans up
 * dangling symlinks whose .agents target was removed.
 */
export async function syncCategorySymlinks(
  category: AgentCategory,
  agentsDir: string,
  claudeDir: string,
  result?: InstallToAgentsResult,
  silent = false,
): Promise<void> {
  const agentsCategoryDir = path.join(agentsDir, category);
  const claudeCategoryDir = path.join(claudeDir, category);

  if (!(await fs.pathExists(agentsCategoryDir))) {
    return;
  }

  await fs.ensureDir(claudeCategoryDir);

  const entries = await fs.readdir(agentsCategoryDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;

    const agentsTarget = path.join(agentsCategoryDir, entry.name);
    const claudeTarget = path.join(claudeCategoryDir, entry.name);

    const claudeStat = await fs.lstat(claudeTarget).catch(() => null);

    if (!claudeStat) {
      await platformSymlink(agentsTarget, claudeTarget);
      result?.symlinked.push(entry.name);
    } else if (claudeStat.isSymbolicLink()) {
      await fs.remove(claudeTarget);
      await platformSymlink(agentsTarget, claudeTarget);
      result?.symlinked.push(entry.name);
    } else {
      const reason = `Real directory at ${claudeTarget} - skipped to avoid destruction`;
      result?.skipped.push({ name: entry.name, reason });
      if (!silent) {
        console.log(chalk.yellow(`  ⚠️  ${entry.name}: existing real ${category.slice(0, -1)} kept in place (not symlinked)`));
      }
    }
  }

  if (await fs.pathExists(claudeCategoryDir)) {
    const claudeEntries = await fs.readdir(claudeCategoryDir, { withFileTypes: true });
    for (const entry of claudeEntries) {
      const claudeTarget = path.join(claudeCategoryDir, entry.name);
      const stat = await fs.lstat(claudeTarget).catch(() => null);
      if (stat?.isSymbolicLink()) {
        const exists = await fs.pathExists(claudeTarget);
        if (!exists) {
          await fs.remove(claudeTarget);
        }
      }
    }
  }
}

/**
 * Resolve where a sync target file should be written. For categories backed
 * by .agents the file is written under agentsDir; otherwise claudeDir.
 */
export function resolveSyncTargetBase(
  category: string,
  agentsDir: string,
  claudeDir: string,
): string {
  return (AGENT_CATEGORIES as string[]).includes(category) ? agentsDir : claudeDir;
}

export function isAgentCategory(category: string): category is AgentCategory {
  return (AGENT_CATEGORIES as string[]).includes(category);
}
