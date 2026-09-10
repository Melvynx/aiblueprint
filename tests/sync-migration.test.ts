import fs from "fs-extra";
import { execFileSync } from "node:child_process";
import { stripVTControlCharacters } from "node:util";
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

  it("does not touch user content in .agents that is not in remote", async () => {
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
      migrationKind: "move-from-claude",
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


describe("syncSelectedItems – statusline scripts", () => {
  let fixture: Awaited<ReturnType<typeof makeFixture>>;

  beforeEach(async () => {
    fixture = await makeFixture("statusline");
  });

  afterEach(async () => {
    await fs.remove(fixture.root);
    vi.restoreAllMocks();
  });

  it.each(["agents-config/claude-config/scripts", "agents-config/scripts"])(
    "copies executable scripts and renders the payload context limit from %s",
    async (scriptsRoot) => {
      const sourceDir = path.resolve(scriptsRoot, "statusline");
      // Optional network and spend integrations are omitted from this isolated install.
      const files = [
        "defaults.json",
        "src/index.ts",
        "src/lib/features/spend/payload-logger.ts",
        ...(await fs.readdir(path.join(sourceDir, "src/lib")))
          .filter((name) => name.endsWith(".ts"))
          .map((name) => `src/lib/${name}`),
      ];
      const sources = new Map<string, string>();
      for (const file of files) {
        sources.set(file, await fs.readFile(path.join(sourceDir, file), "utf-8"));
      }
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        const url = String(input);
        if (url.startsWith("https://api.github.com/")) {
          return new Response("[]");
        }
        const file = url.split("/statusline/")[1];
        const source = sources.get(file);
        return new Response(source ?? "Not found", { status: source === undefined ? 404 : 200 });
      });
      const items: SyncItem[] = files.map((file) => ({
        name: file,
        relativePath: `scripts/statusline/${file}`,
        status: "modified",
        category: "scripts",
      }));
      const result = await syncSelectedItems(fixture.claudeDir, items, "fake-token", fixture.agentsDir);
      expect(result).toEqual({ success: files.length, failed: 0, deleted: 0, migrated: 0 });

      const installedDir = path.join(fixture.claudeDir, "scripts/statusline");
      for (const [file, source] of sources) {
        expect(await fs.readFile(path.join(installedDir, file), "utf-8")).toBe(source);
      }
      await fs.ensureDir(path.join(installedDir, "data"));
      await fs.writeJson(path.join(installedDir, "statusline.config.json"), {
        session: { tokens: { showMax: true, showDecimals: true } },
      });
      const payload = await fs.readJson(path.join(sourceDir, "fixtures/test-input.json"));
      payload.model.display_name = "Opus (1M context)";
      payload.workspace.current_dir = fixture.root;
      const env = { ...process.env, HOME: fixture.root, NO_COLOR: "1", STATUSLINE_DEBUG: "1" };
      const options = { cwd: fixture.root, env, encoding: "utf-8" as const, timeout: 10000 };

      for (const [size, expectedMax, expectedPercentage] of [
        [1000000, "1.0m", "6%"],
        [200000, "200.0k", "31%"],
        [0, "200.0k", "31%"],
        [undefined, "200.0k", "31%"],
      ] as const) {
        payload.context_window.context_window_size = size;
        const output = stripVTControlCharacters(execFileSync("bun", [path.join(installedDir, "src/index.ts")], {
          ...options,
          input: JSON.stringify(payload),
        }));
        expect(output).not.toContain("Error:");
        expect(output).toContain("Opus 1M");
        expect(output).toContain(`62.5k/${expectedMax}`);
        expect(output).toContain(expectedPercentage);
      }

      execFileSync("bun", ["-e", `
        const { appendPayloadLog } = await import(process.argv[1]);
        const payload = await Bun.stdin.json();
        appendPayloadLog(payload);
        appendPayloadLog(payload);
      `, path.join(installedDir, "src/lib/features/spend/payload-logger.ts")], {
        ...options,
        input: JSON.stringify(payload),
      });
      const jsonl = await fs.readFile(path.join(installedDir, "data/payloads.jsonl"), "utf-8");
      const lines = jsonl.trimEnd().split("\n");
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        expect(JSON.parse(line).session_id).toBe(payload.session_id);
      }
    },
  );
});
