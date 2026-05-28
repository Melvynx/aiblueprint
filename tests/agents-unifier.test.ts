import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { unifyAgentsConfiguration } from "../src/lib/agents-unifier";

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

  beforeEach(async () => {
    root = await makeFixture("unify");
  });

  afterEach(async () => {
    await fs.remove(root).catch(() => {});
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
});
