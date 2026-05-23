import fs from "fs-extra";
import path from "path";

const TUI_STATUS_LINE_BLOCK = `status_line = [
  "model-with-reasoning",
  "run-state",
  "project-name",
  "git-branch",
  "branch-changes",
  "context-remaining",
  "used-tokens",
  "five-hour-limit",
  "weekly-limit",
  "task-progress",
]
status_line_use_colors = true`;

const TUI_SECTION = `[tui]
${TUI_STATUS_LINE_BLOCK}`;

function hasTopLevelKey(content: string, key: string): boolean {
  let inSection = false;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\[[^\]]+\]$/.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (!inSection && (trimmed.startsWith(`${key} `) || trimmed.startsWith(`${key}=`))) {
      return true;
    }
  }

  return false;
}

function getTopLevelAssignments(defaultConfig: string): string[] {
  const assignments: string[] = [];

  for (const line of defaultConfig.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\[[^\]]+\]$/.test(trimmed)) break;
    if (/^[A-Za-z0-9_-]+\s*=/.test(trimmed)) {
      assignments.push(line);
    }
  }

  return assignments;
}

function findSectionRange(content: string, sectionName: string): { start: number; end: number } | null {
  const lines = content.split(/\r?\n/);
  const sectionHeader = `[${sectionName}]`;
  let start = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() === sectionHeader) {
      start = index;
      break;
    }
  }

  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (/^\[[^\]]+\]$/.test(trimmed)) {
      end = index;
      break;
    }
  }

  return { start, end };
}

function sectionHasKey(content: string, sectionName: string, key: string): boolean {
  const range = findSectionRange(content, sectionName);
  if (!range) return false;

  const lines = content.split(/\r?\n/).slice(range.start + 1, range.end);
  return lines.some((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith(`${key} `) || trimmed.startsWith(`${key}=`);
  });
}

function appendBlock(content: string, block: string): string {
  const normalized = content.trimEnd();
  if (!normalized) return `${block}\n`;
  return `${normalized}\n\n${block}\n`;
}

export function mergeCodexConfig(existingConfig: string, defaultConfig: string): string {
  let merged = existingConfig.trimEnd();

  for (const assignment of getTopLevelAssignments(defaultConfig)) {
    const key = assignment.split("=")[0].trim();
    if (!hasTopLevelKey(merged, key)) {
      merged = appendBlock(merged, assignment);
    }
  }

  if (sectionHasKey(merged, "tui", "status_line")) {
    return `${merged}\n`;
  }

  const tuiRange = findSectionRange(merged, "tui");
  if (!tuiRange) {
    return appendBlock(merged, TUI_SECTION);
  }

  const lines = merged.split(/\r?\n/);
  lines.splice(tuiRange.start + 1, 0, TUI_STATUS_LINE_BLOCK);
  return `${lines.join("\n").trimEnd()}\n`;
}

export async function mergeCodexConfigFile(sourceConfigPath: string, codexDir: string): Promise<void> {
  const targetConfigPath = path.join(codexDir, "config.toml");
  const defaultConfig = await fs.readFile(sourceConfigPath, "utf-8");
  const existingConfig = await fs.readFile(targetConfigPath, "utf-8").catch(() => "");
  const merged = mergeCodexConfig(existingConfig, defaultConfig);

  await fs.ensureDir(codexDir);
  await fs.writeFile(targetConfigPath, merged, "utf-8");
}
