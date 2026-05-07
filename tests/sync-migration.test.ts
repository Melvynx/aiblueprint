import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncSelectedItems, type SyncItem } from "../src/lib/sync-utils";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-sync-migration-test");

async function makeFixture(suffix: string) {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  const claudeDir = path.join(root, "claude");
  const agentsDir = path.join(root, "agents");
  await fs.ensureDir(claudeDir);
  await fs.ensureDir(agentsDir);
  return { root, claudeDir, agentsDir };
}

describe("syncSelectedItems – migration", () => {
  let fixture: Awaited<ReturnType<typeof makeFixture>>;

  beforeEach(async () => {
    fixture = await makeFixture("migration");
  });

  afterEach(async () => {
    await fs.remove(fixture.root).catch(() => {});
    vi.restoreAllMocks();
  });

  it("moves a real .claude/skills/<name> dir to .agents/skills and creates a symlink", async () => {
    const claudeSkillDir = path.join(fixture.claudeDir, "skills/my-skill");
    await fs.ensureDir(claudeSkillDir);
    await fs.writeFile(
      path.join(claudeSkillDir, "SKILL.md"),
      "user-installed",
      "utf-8",
    );

    const item: SyncItem = {
      name: "my-skill",
      relativePath: "skills/my-skill",
      status: "migration",
      category: "skills",
      isFolder: true,
      migrationKind: "move-from-claude",
    };

    const result = await syncSelectedItems(
      fixture.claudeDir,
      [item],
      "fake-token",
      fixture.agentsDir,
    );

    expect(result.migrated).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.deleted).toBe(0);

    const movedContent = await fs.readFile(
      path.join(fixture.agentsDir, "skills/my-skill/SKILL.md"),
      "utf-8",
    );
    expect(movedContent).toBe("user-installed");

    const link = await fs.lstat(path.join(fixture.claudeDir, "skills/my-skill"));
    expect(link.isSymbolicLink()).toBe(true);
  });

  it("preserves an existing .agents/skills/<name> and ensures a symlink in .claude", async () => {
    const agentsSkillDir = path.join(fixture.agentsDir, "skills/my-skill");
    await fs.ensureDir(agentsSkillDir);
    await fs.writeFile(
      path.join(agentsSkillDir, "SKILL.md"),
      "preserved",
      "utf-8",
    );

    const item: SyncItem = {
      name: "my-skill",
      relativePath: "skills/my-skill",
      status: "migration",
      category: "skills",
      isFolder: true,
      migrationKind: "preserve-in-agents",
    };

    const result = await syncSelectedItems(
      fixture.claudeDir,
      [item],
      "fake-token",
      fixture.agentsDir,
    );

    expect(result.migrated).toBe(1);
    expect(result.failed).toBe(0);

    const stillThere = await fs.readFile(
      path.join(fixture.agentsDir, "skills/my-skill/SKILL.md"),
      "utf-8",
    );
    expect(stillThere).toBe("preserved");

    const link = await fs.lstat(path.join(fixture.claudeDir, "skills/my-skill"));
    expect(link.isSymbolicLink()).toBe(true);
  });

  it("does not delete user content when migration is selected (no fs.remove call)", async () => {
    const agentsSkillDir = path.join(fixture.agentsDir, "skills/user-skill");
    await fs.ensureDir(agentsSkillDir);
    await fs.writeFile(
      path.join(agentsSkillDir, "SKILL.md"),
      "user content",
      "utf-8",
    );

    const item: SyncItem = {
      name: "user-skill",
      relativePath: "skills/user-skill",
      status: "migration",
      category: "skills",
      isFolder: true,
      migrationKind: "preserve-in-agents",
    };

    await syncSelectedItems(
      fixture.claudeDir,
      [item],
      "fake-token",
      fixture.agentsDir,
    );

    expect(await fs.pathExists(path.join(fixture.agentsDir, "skills/user-skill"))).toBe(true);
  });

  it("skips move-from-claude migration when target already exists in .agents", async () => {
    await fs.ensureDir(path.join(fixture.claudeDir, "skills/conflict"));
    await fs.writeFile(
      path.join(fixture.claudeDir, "skills/conflict/SKILL.md"),
      "claude version",
      "utf-8",
    );
    await fs.ensureDir(path.join(fixture.agentsDir, "skills/conflict"));
    await fs.writeFile(
      path.join(fixture.agentsDir, "skills/conflict/SKILL.md"),
      "agents version",
      "utf-8",
    );

    const item: SyncItem = {
      name: "conflict",
      relativePath: "skills/conflict",
      status: "migration",
      category: "skills",
      isFolder: true,
      migrationKind: "move-from-claude",
    };

    const result = await syncSelectedItems(
      fixture.claudeDir,
      [item],
      "fake-token",
      fixture.agentsDir,
    );

    expect(result.migrated).toBe(0);
    expect(result.failed).toBe(1);

    const claudeContent = await fs.readFile(
      path.join(fixture.claudeDir, "skills/conflict/SKILL.md"),
      "utf-8",
    );
    expect(claudeContent).toBe("claude version");
    const agentsContent = await fs.readFile(
      path.join(fixture.agentsDir, "skills/conflict/SKILL.md"),
      "utf-8",
    );
    expect(agentsContent).toBe("agents version");
  });
});
