#!/usr/bin/env bun

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.argv[2] ?? join(process.env.HOME ?? "", ".agents/skills");
const lucideRoot = process.argv[3];

if (!lucideRoot) {
  throw new Error("Pass the lucide-static icons directory as the second argument.");
}

function titleize(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function iconName(slug: string): string {
  const rules: Array<[RegExp, string]> = [
    [/^apex$/, "mountain"],
    [/debug|doctor|incident|fix-errors/, "bug"],
    [/review|audit|critique|check-/, "scan-search"],
    [/commit/, "git-commit-horizontal"],
    [/merge|pull-request|create-pr|fix-pr/, "git-merge"],
    [/browser|chrome|web-perf/, "globe"],
    [/code|sdk|api|cli|shell|terminal/, "terminal"],
    [/agent|fable|ultrathink/, "bot"],
    [/image|icon|gemini|visual/, "image"],
    [/animate|video|tella/, "clapperboard"],
    [/design|style|interface|shadcn|mobile-dialog/, "palette"],
    [/copy|grammar|article|prompt|clarify/, "pen-line"],
    [/mail|lumail|frontapp/, "mail"],
    [/auth|security|safe-ship/, "shield-check"],
    [/database|postgres|convex/, "database"],
    [/cloudflare|deploy|appstore/, "cloud-upload"],
    [/stripe|mercury|marketing|product/, "badge-dollar-sign"],
    [/analytics|posthog|umami|optimize/, "chart-no-axes-combined"],
    [/search|find-docs|exa/, "search"],
    [/docs|notion|rules|skill-manager/, "notebook-tabs"],
    [/skill|hook|config|settings|environment|setup/, "settings"],
    [/memory|continue-conversation/, "brain"],
    [/team|subagent/, "users"],
    [/calendar|loop|babysit|monitor/, "clock-3"],
    [/tweet|typefully/, "send"],
    [/saveit|bookmark/, "bookmark"],
    [/seo|web-design/, "scan-text"],
    [/refactor|clean-code|improve/, "wand-sparkles"],
    [/architecture|prototype|builder|create/, "blocks"],
    [/extract|migrate/, "package-open"],
    [/translate|traduction/, "languages"],
  ];
  return rules.find(([pattern]) => pattern.test(slug))?.[1] ?? "sparkles";
}

async function iconSvg(slug: string): Promise<string> {
  const name = iconName(slug);
  const source = await readFile(join(lucideRoot, `${name}.svg`), "utf8");
  return source
    .replace("<svg", `<svg role="img" aria-label="${slug} skill icon"`)
    .replace(/width="24"/, 'width="128"')
    .replace(/height="24"/, 'height="128"')
    .replaceAll('stroke="currentColor"', 'stroke="#F5F5F5"');
}

function frontmatter(markdown: string, key: string): string | undefined {
  const match = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1].trim().replace(/^['"]|['"]$/g, "");
}

function shortDescription(markdown: string, displayName: string): string {
  const raw = frontmatter(markdown, "description") ?? `Use the ${displayName} skill in Codex`;
  const sentence = raw.replace(/\s+/g, " ").split(/(?<=[.!?])\s/)[0].replace(/[.!?]+$/, "");
  const fallback = `Use ${displayName} workflows in Codex`;
  const value = sentence.length >= 25 ? sentence : fallback;
  if (value.length <= 64) return value;
  const clipped = value.slice(0, 61).replace(/\s+\S*$/, "");
  return `${clipped}...`;
}

function addIconMetadata(yaml: string, iconPath: string): string {
  if (/^\s+icon_small:/m.test(yaml) || !/^interface:\s*$/m.test(yaml)) return yaml;
  const lines = yaml.trimEnd().split("\n");
  const interfaceIndex = lines.findIndex((line) => line === "interface:");
  let insertAt = interfaceIndex + 1;
  while (insertAt < lines.length && (/^\s{2}\S/.test(lines[insertAt]) || lines[insertAt] === "")) insertAt++;
  const metadata = [
    `  icon_small: "${iconPath}"`,
    `  icon_large: "${iconPath}"`,
  ];
  if (!/^\s+brand_color:/m.test(yaml)) metadata.push('  brand_color: "#F5F5F5"');
  lines.splice(insertAt, 0, ...metadata);
  return `${lines.join("\n")}\n`;
}

const entries = await readdir(root, { withFileTypes: true });
let created = 0;
let augmented = 0;
let preserved = 0;

for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const skillDir = join(root, entry.name);
  let markdown: string;
  try {
    markdown = await readFile(join(skillDir, "SKILL.md"), "utf8");
  } catch {
    continue;
  }

  const slug = frontmatter(markdown, "name") ?? entry.name;
  const displayName = titleize(slug);
  const iconPath = "./assets/codex-icon.svg";
  const agentsDir = join(skillDir, "agents");
  const assetsDir = join(skillDir, "assets");
  const yamlPath = join(agentsDir, "openai.yaml");
  await mkdir(agentsDir, { recursive: true });

  let yaml: string | undefined;
  try {
    yaml = await readFile(yamlPath, "utf8");
  } catch {}

  if (yaml && /^\s+icon_small:/m.test(yaml) && !yaml.includes(iconPath)) {
    preserved++;
    continue;
  }

  await mkdir(assetsDir, { recursive: true });
  await writeFile(join(assetsDir, "codex-icon.svg"), await iconSvg(slug), "utf8");

  if (yaml) {
    await writeFile(yamlPath, addIconMetadata(yaml, iconPath), "utf8");
    augmented++;
    continue;
  }

  const generated = `interface:\n  display_name: "${displayName.replaceAll('"', '\\"')}"\n  short_description: "${shortDescription(markdown, displayName).replaceAll('"', '\\"')}"\n  icon_small: "${iconPath}"\n  icon_large: "${iconPath}"\n  brand_color: "#F5F5F5"\n  default_prompt: "Use $${slug} to help with this task."\n`;
  await writeFile(yamlPath, generated, "utf8");
  created++;
}

console.log(JSON.stringify({ root, created, augmented, preserved, total: created + augmented + preserved }, null, 2));
