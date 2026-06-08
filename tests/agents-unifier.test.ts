import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { previewAgentsConfiguration, unifyAgentsConfiguration } from "../src/lib/agents-unifier";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-agents-unifier-test");

async function makeFixture(suffix: string) {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  await fs.ensureDir(root);
  return root;
}

async function writeSkill(root: string, relativeDir: string, name: string, content: string) {
  const skillDir = path.join(root, relativeDir, name);
  await fs.ensureDir(skillDir);
  await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf-8");
}

async function writeAgent(root: string, relativeDir: string, name: string, content: string) {
  const agentDir = path.join(root, relativeDir);
  await fs.ensureDir(agentDir);
  await fs.writeFile(path.join(agentDir, name), content, "utf-8");
}

describe("unifyAgentsConfiguration", () => {
  let root: string;
  let backupRoot: string;

  beforeEach(async () => {
    root = await makeFixture("unify");
    backupRoot = await makeFixture("backup");
    process.env.AIBLUEPRINT_BACKUP_DIR = backupRoot;
  });

  afterEach(async () => {
    delete process.env.AIBLUEPRINT_BACKUP_DIR;
    await fs.remove(root).catch(() => {});
    await fs.remove(backupRoot).catch(() => {});
  });

  it("imports known tool skills and agents into .agents, skips exact duplicates, and replaces source dirs with symlinks", async () => {
    await fs.outputFile(path.join(root, ".claude/CLAUDE.md"), "shared instructions");
    await fs.outputFile(path.join(root, ".codex/AGENTS.md"), "shared instructions");
    await writeSkill(root, ".claude/skills", "alpha", "alpha skill");
    await writeSkill(root, ".cursor/skills", "alpha", "alpha skill");
    await writeSkill(root, ".cursor/skills-cursor", "cursor-only", "cursor skill");
    await writeSkill(root, ".config/opencode/skills", "opencode-only", "opencode skill");

    await writeAgent(root, ".claude/agents", "helper.md", "helper agent");
    await writeAgent(root, ".claude/agnets", "typo.md", "typo agent");
    await writeAgent(root, ".cursor/agents", "helper.md", "helper agent");
    await writeAgent(root, ".factory/droids", "factory.md", "factory agent");

    const result = await unifyAgentsConfiguration({ folder: root });

    expect(await fs.readFile(path.join(root, ".agents/AGENTS.md"), "utf-8")).toBe("shared instructions");
    expect((await fs.lstat(path.join(root, ".claude/CLAUDE.md"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, ".codex/AGENTS.md"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, ".cursor/AGENTS.md"))).isSymbolicLink()).toBe(true);

    expect(await fs.readFile(path.join(root, ".agents/skills/alpha/SKILL.md"), "utf-8")).toBe("alpha skill");
    expect(await fs.readFile(path.join(root, ".agents/skills/cursor-only/SKILL.md"), "utf-8")).toBe("cursor skill");
    expect(await fs.readFile(path.join(root, ".agents/skills/opencode-only/SKILL.md"), "utf-8")).toBe("opencode skill");

    expect(await fs.readFile(path.join(root, ".agents/agents/helper.md"), "utf-8")).toBe("helper agent");
    expect(await fs.readFile(path.join(root, ".agents/agents/typo.md"), "utf-8")).toBe("typo agent");
    expect(await fs.readFile(path.join(root, ".agents/agents/factory.md"), "utf-8")).toBe("factory agent");

    expect(result.duplicates.map((entry) => entry.name).sort()).toEqual(["AGENTS.md", "alpha", "helper.md"]);

    for (const sourcePath of [
      ".claude/skills",
      ".codex/skills",
      ".cursor/skills",
      ".cursor/skills-cursor",
      ".config/opencode/skills",
      ".claude/agents",
      ".claude/agnets",
      ".cursor/agents",
      ".factory/droids",
    ]) {
      const stat = await fs.lstat(path.join(root, sourcePath));
      expect(stat.isSymbolicLink()).toBe(true);
    }

    expect(result.backupPath).toBeTruthy();
    expect(await fs.pathExists(path.join(result.backupPath!, ".claude/CLAUDE.md"))).toBe(true);
    expect(await fs.pathExists(path.join(result.backupPath!, ".claude/agents/helper.md"))).toBe(true);
  });

  it("preserves conflicting instruction files before linking tool-specific paths to .agents", async () => {
    await fs.outputFile(path.join(root, ".agents/AGENTS.md"), "shared base");
    await fs.outputFile(path.join(root, ".codex/AGENTS.md"), "codex specific");

    const result = await unifyAgentsConfiguration({ folder: root });

    expect(await fs.readFile(path.join(root, ".agents/AGENTS.md"), "utf-8")).toBe("shared base");
    expect(await fs.readFile(path.join(root, ".agents/AGENTS--codex-instructions.md"), "utf-8")).toBe("codex specific");
    expect((await fs.lstat(path.join(root, ".codex/AGENTS.md"))).isSymbolicLink()).toBe(true);
    expect(result.renamed).toContainEqual(expect.objectContaining({
      category: "instructions",
      to: path.join(root, ".agents/AGENTS--codex-instructions.md"),
    }));
    expect(result.backupPath).toBeTruthy();
    expect(await fs.pathExists(path.join(result.backupPath!, ".codex/AGENTS.md"))).toBe(true);
  });

  it("renames same-name entries when their content differs", async () => {
    await writeAgent(root, ".claude/agents", "worker.md", "claude worker");
    await writeAgent(root, ".cursor/agents", "worker.md", "cursor worker");

    const result = await unifyAgentsConfiguration({ folder: root });

    expect(await fs.readFile(path.join(root, ".agents/agents/worker.md"), "utf-8")).toBe("claude worker");
    expect(await fs.readFile(path.join(root, ".agents/agents/worker--cursor-agents.md"), "utf-8")).toBe("cursor worker");
    expect(result.renamed).toHaveLength(1);
    expect(result.renamed[0].reason).toBe("Same name with different content");
  });

  it("only unifies selected categories when categories are provided", async () => {
    await fs.outputFile(path.join(root, ".claude/CLAUDE.md"), "shared instructions");
    await writeSkill(root, ".claude/skills", "alpha", "alpha skill");
    await writeAgent(root, ".claude/agents", "helper.md", "helper agent");

    const result = await unifyAgentsConfiguration({ folder: root, categories: ["skills"] });

    expect(await fs.readFile(path.join(root, ".agents/skills/alpha/SKILL.md"), "utf-8")).toBe("alpha skill");
    expect(await fs.pathExists(path.join(root, ".agents/AGENTS.md"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents/agents"))).toBe(false);
    expect((await fs.lstat(path.join(root, ".claude/skills"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, ".claude/CLAUDE.md"))).isSymbolicLink()).toBe(false);
    expect((await fs.lstat(path.join(root, ".claude/agents"))).isSymbolicLink()).toBe(false);
    expect(result.imported.map((entry) => entry.category)).toEqual(["skills"]);
  });

  it("is idempotent after source folders already point at .agents", async () => {
    await writeSkill(root, ".claude/skills", "alpha", "alpha skill");

    const first = await unifyAgentsConfiguration({ folder: root });
    const second = await unifyAgentsConfiguration({ folder: root });

    expect(first.imported.map((entry) => entry.name)).toContain("alpha");
    expect(second.imported).toEqual([]);
    expect(second.duplicates).toEqual([]);

    const stat = await fs.lstat(path.join(root, ".claude/skills"));
    expect(stat.isSymbolicLink()).toBe(true);
  });

  it("does not create empty project category folders or .codex when only rules exist", async () => {
    await fs.ensureDir(path.join(root, ".claude/rules"));
    await fs.writeFile(path.join(root, ".claude/rules/testing.md"), "# Testing\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/testing.md"))).toBe(true);
    expect(await fs.pathExists(path.join(root, ".agents/skills"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents/agents"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".codex"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".cursor"))).toBe(false);
    expect(result.backupPath).toBeTruthy();
    expect(result.backupPath!.startsWith(root)).toBe(false);
    expect(path.basename(result.backupPath!)).toContain("project-");
  });

  it("imports repository tool instruction files into .agents and links tool paths back", async () => {
    await fs.outputFile(path.join(root, ".claude/CLAUDE.md"), "shared instructions");
    await fs.outputFile(path.join(root, ".codex/AGENTS.md"), "shared instructions");
    await fs.outputFile(path.join(root, ".cursor/AGENTS.md"), "cursor instructions");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.readFile(path.join(root, ".agents/AGENTS.md"), "utf-8")).toBe("shared instructions");
    expect(await fs.readFile(path.join(root, ".agents/AGENTS--cursor-instructions.md"), "utf-8")).toBe("cursor instructions");
    expect((await fs.lstat(path.join(root, ".claude/CLAUDE.md"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, ".codex/AGENTS.md"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, ".cursor/AGENTS.md"))).isSymbolicLink()).toBe(true);
    expect(await fs.realpath(path.join(root, ".claude/CLAUDE.md"))).toBe(await fs.realpath(path.join(root, ".agents/AGENTS.md")));
    expect(await fs.realpath(path.join(root, ".codex/AGENTS.md"))).toBe(await fs.realpath(path.join(root, ".agents/AGENTS.md")));
    expect(await fs.realpath(path.join(root, ".cursor/AGENTS.md"))).toBe(await fs.realpath(path.join(root, ".agents/AGENTS.md")));
    expect(result.duplicates).toContainEqual(expect.objectContaining({
      category: "instructions",
      from: path.join(root, ".codex/AGENTS.md"),
      keptAs: path.join(root, ".agents/AGENTS.md"),
    }));
    expect(result.renamed).toContainEqual(expect.objectContaining({
      category: "instructions",
      from: path.join(root, ".cursor/AGENTS.md"),
      to: path.join(root, ".agents/AGENTS--cursor-instructions.md"),
    }));
  });

  it("symlinks CLAUDE.md to existing AGENTS.md in project mode without creating empty folders", async () => {
    await fs.writeFile(path.join(root, "AGENTS.md"), "# Project Agents\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect((await fs.lstat(path.join(root, "CLAUDE.md"))).isSymbolicLink()).toBe(true);
    expect(await fs.realpath(path.join(root, "CLAUDE.md"))).toBe(await fs.realpath(path.join(root, "AGENTS.md")));
    expect(await fs.readFile(path.join(root, "AGENTS.md"), "utf-8")).toBe("# Project Agents\n");
    expect(await fs.pathExists(path.join(root, ".agents/skills"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents/agents"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents/rules"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".codex"))).toBe(false);
    expect(result.instructionIndex?.indexedRules).toEqual([]);
    expect(result.linked).toContainEqual(expect.objectContaining({
      category: "instructions",
      from: path.join(root, "CLAUDE.md"),
      to: path.join(root, "AGENTS.md"),
    }));
  });

  it("previews CLAUDE.md symlink for an existing project AGENTS.md without mutating files", async () => {
    await fs.writeFile(path.join(root, "AGENTS.md"), "# Project Agents\n", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.instructionIndex?.agentsPath).toBe(path.join(root, "AGENTS.md"));
    expect(result.instructionIndex?.indexedRules).toEqual([]);
    expect(result.linked).toContainEqual(expect.objectContaining({
      category: "instructions",
      from: path.join(root, "CLAUDE.md"),
      to: path.join(root, "AGENTS.md"),
    }));
    expect(await fs.pathExists(path.join(root, "CLAUDE.md"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents"))).toBe(false);
  });

  it("previews project unify changes without mutating files", async () => {
    await fs.ensureDir(path.join(root, ".claude/rules"));
    await fs.writeFile(path.join(root, ".claude/rules/testing.md"), "# Testing\n", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.imported).toContainEqual(expect.objectContaining({
      from: path.join(root, ".claude/rules/testing.md"),
      to: path.join(root, ".agents/rules/testing.md"),
    }));
    expect(result.linked).toContainEqual(expect.objectContaining({
      from: path.join(root, ".claude/rules"),
      to: path.join(root, ".agents/rules"),
    }));
    expect(result.instructionIndex?.agentsPath).toBe(path.join(root, "AGENTS.md"));
    expect(await fs.pathExists(path.join(root, ".agents"))).toBe(false);
    expect(await fs.pathExists(path.join(root, "AGENTS.md"))).toBe(false);
    expect(result.backupPath ? await fs.pathExists(result.backupPath) : false).toBe(false);
  });

  it("unifies repository rules and memories, indexes them in AGENTS.md, and symlinks CLAUDE.md", async () => {
    await writeSkill(
      root,
      ".claude/skills",
      "uses-claude-paths",
      "Read .claude/rules/testing.md before editing .codex/agents/reviewer.md",
    );
    await writeAgent(root, ".claude/agents", "reviewer.md", "Review with .claude/skills/uses-claude-paths");
    await fs.ensureDir(path.join(root, ".claude/rules"));
    await fs.writeFile(path.join(root, ".claude/rules/testing.md"), "# Testing\n\nRun the test suite.", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules"));
    await fs.writeFile(path.join(root, ".cursor/rules/ui.mdc"), "# UI\n\nUse accessible controls.", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/memories"));
    await fs.writeFile(path.join(root, ".cursor/memories/project.md"), "# Project Memory\n\nPrefer .codex/rules.", "utf-8");
    await fs.writeFile(path.join(root, "CLAUDE.md"), "# Project Guide\n\nKeep this content.", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.readFile(path.join(root, ".agents/rules/testing.md"), "utf-8")).toContain("Run the test suite.");
    expect(await fs.readFile(path.join(root, ".agents/rules/ui.md"), "utf-8")).toContain("Use accessible controls.");
    expect(await fs.readFile(path.join(root, ".agents/rules/project.md"), "utf-8")).toContain("Prefer .agents/rules.");

    expect(await fs.readFile(path.join(root, ".agents/skills/uses-claude-paths/SKILL.md"), "utf-8"))
      .toBe("Read .agents/rules/testing.md before editing .agents/agents/reviewer.md");
    expect(await fs.readFile(path.join(root, ".agents/agents/reviewer.md"), "utf-8"))
      .toBe("Review with .agents/skills/uses-claude-paths");

    expect((await fs.lstat(path.join(root, ".claude/rules"))).isSymbolicLink()).toBe(true);
    expect((await fs.lstat(path.join(root, "CLAUDE.md"))).isSymbolicLink()).toBe(true);

    const agentsIndex = await fs.readFile(path.join(root, "AGENTS.md"), "utf-8");
    expect(agentsIndex).toContain("# Project Guide");
    expect(agentsIndex).toContain("Keep this content.");
    expect(agentsIndex).toContain("## Rules");
    expect(agentsIndex).toContain("**Testing** - [.agents/rules/testing.md](.agents/rules/testing.md)");
    expect(agentsIndex).toContain("**UI** - [.agents/rules/ui.md](.agents/rules/ui.md)");
    expect(agentsIndex).toContain("**Project Memory** - [.agents/rules/project.md](.agents/rules/project.md)");

    expect(result.instructionIndex?.indexedRules.sort()).toEqual([
      ".agents/rules/project.md",
      ".agents/rules/testing.md",
      ".agents/rules/ui.md",
    ]);
    expect(result.backupPath).toBeTruthy();
    expect(await fs.pathExists(path.join(result.backupPath!, "CLAUDE.md"))).toBe(true);
  });

  it("migrates existing repository rule .mdc files to .md when refreshing the index", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules"));
    await fs.writeFile(path.join(root, ".agents/rules/ui.mdc"), "# UI\n\nUse accessible controls.", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/ui.mdc"))).toBe(false);
    expect(await fs.readFile(path.join(root, ".agents/rules/ui.md"), "utf-8")).toContain("Use accessible controls.");

    const agentsIndex = await fs.readFile(path.join(root, "AGENTS.md"), "utf-8");
    expect(agentsIndex).toContain("**UI** - [.agents/rules/ui.md](.agents/rules/ui.md)");
    expect(result.renamed).toContainEqual(expect.objectContaining({
      category: "rules",
      from: path.join(root, ".agents/rules/ui.mdc"),
      to: path.join(root, ".agents/rules/ui.md"),
      reason: "Rule file extension normalized from .mdc to .md",
    }));
  });

  it("previews existing repository rule .mdc migration without indexing stale .mdc paths", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules"));
    await fs.writeFile(path.join(root, ".agents/rules/ui.mdc"), "# UI\n\nUse accessible controls.", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.instructionIndex?.indexedRules).toEqual([".agents/rules/ui.md"]);
    expect(await fs.pathExists(path.join(root, ".agents/rules/ui.mdc"))).toBe(true);
    expect(await fs.pathExists(path.join(root, ".agents/rules/ui.md"))).toBe(false);
  });

  it("previews nested imported cursor rules as final .md paths", async () => {
    await fs.ensureDir(path.join(root, ".cursor/rules/nested"));
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.mdc"), "# Nested UI\n", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.instructionIndex?.indexedRules).toEqual([".agents/rules/nested/ui.md"]);
  });

  it("previews nested .md and .mdc source collisions with suffixed final paths", async () => {
    await fs.ensureDir(path.join(root, ".cursor/rules/nested"));
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.md"), "# Nested MD\n", "utf-8");
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.mdc"), "# Nested MDC\n", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.instructionIndex?.indexedRules.sort()).toEqual([
      ".agents/rules/nested/ui--agents-rules.md",
      ".agents/rules/nested/ui.md",
    ]);
  });

  it("previews duplicate imports against planned suffixed .mdc migrations", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules"));
    await fs.writeFile(path.join(root, ".agents/rules/ui.md"), "# Existing MD\n", "utf-8");
    await fs.writeFile(path.join(root, ".agents/rules/ui.mdc"), "# Existing MDC\n", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules"));
    await fs.writeFile(path.join(root, ".cursor/rules/ui.mdc"), "# Existing MDC\n", "utf-8");

    const result = await previewAgentsConfiguration({ folder: root, scope: "repository" });

    expect(result.duplicates).toContainEqual(expect.objectContaining({
      category: "rules",
      from: path.join(root, ".cursor/rules/ui.mdc"),
      keptAs: path.join(root, ".agents/rules/ui--agents-rules.md"),
    }));
    expect(result.instructionIndex?.indexedRules.sort()).toEqual([
      ".agents/rules/ui--agents-rules.md",
      ".agents/rules/ui.md",
    ]);
  });

  it("keeps existing .agents rule content at the canonical .md path when cursor imports conflict", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules"));
    await fs.writeFile(path.join(root, ".agents/rules/ui.mdc"), "# Existing UI\n", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules"));
    await fs.writeFile(path.join(root, ".cursor/rules/ui.mdc"), "# Cursor UI\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.readFile(path.join(root, ".agents/rules/ui.md"), "utf-8")).toBe("# Existing UI\n");
    expect(await fs.readFile(path.join(root, ".agents/rules/ui--cursor-rules.md"), "utf-8")).toBe("# Cursor UI\n");
    expect(result.instructionIndex?.indexedRules.sort()).toEqual([
      ".agents/rules/ui--cursor-rules.md",
      ".agents/rules/ui.md",
    ]);
  });

  it("skips duplicate nested rule directories after normalizing .mdc names", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules/nested"));
    await fs.writeFile(path.join(root, ".agents/rules/nested/ui.mdc"), "# Nested UI\n", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules/nested"));
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.mdc"), "# Nested UI\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.readFile(path.join(root, ".agents/rules/nested/ui.md"), "utf-8")).toBe("# Nested UI\n");
    expect(await fs.pathExists(path.join(root, ".agents/rules/nested--cursor-rules"))).toBe(false);
    expect(result.duplicates).toContainEqual(expect.objectContaining({
      category: "rules",
      from: path.join(root, ".cursor/rules/nested"),
      keptAs: path.join(root, ".agents/rules/nested"),
    }));
  });

  it("skips duplicate nested directories with canonical suffixed rule collisions", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules/nested"));
    await fs.writeFile(path.join(root, ".agents/rules/nested/ui.md"), "# Nested MD\n", "utf-8");
    await fs.writeFile(path.join(root, ".agents/rules/nested/ui--agents-rules.md"), "# Nested MDC\n", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules/nested"));
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.md"), "# Nested MD\n", "utf-8");
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.mdc"), "# Nested MDC\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/nested--cursor-rules"))).toBe(false);
    expect(result.duplicates).toContainEqual(expect.objectContaining({
      category: "rules",
      from: path.join(root, ".cursor/rules/nested"),
      keptAs: path.join(root, ".agents/rules/nested"),
    }));
  });

  it("skips duplicate nested directories when .md and .mdc collapse to identical final rules", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules/nested"));
    await fs.writeFile(path.join(root, ".agents/rules/nested/ui.md"), "# Nested UI\n", "utf-8");
    await fs.ensureDir(path.join(root, ".cursor/rules/nested"));
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.md"), "# Nested UI\n", "utf-8");
    await fs.writeFile(path.join(root, ".cursor/rules/nested/ui.mdc"), "# Nested UI\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/nested--cursor-rules"))).toBe(false);
    expect(result.duplicates).toContainEqual(expect.objectContaining({
      category: "rules",
      from: path.join(root, ".cursor/rules/nested"),
      keptAs: path.join(root, ".agents/rules/nested"),
    }));
  });

  it("uses .md as the canonical rule when a source contains matching .md and .mdc names", async () => {
    await fs.ensureDir(path.join(root, ".cursor/rules"));
    await fs.writeFile(path.join(root, ".cursor/rules/ui.mdc"), "# Cursor MDC\n", "utf-8");
    await fs.writeFile(path.join(root, ".cursor/rules/ui.md"), "# Cursor MD\n", "utf-8");

    const result = await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    expect(await fs.readFile(path.join(root, ".agents/rules/ui.md"), "utf-8")).toBe("# Cursor MD\n");
    expect(await fs.readFile(path.join(root, ".agents/rules/ui--cursor-rules.md"), "utf-8")).toBe("# Cursor MDC\n");
    expect(result.instructionIndex?.indexedRules.sort()).toEqual([
      ".agents/rules/ui--cursor-rules.md",
      ".agents/rules/ui.md",
    ]);
  });

  it("refreshes the repository rules index idempotently without dropping distinct Claude instructions", async () => {
    await fs.ensureDir(path.join(root, ".agents/rules"));
    await fs.writeFile(path.join(root, ".agents/rules/testing.md"), "# Testing\n", "utf-8");
    await fs.writeFile(path.join(root, "AGENTS.md"), "# Agent Guide\n", "utf-8");
    await fs.writeFile(path.join(root, "CLAUDE.md"), "# Claude Guide\n", "utf-8");

    await unifyAgentsConfiguration({ folder: root, scope: "repository" });
    await unifyAgentsConfiguration({ folder: root, scope: "repository" });

    const agentsIndex = await fs.readFile(path.join(root, "AGENTS.md"), "utf-8");
    expect(agentsIndex).toContain("# Agent Guide");
    expect(agentsIndex).toContain("## Previous Claude Instructions");
    expect(agentsIndex).toContain("# Claude Guide");
    expect(agentsIndex.match(/## Rules/g)).toHaveLength(1);
    expect(agentsIndex.match(/AIBLUEPRINT:RULES:START/g)).toHaveLength(1);
  });
});
