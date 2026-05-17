import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyAgentCategory } from "../src/lib/pro-installer";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-pro-installer-test");

interface Fixture {
  root: string;
  sourceCategoryDir: string;
  agentsDir: string;
  claudeDir: string;
}

async function makeFixture(suffix: string): Promise<Fixture> {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  const sourceCategoryDir = path.join(root, "source", "agents");
  const agentsDir = path.join(root, "agents");
  const claudeDir = path.join(root, "claude");
  await fs.ensureDir(sourceCategoryDir);
  await fs.ensureDir(agentsDir);
  await fs.ensureDir(claudeDir);
  return { root, sourceCategoryDir, agentsDir, claudeDir };
}

describe("copyAgentCategory", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await makeFixture("copy");
  });

  afterEach(async () => {
    await fs.remove(fixture.root).catch(() => {});
  });

  it("copies a flat .md agent file without trying to scandir it (regression: ENOTDIR)", async () => {
    // Reproduces the exact scenario that crashed v1.4.55:
    // source agents-config/agents/code-architect.md is a FILE (not a dir),
    // so the post-copy placeholder pass must not call readdir on it.
    const sourceFile = path.join(fixture.sourceCategoryDir, "code-architect.md");
    await fs.writeFile(
      sourceFile,
      "agent body referencing {CLAUDE_PATH}/song/finish.mp3",
      "utf-8",
    );

    await expect(
      copyAgentCategory(
        fixture.sourceCategoryDir,
        "agents",
        fixture.agentsDir,
        fixture.claudeDir,
      ),
    ).resolves.not.toThrow();

    const dst = path.join(fixture.agentsDir, "agents", "code-architect.md");
    expect(await fs.pathExists(dst)).toBe(true);

    const content = await fs.readFile(dst, "utf-8");
    expect(content).toBe(
      `agent body referencing ${fixture.claudeDir}/song/finish.mp3`,
    );
  });

  it("still handles directory-shaped entries (legacy skill layout)", async () => {
    const skillDir = path.join(fixture.sourceCategoryDir, "alpha");
    await fs.ensureDir(skillDir);
    await fs.writeFile(
      path.join(skillDir, "SKILL.md"),
      "skill body with {CLAUDE_PATH}",
      "utf-8",
    );

    await copyAgentCategory(
      fixture.sourceCategoryDir,
      "agents",
      fixture.agentsDir,
      fixture.claudeDir,
    );

    const dst = path.join(fixture.agentsDir, "agents", "alpha", "SKILL.md");
    expect(await fs.pathExists(dst)).toBe(true);
    const content = await fs.readFile(dst, "utf-8");
    expect(content).toBe(`skill body with ${fixture.claudeDir}`);
  });

  it("skips entries when claudeDir already has a real (non-symlink) entry at that path", async () => {
    await fs.writeFile(
      path.join(fixture.sourceCategoryDir, "code-architect.md"),
      "from source",
      "utf-8",
    );
    const claudeCategoryDir = path.join(fixture.claudeDir, "agents");
    await fs.ensureDir(claudeCategoryDir);
    await fs.writeFile(
      path.join(claudeCategoryDir, "code-architect.md"),
      "user-edited",
      "utf-8",
    );

    const progress: { file: string; type: "file" | "directory" }[] = [];
    await copyAgentCategory(
      fixture.sourceCategoryDir,
      "agents",
      fixture.agentsDir,
      fixture.claudeDir,
      (file, type) => progress.push({ file, type }),
    );

    // The .agents target should NOT have been created.
    expect(
      await fs.pathExists(
        path.join(fixture.agentsDir, "agents", "code-architect.md"),
      ),
    ).toBe(false);

    expect(progress).toHaveLength(1);
    expect(progress[0].file).toContain("skipped");
  });
});
