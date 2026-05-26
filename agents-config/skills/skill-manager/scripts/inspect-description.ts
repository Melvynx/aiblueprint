#!/usr/bin/env bun
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const MIN_DESCRIPTION_CHARS = 50;
const MAX_DESCRIPTION_CHARS = 300;
const MAX_NAME_CHARS = 64;
const MIN_OPENAI_SHORT_DESCRIPTION_CHARS = 25;
const MAX_OPENAI_SHORT_DESCRIPTION_CHARS = 64;

type YamlValue = boolean | number | string | string[] | Record<string, unknown>;

type ParsedFrontmatter = {
  duplicateKeys: string[];
  keys: string[];
  values: Map<string, YamlValue>;
};

type Finding = {
  file: string;
  message: string;
  severity: "error" | "warning";
};

const allowedSkillFields = new Set([
  "agent",
  "allow_implicit_invocation",
  "allowed-tools",
  "argument-hint",
  "arguments",
  "category",
  "context",
  "description",
  "disable-model-invocation",
  "effort",
  "hooks",
  "license",
  "metadata",
  "model",
  "name",
  "paths",
  "tags",
  "user-invocable",
  "version",
  "author",
  "color",
]);

const allowedModelAliases = new Set(["haiku", "sonnet", "opus", "inherit"]);
const allowedEfforts = new Set(["low", "medium", "high", "xhigh", "max"]);

function expandHome(input: string): string {
  if (input === "~") {
    return os.homedir();
  }

  if (input.startsWith("~/")) {
    return path.join(os.homedir(), input.slice(2));
  }

  return input;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function charCount(value: string): number {
  return Array.from(value).length;
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);

  if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseScalar(rawValue: string): YamlValue {
  const trimmed = rawValue.trim();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const body = trimmed.slice(1, -1).trim();

    if (!body) {
      return [];
    }

    return body.split(",").map((item) => stripWrappingQuotes(item.trim()));
  }

  return stripWrappingQuotes(trimmed);
}

function readFrontmatter(markdown: string): string | null {
  const frontmatterMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return frontmatterMatch?.[1] ?? null;
}

function parseTopLevelYaml(yaml: string): ParsedFrontmatter {
  const lines = yaml.split(/\r?\n/);
  const values = new Map<string, YamlValue>();
  const keys: string[] = [];
  const duplicateKeys: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim() || line.trim().startsWith("#") || /^\s/.test(line)) {
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!match) {
      continue;
    }

    const key = match[1];
    const rawValue = match[2].trim();

    if (values.has(key)) {
      duplicateKeys.push(key);
    }

    keys.push(key);

    if (rawValue === "|" || rawValue === ">" || rawValue === "|-" || rawValue === ">-") {
      const blockLines: string[] = [];

      for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
        const blockLine = lines[blockIndex];

        if (/^[A-Za-z0-9_-]+:\s*/.test(blockLine)) {
          break;
        }

        blockLines.push(blockLine.trim());
        index = blockIndex;
      }

      values.set(key, blockLines.join(rawValue.startsWith(">") ? " " : "\n").trim());
      continue;
    }

    if (rawValue === "") {
      const listValues: string[] = [];
      let sawList = false;

      for (let blockIndex = index + 1; blockIndex < lines.length; blockIndex += 1) {
        const blockLine = lines[blockIndex];

        if (/^[A-Za-z0-9_-]+:\s*/.test(blockLine)) {
          break;
        }

        const listMatch = blockLine.match(/^\s*-\s*(.+)$/);

        if (listMatch) {
          sawList = true;
          listValues.push(stripWrappingQuotes(listMatch[1]));
          index = blockIndex;
        }
      }

      values.set(key, sawList ? listValues : {});
      continue;
    }

    values.set(key, parseScalar(rawValue));
  }

  return { duplicateKeys, keys, values };
}

async function statFollowSymlink(targetPath: string): Promise<{ isDirectory: boolean; isFile: boolean } | null> {
  try {
    const stat = await fs.stat(targetPath);
    return {
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
    };
  } catch {
    return null;
  }
}

async function findSkillFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  const visitedDirectories = new Set<string>();
  const visitedFiles = new Set<string>();

  async function walk(currentPath: string): Promise<void> {
    const realDirectory = await fs.realpath(currentPath).catch(() => currentPath);

    if (visitedDirectories.has(realDirectory)) {
      return;
    }

    visitedDirectories.add(realDirectory);

    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);
      const stat = entry.isSymbolicLink()
        ? await statFollowSymlink(entryPath)
        : { isDirectory: entry.isDirectory(), isFile: entry.isFile() };

      if (!stat) {
        continue;
      }

      if (stat.isDirectory) {
        await walk(entryPath);
        continue;
      }

      if (stat.isFile && entry.name === "SKILL.md") {
        const realFile = await fs.realpath(entryPath).catch(() => entryPath);

        if (!visitedFiles.has(realFile)) {
          visitedFiles.add(realFile);
          files.push(entryPath);
        }
      }
    }
  }

  await walk(root);
  return files;
}

async function findCursorRuleFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (entry.isFile() && /\.(md|mdc)$/.test(entry.name)) {
        files.push(entryPath);
      }
    }
  }

  await walk(root);
  return files;
}

function addFinding(findings: Finding[], severity: Finding["severity"], file: string, message: string): void {
  findings.push({ file, message, severity });
}

function getString(values: Map<string, YamlValue>, key: string): string | null {
  const value = values.get(key);
  return typeof value === "string" ? value : null;
}

function isStringList(value: YamlValue | undefined): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateDescription(findings: Finding[], file: string, name: string, description: string | null): void {
  if (!description) {
    addFinding(findings, "error", file, `${name} has no description`);
    return;
  }

  const length = charCount(description);

  if (length < MIN_DESCRIPTION_CHARS) {
    addFinding(findings, "error", file, `${name} description is too short (${length}/${MIN_DESCRIPTION_CHARS} chars min)`);
  }

  if (length > MAX_DESCRIPTION_CHARS) {
    addFinding(findings, "error", file, `${name} description is too long (${length}/${MAX_DESCRIPTION_CHARS} chars max)`);
  }

  if (/<[A-Za-z][^>]*>/.test(description)) {
    addFinding(findings, "error", file, `${name} description must not contain XML or HTML tags`);
  }
}

function validateSkillFrontmatter(findings: Finding[], file: string, frontmatter: ParsedFrontmatter): string {
  const fallbackName = path.basename(path.dirname(file));
  const name = getString(frontmatter.values, "name") ?? fallbackName;

  for (const key of frontmatter.duplicateKeys) {
    addFinding(findings, "error", file, `duplicate frontmatter key: ${key}`);
  }

  for (const key of frontmatter.keys) {
    if (!allowedSkillFields.has(key)) {
      addFinding(findings, "warning", file, `unknown SKILL.md frontmatter key: ${key}`);
    }
  }

  const rawName = frontmatter.values.get("name");

  if (typeof rawName !== "string" || rawName.trim() === "") {
    addFinding(findings, "error", file, "name must be a non-empty string");
  } else {
    if (charCount(rawName) > MAX_NAME_CHARS) {
      addFinding(findings, "error", file, `${rawName} name is too long (${charCount(rawName)}/${MAX_NAME_CHARS} chars max)`);
    }

    if (!/^[a-z0-9][a-z0-9-]*$/.test(rawName)) {
      addFinding(findings, "error", file, `${rawName} name must use lowercase letters, numbers, and hyphens only`);
    }
  }

  validateDescription(findings, file, name, getString(frontmatter.values, "description"));

  for (const key of ["disable-model-invocation", "user-invocable", "allow_implicit_invocation"]) {
    const value = frontmatter.values.get(key);

    if (value !== undefined && typeof value !== "boolean") {
      addFinding(findings, "error", file, `${key} must be a boolean`);
    }
  }

  const allowedTools = frontmatter.values.get("allowed-tools");

  if (allowedTools !== undefined) {
    if (typeof allowedTools !== "string" && !isStringList(allowedTools)) {
      addFinding(findings, "error", file, "allowed-tools must be a string or a YAML list of strings");
    }

    if (isStringList(allowedTools) && allowedTools.some((tool) => tool.trim() === "")) {
      addFinding(findings, "error", file, "allowed-tools contains an empty tool entry");
    }
  }

  const argumentHint = frontmatter.values.get("argument-hint");

  if (argumentHint !== undefined && typeof argumentHint !== "string") {
    addFinding(findings, "error", file, "argument-hint must be a string; quote values that use [] syntax");
  }

  for (const key of ["arguments", "paths", "tags"]) {
    const value = frontmatter.values.get(key);

    if (value !== undefined && typeof value !== "string" && !isStringList(value)) {
      addFinding(findings, "error", file, `${key} must be a string or a YAML list of strings`);
    }
  }

  const context = frontmatter.values.get("context");

  if (context !== undefined && context !== "fork") {
    addFinding(findings, "error", file, "context must be \"fork\" when present");
  }

  const agent = frontmatter.values.get("agent");

  if (agent !== undefined && typeof agent !== "string") {
    addFinding(findings, "error", file, "agent must be a string");
  }

  const model = frontmatter.values.get("model");

  if (model !== undefined) {
    if (typeof model !== "string") {
      addFinding(findings, "error", file, "model must be a string");
    } else if (!allowedModelAliases.has(model) && !/^claude-[a-z0-9.-]+$/.test(model)) {
      addFinding(findings, "warning", file, `model value is not a common Claude alias or model id: ${model}`);
    }
  }

  const effort = frontmatter.values.get("effort");

  if (effort !== undefined && (typeof effort !== "string" || !allowedEfforts.has(effort))) {
    addFinding(findings, "error", file, `effort must be one of: ${Array.from(allowedEfforts).join(", ")}`);
  }

  return name;
}

async function validateSkillShape(findings: Finding[], skillFile: string): Promise<void> {
  const skillDir = path.dirname(skillFile);
  const entries = await fs.readdir(skillDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "SKILL.md") {
      continue;
    }

    if (entry.name === "agents" || entry.name === "assets" || entry.name === "references" || entry.name === "scripts") {
      if (!entry.isDirectory()) {
        addFinding(findings, "error", path.join(skillDir, entry.name), `${entry.name} must be a directory`);
      }

      continue;
    }

    // Skills may bundle extra runtime references or upstream repo files. Shape
    // validation only enforces required files and known structured locations.
  }

  const openaiYaml = path.join(skillDir, "agents", "openai.yaml");

  if (await pathExists(openaiYaml)) {
    await validateOpenAiYaml(findings, openaiYaml, path.basename(skillDir));
  }
}

function getTopLevelKeys(yaml: string): string[] {
  return yaml
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*/)?.[1])
    .filter((key): key is string => Boolean(key));
}

function getNestedScalar(yaml: string, section: string, key: string): string | boolean | null {
  const lines = yaml.split(/\r?\n/);
  let inSection = false;

  for (const line of lines) {
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) {
      inSection = line.startsWith(`${section}:`);
      continue;
    }

    if (!inSection) {
      continue;
    }

    const match = line.match(new RegExp(`^\\s{2}${key}:\\s*(.*)$`));

    if (!match) {
      continue;
    }

    const value = parseScalar(match[1]);
    return typeof value === "boolean" ? value : String(value);
  }

  return null;
}

function getOpenAiToolEntries(yaml: string): Array<Record<string, string>> {
  const lines = yaml.split(/\r?\n/);
  const tools: Array<Record<string, string>> = [];
  let inTools = false;
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) {
      inTools = false;
    }

    if (/^\s{2}tools:\s*$/.test(line)) {
      inTools = true;
      continue;
    }

    if (!inTools) {
      continue;
    }

    const startMatch = line.match(/^\s{4}-\s*([A-Za-z0-9_-]+):\s*(.+)$/);

    if (startMatch) {
      current = { [startMatch[1]]: String(parseScalar(startMatch[2])) };
      tools.push(current);
      continue;
    }

    const fieldMatch = line.match(/^\s{6}([A-Za-z0-9_-]+):\s*(.+)$/);

    if (fieldMatch && current) {
      current[fieldMatch[1]] = String(parseScalar(fieldMatch[2]));
    }
  }

  return tools;
}

async function validateOpenAiYaml(findings: Finding[], file: string, skillName: string): Promise<void> {
  const yaml = await fs.readFile(file, "utf8");
  const allowedTopLevelKeys = new Set(["dependencies", "interface", "policy"]);

  for (const key of getTopLevelKeys(yaml)) {
    if (!allowedTopLevelKeys.has(key)) {
      addFinding(findings, "error", file, `unknown agents/openai.yaml top-level key: ${key}`);
    }
  }

  const displayName = getNestedScalar(yaml, "interface", "display_name");

  if (displayName !== null && typeof displayName !== "string") {
    addFinding(findings, "error", file, "interface.display_name must be a string");
  }

  const shortDescription = getNestedScalar(yaml, "interface", "short_description");

  if (shortDescription !== null) {
    if (typeof shortDescription !== "string") {
      addFinding(findings, "error", file, "interface.short_description must be a string");
    } else {
      const length = charCount(shortDescription);

      if (length < MIN_OPENAI_SHORT_DESCRIPTION_CHARS || length > MAX_OPENAI_SHORT_DESCRIPTION_CHARS) {
        addFinding(
          findings,
          "error",
          file,
          `interface.short_description must be ${MIN_OPENAI_SHORT_DESCRIPTION_CHARS}-${MAX_OPENAI_SHORT_DESCRIPTION_CHARS} chars (${length} found)`,
        );
      }
    }
  }

  const defaultPrompt = getNestedScalar(yaml, "interface", "default_prompt");

  if (defaultPrompt !== null) {
    if (typeof defaultPrompt !== "string") {
      addFinding(findings, "error", file, "interface.default_prompt must be a string");
    } else if (!defaultPrompt.includes(`$${skillName}`)) {
      addFinding(findings, "error", file, `interface.default_prompt must mention $${skillName}`);
    }
  }

  const brandColor = getNestedScalar(yaml, "interface", "brand_color");

  if (brandColor !== null && (typeof brandColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(brandColor))) {
    addFinding(findings, "error", file, "interface.brand_color must be a #RRGGBB hex color");
  }

  for (const iconField of ["icon_small", "icon_large"]) {
    const iconPath = getNestedScalar(yaml, "interface", iconField);

    if (iconPath === null) {
      continue;
    }

    if (typeof iconPath !== "string" || !iconPath.startsWith("./assets/")) {
      addFinding(findings, "error", file, `interface.${iconField} must be a ./assets/... path`);
      continue;
    }

    const absoluteIconPath = path.resolve(path.dirname(file), "..", iconPath);

    if (!(await pathExists(absoluteIconPath))) {
      addFinding(findings, "error", file, `interface.${iconField} does not exist: ${iconPath}`);
    }
  }

  const allowImplicitInvocation = getNestedScalar(yaml, "policy", "allow_implicit_invocation");

  if (allowImplicitInvocation !== null && typeof allowImplicitInvocation !== "boolean") {
    addFinding(findings, "error", file, "policy.allow_implicit_invocation must be a boolean");
  }

  for (const tool of getOpenAiToolEntries(yaml)) {
    for (const requiredField of ["type", "value", "description", "transport", "url"]) {
      if (!tool[requiredField]) {
        addFinding(findings, "error", file, `dependencies.tools entry is missing ${requiredField}`);
      }
    }

    if (tool.type && tool.type !== "mcp") {
      addFinding(findings, "error", file, "dependencies.tools[].type must be \"mcp\"");
    }

    if (tool.transport && tool.transport !== "streamable_http") {
      addFinding(findings, "error", file, "dependencies.tools[].transport must be \"streamable_http\"");
    }

    if (tool.url && !tool.url.startsWith("https://")) {
      addFinding(findings, "error", file, "dependencies.tools[].url must be an HTTPS URL");
    }
  }
}

async function validateSkillFile(file: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const markdown = await fs.readFile(file, "utf8");
  const frontmatter = readFrontmatter(markdown);

  if (!frontmatter) {
    addFinding(findings, "error", file, "SKILL.md must start with YAML frontmatter delimited by ---");
    return findings;
  }

  const parsedFrontmatter = parseTopLevelYaml(frontmatter);
  validateSkillFrontmatter(findings, file, parsedFrontmatter);

  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").trim();

  if (!body) {
    addFinding(findings, "error", file, "SKILL.md body must not be empty");
  }

  await validateSkillShape(findings, file);
  return findings;
}

async function validateCursorRuleFile(file: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const markdown = await fs.readFile(file, "utf8");
  const frontmatter = readFrontmatter(markdown);

  if (!frontmatter) {
    return findings;
  }

  const parsedFrontmatter = parseTopLevelYaml(frontmatter);
  const allowedCursorFields = new Set(["alwaysApply", "description", "globs"]);

  for (const key of parsedFrontmatter.duplicateKeys) {
    addFinding(findings, "error", file, `duplicate Cursor rule frontmatter key: ${key}`);
  }

  for (const key of parsedFrontmatter.keys) {
    if (!allowedCursorFields.has(key)) {
      addFinding(findings, "error", file, `unknown Cursor rule frontmatter key: ${key}`);
    }
  }

  const alwaysApply = parsedFrontmatter.values.get("alwaysApply");

  if (alwaysApply !== undefined && typeof alwaysApply !== "boolean") {
    addFinding(findings, "error", file, "alwaysApply must be a boolean");
  }

  const description = getString(parsedFrontmatter.values, "description");

  if (description) {
    validateDescription(findings, file, path.basename(file), description);
  }

  const globs = parsedFrontmatter.values.get("globs");

  if (globs !== undefined && typeof globs !== "string" && !isStringList(globs)) {
    addFinding(findings, "error", file, "globs must be a string or YAML list of strings");
  }

  return findings;
}

async function collectSkillFiles(roots: string[]): Promise<string[]> {
  const files = (await Promise.all(roots.map(findSkillFiles))).flat().sort();
  return files;
}

async function collectCursorRuleFiles(roots: string[]): Promise<string[]> {
  const cursorRoots = roots.filter((root) => root.includes(`${path.sep}.cursor${path.sep}rules`) || root.endsWith(`${path.sep}.cursor${path.sep}rules`));

  if (cursorRoots.length === 0) {
    return [];
  }

  return (await Promise.all(cursorRoots.map(findCursorRuleFiles))).flat().sort();
}

async function main(): Promise<void> {
  const roots = process.argv.slice(2).map((arg) => path.resolve(expandHome(arg)));
  const defaultRoots = [path.join(os.homedir(), ".agents", "skills")];
  const rootsToInspect = roots.length > 0 ? roots : defaultRoots;
  const existingRoots = [];

  for (const root of rootsToInspect) {
    if (await pathExists(root)) {
      existingRoots.push(root);
    }
  }

  if (existingRoots.length === 0) {
    console.error(`No roots found: ${rootsToInspect.join(", ")}`);
    process.exitCode = 2;
    return;
  }

  const skillFiles = await collectSkillFiles(existingRoots);
  const cursorRuleFiles = await collectCursorRuleFiles(existingRoots);
  const allFindings = [
    ...(await Promise.all(skillFiles.map(validateSkillFile))).flat(),
    ...(await Promise.all(cursorRuleFiles.map(validateCursorRuleFile))).flat(),
  ];

  const errors = allFindings.filter((finding) => finding.severity === "error");
  const warnings = allFindings.filter((finding) => finding.severity === "warning");

  for (const finding of allFindings) {
    const prefix = finding.severity === "error" ? "error" : "warning";
    console.warn(`${prefix}: ${finding.message} (${finding.file})`);
  }

  if (errors.length === 0) {
    const warningSuffix = warnings.length === 0 ? "" : ` with ${warnings.length} warning(s)`;
    const cursorSuffix = cursorRuleFiles.length === 0 ? "" : ` and ${cursorRuleFiles.length} Cursor rule(s)`;
    console.log(`OK: ${skillFiles.length} skill(s)${cursorSuffix} passed validation${warningSuffix}.`);
    return;
  }

  console.error(`Found ${errors.length} error(s) and ${warnings.length} warning(s) across ${skillFiles.length} skill(s).`);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
});
