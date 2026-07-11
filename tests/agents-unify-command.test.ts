import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentsUnifyCommand } from "../src/commands/agents-unify";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-agents-unify-command-test");

async function makeFixture(suffix: string) {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  await fs.ensureDir(root);
  return root;
}

describe("agentsUnifyCommand", () => {
  let root: string;
  let logSpy: any;

  beforeEach(async () => {
    root = await makeFixture("unify-command");
    process.env.AIBLUEPRINT_BACKUP_DIR = await makeFixture("unify-command-backups");
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    if (process.env.AIBLUEPRINT_BACKUP_DIR) {
      await fs.remove(process.env.AIBLUEPRINT_BACKUP_DIR).catch(() => {});
    }
    delete process.env.AIBLUEPRINT_BACKUP_DIR;
    await fs.remove(root).catch(() => {});
  });

  it("renders Codex TOML agents after centralizing shared Markdown agents", async () => {
    await fs.ensureDir(path.join(root, ".claude/agents"));
    await fs.writeFile(
      path.join(root, ".claude/agents/reviewer.md"),
      `---
name: reviewer
description: Review changed code
model: opus
---

Review the assigned code carefully.
`,
      "utf-8",
    );

    await agentsUnifyCommand({ folder: root });

    const sharedAgent = path.join(root, ".agents/agents/reviewer.md");
    const codexAgent = path.join(root, ".codex/agents/reviewer.toml");

    expect(await fs.pathExists(sharedAgent)).toBe(true);
    expect(await fs.pathExists(codexAgent)).toBe(true);

    const output = await fs.readFile(codexAgent, "utf-8");
    expect(output).toContain('name = "reviewer"');
    expect(output).toContain('description = "Review changed code"');
    expect(output).toContain('model = "gpt-5.6-terra"');
    expect(output).toContain('model_reasoning_effort = "high"');
    expect(output).toContain("Review the assigned code carefully.");
  });

  it("prints repository rule indexing when repository scope is used", async () => {
    await fs.ensureDir(path.join(root, ".claude/rules"));
    await fs.writeFile(path.join(root, ".claude/rules/testing.md"), "# Testing\n", "utf-8");

    await agentsUnifyCommand({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/testing.md"))).toBe(true);
    expect(await fs.pathExists(path.join(root, "AGENTS.md"))).toBe(true);
    expect(await fs.pathExists(path.join(root, ".agents/skills"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".agents/agents"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".codex"))).toBe(false);
    expect(logSpy.mock.calls.flat().join("\n")).toContain("rules index: 1 rules indexed");
  });

  it("does not render Codex agents when the agents category is not selected", async () => {
    await fs.ensureDir(path.join(root, ".claude/skills/alpha"));
    await fs.writeFile(path.join(root, ".claude/skills/alpha/SKILL.md"), "alpha skill", "utf-8");
    await fs.ensureDir(path.join(root, ".claude/agents"));
    await fs.writeFile(
      path.join(root, ".claude/agents/reviewer.md"),
      `---
name: reviewer
description: Review changed code
---

Review the assigned code carefully.
`,
      "utf-8",
    );

    await agentsUnifyCommand({ folder: root, categories: ["skills"] });

    expect(await fs.pathExists(path.join(root, ".agents/skills/alpha/SKILL.md"))).toBe(true);
    expect(await fs.pathExists(path.join(root, ".agents/agents/reviewer.md"))).toBe(false);
    expect(await fs.pathExists(path.join(root, ".codex/agents/reviewer.toml"))).toBe(false);
  });
});
