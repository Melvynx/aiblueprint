#!/usr/bin/env bun

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

const args = process.argv.slice(2);
const valueOf = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const projectRoot = resolve(valueOf("--project", process.cwd()));
const format = valueOf("--format", "markdown");
const home = homedir();
const globalRoot = join(home, ".agents", "skills");
const localRoot = join(projectRoot, ".agents", "skills");

const walk = (root, accept) => {
  if (!existsSync(root)) return [];
  const found = [];
  const visit = (path) => {
    let entries = [];
    try {
      entries = readdirSync(path, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && accept(child)) found.push(child);
    }
  };
  visit(root);
  return found;
};

const readText = (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
};

const parseFrontmatter = (text) => {
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---", 4);
  if (end < 0) return {};
  const result = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    result[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return result;
};

const inventoryRoot = (root, scope) => {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => {
      const directory = join(root, entry.name);
      const skillPath = join(directory, "SKILL.md");
      if (!existsSync(skillPath)) return null;
      const body = readText(skillPath);
      const metadata = parseFrontmatter(body);
      const openai = readText(join(directory, "agents", "openai.yaml"));
      const selfFiles = walk(directory, (path) => !/\.(png|jpe?g|gif|webp|mp4|mov|pdf|db|sqlite)$/i.test(path));
      const escapedName = (metadata.name || entry.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const invocationGuard = new RegExp(`(?:manual-only[^\\n]*|proceed only[^\\n]*)\\$${escapedName}(?![a-zA-Z0-9_-])`, "i");
      const projectReferences = selfFiles.filter((path) => readText(path).includes(projectRoot));
      return {
        name: metadata.name || entry.name,
        scope,
        directory,
        skill_path: skillPath,
        description: metadata.description || "",
        claude_explicit_only: metadata["disable-model-invocation"] === "true",
        codex_explicit_only: /allow_implicit_invocation:\s*false\b/.test(openai),
        direct_user_intent: invocationGuard.test(body.slice(0, 2500)),
        project_references: projectReferences,
        project_runtime_references: projectReferences.filter((path) => path.includes("/scripts/") || path.includes("/agents/")),
      };
    })
    .filter(Boolean);
};

const skills = [...inventoryRoot(globalRoot, "global"), ...inventoryRoot(localRoot, "project")];
const names = [...new Set(skills.map((skill) => skill.name))].sort((a, b) => b.length - a.length);
const usage = new Map(names.map((name) => [name, {
  user: 0,
  nativeModel: 0,
  manifestRead: 0,
  cwd: new Map(),
  sources: new Set(),
}]));

const record = (name, kind, cwd, source) => {
  const target = usage.get(name);
  if (!target) return;
  target[kind] += 1;
  if (cwd) target.cwd.set(cwd, (target.cwd.get(cwd) || 0) + 1);
  target.sources.add(source);
};

const strictUserNames = (text) => {
  if (typeof text !== "string") return [];
  return names.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\$${escaped}(?![a-zA-Z0-9_-])`, "i").test(text);
  });
};

const manifestNames = (text) => {
  if (typeof text !== "string") return [];
  return names.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`skills\\/${escaped}\\/SKILL\\.md`, "i").test(text);
  });
};

const codexCwd = new Map();
const stateDbPath = join(home, ".codex", "sqlite", "state_5.sqlite");
if (existsSync(stateDbPath)) {
  try {
    const db = new Database(stateDbPath, { readonly: true });
    for (const row of db.query("SELECT rollout_path, cwd FROM threads").all()) {
      codexCwd.set(resolve(String(row.rollout_path)), String(row.cwd || ""));
    }
    db.close();
  } catch {
    // The transcript remains usable; only cwd attribution is reduced.
  }
}

const transcriptRoots = [
  join(home, ".codex", "sessions"),
  join(home, ".codex", "archived_sessions"),
  join(home, ".claude", "projects"),
  join(home, ".cursor", "projects"),
].filter(existsSync);

const transcriptFiles = transcriptRoots.flatMap((root) => walk(root, (path) => path.endsWith(".jsonl")));
const escapedNames = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const patterns = [
  `\\$(?:${escapedNames})(?:[^a-zA-Z0-9_-]|$)`,
  `\\"name\\":\\"Skill\\"`,
  `skills/(?:${escapedNames})/SKILL\\.md`,
];

let matchedLines = 0;
let earliest = null;
let latest = null;
const observeTimestamp = (value) => {
  if (typeof value !== "string") return;
  if (!earliest || value < earliest) earliest = value;
  if (!latest || value > latest) latest = value;
};

if (transcriptRoots.length > 0 && names.length > 0) {
  const rgArgs = ["rg", "--json", "--no-messages", ...patterns.flatMap((pattern) => ["-e", pattern]), ...transcriptRoots];
  const process = Bun.spawn(rgArgs, { stdout: "pipe", stderr: "pipe" });
  const [output, errorOutput, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (exitCode > 1) {
    throw new Error(`rg transcript scan failed (${exitCode}): ${errorOutput.trim()}`);
  }
  for (const rgLine of output.split("\n")) {
    if (!rgLine) continue;
    let event;
    try {
      event = JSON.parse(rgLine);
    } catch {
      continue;
    }
    if (event.type !== "match") continue;
    const path = resolve(event.data?.path?.text || "");
    const line = event.data?.lines?.text || "";
    let item;
    try {
      item = JSON.parse(line);
    } catch {
      continue;
    }
    matchedLines += 1;
    observeTimestamp(item.timestamp);
    const isClaude = path.startsWith(join(home, ".claude"));
    const isCodex = path.startsWith(join(home, ".codex"));
    const isCursor = path.startsWith(join(home, ".cursor"));
    const source = isClaude ? "claude" : isCodex ? "codex" : isCursor ? "cursor" : "unknown";
    const cwd = item.cwd || codexCwd.get(path) || "";

    if (isCodex && item.type === "event_msg" && item.payload?.type === "user_message") {
      for (const name of strictUserNames(item.payload.message || "")) record(name, "user", cwd, source);
    }

    if (isClaude && item.type === "user" && !item.sourceToolAssistantUUID) {
      const content = item.message?.content;
      const text = typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.filter((part) => part.type === "text").map((part) => part.text || "").join("\n")
          : "";
      for (const name of strictUserNames(text)) record(name, "user", cwd, source);
    }

    if (isCursor && item.role === "user") {
      const content = item.message?.content;
      const text = Array.isArray(content)
        ? content.filter((part) => part.type === "text").map((part) => part.text || "").join("\n")
        : "";
      for (const name of strictUserNames(text)) record(name, "user", cwd, source);
    }

    if (isClaude && item.type === "assistant" && Array.isArray(item.message?.content)) {
      for (const part of item.message.content) {
        if (part.type === "tool_use" && part.name === "Skill" && usage.has(part.input?.skill)) {
          record(part.input.skill, "nativeModel", cwd, source);
        }
      }
    }

    const isGenericTool = (isCodex && item.type === "response_item" && ["custom_tool_call", "function_call"].includes(item.payload?.type))
      || (isClaude && item.type === "assistant")
      || (isCursor && item.role === "assistant");
    if (isGenericTool) {
      for (const name of manifestNames(line)) record(name, "manifestRead", cwd, source);
    }
  }
}

if (!earliest || !latest) {
  for (const path of transcriptFiles) {
    try {
      const timestamp = statSync(path).mtime.toISOString();
      if (!earliest || timestamp < earliest) earliest = timestamp;
      if (!latest || timestamp > latest) latest = timestamp;
    } catch {
      // Coverage count remains valid even when a file disappears during the audit.
    }
  }
}

const duplicateNames = new Set(
  names.filter((name) => skills.filter((skill) => skill.name === name).length > 1),
);

const rows = skills.map((skill) => {
  const observed = usage.get(skill.name);
  const cwd = Object.fromEntries([...observed.cwd.entries()].sort((a, b) => b[1] - a[1]));
  const classifications = [];
  const recommendations = [];
  if (observed.user > 0) classifications.push("OBSERVED_USER");
  if (observed.nativeModel > 0) classifications.push("OBSERVED_MODEL");
  if (observed.manifestRead > 0) classifications.push("MANIFEST_READ_EVIDENCE");
  if (observed.user + observed.nativeModel + observed.manifestRead === 0) classifications.push("UNOBSERVED");
  if (skill.claude_explicit_only && skill.codex_explicit_only) classifications.push("EXPLICIT_ONLY");
  if (skill.claude_explicit_only !== skill.codex_explicit_only) {
    classifications.push("INVOCATION_MISMATCH");
    recommendations.push("mirror-explicit-only-control");
  }
  if (skill.direct_user_intent && !(skill.claude_explicit_only && skill.codex_explicit_only)) {
    recommendations.push("make-explicit-only");
  }
  if (duplicateNames.has(skill.name)) classifications.push("NAME_COLLISION");
  const observedCwds = Object.keys(cwd);
  const observedCount = observed.user + observed.nativeModel + observed.manifestRead;
  const onlyProjectUsage = observedCount >= 2
    && observedCwds.length > 0
    && observedCwds.every((path) => path === projectRoot || path.startsWith(`${projectRoot}/`));
  const hasProjectRuntimeDependency = skill.project_runtime_references.length > 0;
  if (skill.scope === "global" && (hasProjectRuntimeDependency || onlyProjectUsage)) {
    classifications.push("LOCALITY_CANDIDATE");
    recommendations.push(hasProjectRuntimeDependency ? "review-move-to-project-runtime-evidence" : "review-move-to-project-usage-only");
  }
  return {
    ...skill,
    usage: {
      user_explicit: observed.user,
      native_model: observed.nativeModel,
      manifest_read_evidence: observed.manifestRead,
      cwd,
      sources: [...observed.sources].sort(),
    },
    classifications,
    recommendations: [...new Set(recommendations)],
  };
}).sort((a, b) => a.name.localeCompare(b.name) || a.scope.localeCompare(b.scope));

const result = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  project_root: projectRoot,
  coverage: {
    transcript_files: transcriptFiles.length,
    matched_jsonl_records: matchedLines,
    codex_model_invocation: "NOT_INSTRUMENTED; manifest reads are heuristic evidence only",
    claude_model_invocation: "NATIVE Skill tool calls",
    cursor_model_invocation: "NOT_INSTRUMENTED; manifest reads are heuristic evidence only",
    earliest_timestamp: earliest,
    latest_timestamp: latest,
  },
  summary: {
    skill_rows: rows.length,
    unique_names: new Set(rows.map((row) => row.name)).size,
    global: rows.filter((row) => row.scope === "global").length,
    project: rows.filter((row) => row.scope === "project").length,
    unobserved: rows.filter((row) => row.classifications.includes("UNOBSERVED")).length,
    explicit_only: rows.filter((row) => row.classifications.includes("EXPLICIT_ONLY")).length,
    invocation_mismatches: rows.filter((row) => row.classifications.includes("INVOCATION_MISMATCH")).length,
    locality_candidates: rows.filter((row) => row.classifications.includes("LOCALITY_CANDIDATE")).length,
    name_collisions: duplicateNames.size,
  },
  skills: rows,
};

if (format === "json") {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log("# Skill audit");
console.log(`\n- Project: \`${projectRoot}\``);
console.log(`- Coverage: ${result.coverage.transcript_files} transcript files; ${result.coverage.matched_jsonl_records} relevant records parsed`);
console.log(`- Time range observed: ${earliest || "unknown"} → ${latest || "unknown"}`);
console.log(`- Skills: ${result.summary.skill_rows} rows / ${result.summary.unique_names} unique names`);
console.log(`- Unobserved: ${result.summary.unobserved}; explicit-only: ${result.summary.explicit_only}; invocation mismatches: ${result.summary.invocation_mismatches}`);
console.log(`- Locality candidates: ${result.summary.locality_candidates}; name collisions: ${result.summary.name_collisions}`);
console.log(`- Codex/Cursor model invocation: NOT INSTRUMENTED; manifest reads are heuristic only`);
console.log("\n| Skill | Scope | User | Claude native | Manifest read | Invocation | Classification | Recommendation |");
console.log("|---|---:|---:|---:|---:|---|---|---|");
for (const row of rows) {
  const invocation = row.claude_explicit_only && row.codex_explicit_only
    ? "explicit-only"
    : row.claude_explicit_only || row.codex_explicit_only
      ? "mismatch"
      : "implicit";
  console.log(`| ${row.name} | ${row.scope} | ${row.usage.user_explicit} | ${row.usage.native_model} | ${row.usage.manifest_read_evidence} | ${invocation} | ${row.classifications.join(", ") || "-"} | ${row.recommendations.join(", ") || "-"} |`);
}
