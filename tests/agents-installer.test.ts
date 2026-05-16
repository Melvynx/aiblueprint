import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getAgentsDir,
  installCategoryToAgents,
  syncCategorySymlinks,
  isAgentCategory,
} from "../src/lib/agents-installer";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-agents-installer-test");

async function makeFixture(suffix: string) {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  const sourceDir = path.join(root, "source/skills");
  const agentsDir = path.join(root, "agents");
  const claudeDir = path.join(root, "claude");
  await fs.ensureDir(sourceDir);
  await fs.ensureDir(agentsDir);
  await fs.ensureDir(claudeDir);
  return { root, sourceDir, agentsDir, claudeDir };
}

async function writeSkill(sourceDir: string, name: string, content = "skill body") {
  const skillDir = path.join(sourceDir, name);
  await fs.ensureDir(skillDir);
  await fs.writeFile(path.join(skillDir, "SKILL.md"), content, "utf-8");
}

describe("getAgentsDir", () => {
  it("returns ~/.agents by default", () => {
    expect(getAgentsDir()).toBe(path.join(os.homedir(), ".agents"));
  });

  it("respects custom override", () => {
    expect(getAgentsDir("/tmp/custom")).toBe(path.resolve("/tmp/custom"));
  });
});

describe("isAgentCategory", () => {
  it("recognises skills and agents", () => {
    expect(isAgentCategory("skills")).toBe(true);
    expect(isAgentCategory("agents")).toBe(true);
  });
  it("rejects others", () => {
    expect(isAgentCategory("commands")).toBe(false);
    expect(isAgentCategory("scripts")).toBe(false);
  });
});

describe("installCategoryToAgents", () => {
  let fixture: Awaited<ReturnType<typeof makeFixture>>;

  beforeEach(async () => {
    fixture = await makeFixture("install");
  });

  afterEach(async () => {
    await fs.remove(fixture.root).catch(() => {});
  });

  it("copies skills into .agents and symlinks them into .claude on first run", async () => {
    await writeSkill(fixture.sourceDir, "alpha");
    await writeSkill(fixture.sourceDir, "beta");

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { silent: true },
    );

    expect(result.copied.sort()).toEqual(["alpha", "beta"]);
    expect(result.symlinked.sort()).toEqual(["alpha", "beta"]);
    expect(result.skipped).toEqual([]);

    expect(await fs.pathExists(path.join(fixture.agentsDir, "skills/alpha/SKILL.md"))).toBe(true);

    const link = await fs.lstat(path.join(fixture.claudeDir, "skills/alpha"));
    expect(link.isSymbolicLink()).toBe(true);

    const readThrough = await fs.readFile(
      path.join(fixture.claudeDir, "skills/alpha/SKILL.md"),
      "utf-8",
    );
    expect(readThrough).toBe("skill body");
  });

  it("keeps existing .agents content (does not overwrite) and still symlinks", async () => {
    await writeSkill(fixture.sourceDir, "alpha", "new content");
    await fs.ensureDir(path.join(fixture.agentsDir, "skills/alpha"));
    await fs.writeFile(
      path.join(fixture.agentsDir, "skills/alpha/SKILL.md"),
      "old content",
      "utf-8",
    );

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { silent: true },
    );

    expect(result.copied).toEqual([]);
    expect(result.symlinked).toEqual(["alpha"]);

    const content = await fs.readFile(
      path.join(fixture.agentsDir, "skills/alpha/SKILL.md"),
      "utf-8",
    );
    expect(content).toBe("old content");
  });

  it("skips symlink creation when .claude/skills/<name> is a real directory", async () => {
    await writeSkill(fixture.sourceDir, "alpha");
    await fs.ensureDir(path.join(fixture.claudeDir, "skills/alpha"));
    await fs.writeFile(
      path.join(fixture.claudeDir, "skills/alpha/MYFILE.md"),
      "user content",
      "utf-8",
    );

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { silent: true },
    );

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].name).toBe("alpha");

    const stat = await fs.lstat(path.join(fixture.claudeDir, "skills/alpha"));
    expect(stat.isSymbolicLink()).toBe(false);

    const userContent = await fs.readFile(
      path.join(fixture.claudeDir, "skills/alpha/MYFILE.md"),
      "utf-8",
    );
    expect(userContent).toBe("user content");
  });

  it("migrates an existing real .claude/skills/<name> into .agents when migrateClaudeDirs=true", async () => {
    await writeSkill(fixture.sourceDir, "alpha");
    await fs.ensureDir(path.join(fixture.claudeDir, "skills/alpha"));
    await fs.writeFile(
      path.join(fixture.claudeDir, "skills/alpha/SKILL.md"),
      "user-installed",
      "utf-8",
    );

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { migrateClaudeDirs: true, silent: true },
    );

    expect(result.migrated).toEqual(["alpha"]);
    expect(result.symlinked).toEqual(["alpha"]);

    const link = await fs.lstat(path.join(fixture.claudeDir, "skills/alpha"));
    expect(link.isSymbolicLink()).toBe(true);

    const movedContent = await fs.readFile(
      path.join(fixture.agentsDir, "skills/alpha/SKILL.md"),
      "utf-8",
    );
    expect(movedContent).toBe("user-installed");
  });

  it("recreates an existing symlink (idempotent)", async () => {
    await writeSkill(fixture.sourceDir, "alpha");
    await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { silent: true },
    );

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { silent: true },
    );

    expect(result.symlinked).toEqual(["alpha"]);
    expect(result.copied).toEqual([]);

    const link = await fs.lstat(path.join(fixture.claudeDir, "skills/alpha"));
    expect(link.isSymbolicLink()).toBe(true);
  });

  it("overwrites .agents content when overwrite=true (sync modified path)", async () => {
    await fs.ensureDir(path.join(fixture.agentsDir, "skills/alpha"));
    await fs.writeFile(
      path.join(fixture.agentsDir, "skills/alpha/SKILL.md"),
      "old",
      "utf-8",
    );
    await writeSkill(fixture.sourceDir, "alpha", "new");

    const result = await installCategoryToAgents(
      fixture.sourceDir,
      "skills",
      fixture.agentsDir,
      fixture.claudeDir,
      { overwrite: true, silent: true },
    );

    expect(result.copied).toEqual(["alpha"]);
    const content = await fs.readFile(
      path.join(fixture.agentsDir, "skills/alpha/SKILL.md"),
      "utf-8",
    );
    expect(content).toBe("new");
  });
});

describe("syncCategorySymlinks", () => {
  let fixture: Awaited<ReturnType<typeof makeFixture>>;

  beforeEach(async () => {
    fixture = await makeFixture("symlinks");
  });

  afterEach(async () => {
    await fs.remove(fixture.root).catch(() => {});
  });

  it("removes dangling symlinks pointing at nothing", async () => {
    const agentsCategory = path.join(fixture.agentsDir, "skills");
    const claudeCategory = path.join(fixture.claudeDir, "skills");
    await fs.ensureDir(agentsCategory);
    await fs.ensureDir(claudeCategory);

    const ghostSource = path.join(fixture.root, "ghost");
    await fs.ensureDir(ghostSource);
    await fs.symlink(ghostSource, path.join(claudeCategory, "ghost"));
    await fs.remove(ghostSource);

    await syncCategorySymlinks("skills", fixture.agentsDir, fixture.claudeDir, undefined, true);

    expect(await fs.pathExists(path.join(claudeCategory, "ghost"))).toBe(false);
  });
});
