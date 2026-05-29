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
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
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
    expect(output).toContain('model = "gpt-5.5"');
    expect(output).toContain("Review the assigned code carefully.");
  });

  it("prints repository rule indexing when repository scope is used", async () => {
    await fs.ensureDir(path.join(root, ".claude/rules"));
    await fs.writeFile(path.join(root, ".claude/rules/testing.md"), "# Testing\n", "utf-8");

    await agentsUnifyCommand({ folder: root, scope: "repository" });

    expect(await fs.pathExists(path.join(root, ".agents/rules/testing.md"))).toBe(true);
    expect(await fs.pathExists(path.join(root, "AGENTS.md"))).toBe(true);
    expect(logSpy.mock.calls.flat().join("\n")).toContain("rules index: 1 rules indexed");
  });
});
