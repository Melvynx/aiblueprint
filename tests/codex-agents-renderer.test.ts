import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderCodexAgentsFromMarkdown } from "../src/lib/codex-agents-renderer";

const TMP_ROOT = path.join(os.tmpdir(), "aiblueprint-codex-agents-renderer-test");

async function makeFixture(suffix: string) {
  const root = path.join(TMP_ROOT, `${Date.now()}-${suffix}`);
  await fs.ensureDir(root);
  return root;
}

async function writeSharedAgent(root: string, name: string, content: string) {
  const agentsDir = path.join(root, ".agents/agents");
  await fs.ensureDir(agentsDir);
  await fs.writeFile(path.join(agentsDir, name), content, "utf-8");
}

describe("renderCodexAgentsFromMarkdown", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeFixture("render");
  });

  afterEach(async () => {
    await fs.remove(root).catch(() => {});
  });

  it("renders Markdown agents into Codex TOML custom agents", async () => {
    await writeSharedAgent(root, "snipper.md", `---
name: Snipper
description: Fast code modification agent
color: blue
model: haiku
---

You are fast.
`);

    const result = await renderCodexAgentsFromMarkdown({ folder: root });

    expect(result.rendered).toHaveLength(1);

    const output = await fs.readFile(path.join(root, ".codex/agents/snipper.toml"), "utf-8");
    expect(output).toContain('name = "snipper"');
    expect(output).toContain('description = "Fast code modification agent"');
    expect(output).toContain('model = "gpt-5.4-mini"');
    expect(output).toContain("developer_instructions = '''");
    expect(output).toContain("Original display color metadata: blue.");
    expect(output).toContain("You are fast.");
  });

  it("replaces an old Codex agents symlink with a real directory", async () => {
    await writeSharedAgent(root, "helper.md", `---
name: helper
description: Helper agent
---

Help with bounded tasks.
`);

    await fs.ensureDir(path.join(root, ".codex"));
    await fs.symlink(path.join(root, ".agents/agents"), path.join(root, ".codex/agents"), "dir");

    await renderCodexAgentsFromMarkdown({ folder: root });

    const stat = await fs.lstat(path.join(root, ".codex/agents"));
    expect(stat.isSymbolicLink()).toBe(false);
    expect(await fs.pathExists(path.join(root, ".codex/agents/helper.toml"))).toBe(true);
  });

  it("keeps existing user-authored Codex agents unless overwrite is requested", async () => {
    await writeSharedAgent(root, "reviewer.md", `---
name: reviewer
description: Reviewer agent
model: opus
---

Review carefully.
`);
    await fs.ensureDir(path.join(root, ".codex/agents"));
    await fs.writeFile(
      path.join(root, ".codex/agents/reviewer.toml"),
      'name = "reviewer"\ndescription = "User file"\ndeveloper_instructions = "Keep me"\n',
      "utf-8",
    );

    const result = await renderCodexAgentsFromMarkdown({ folder: root });

    expect(result.rendered).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(await fs.readFile(path.join(root, ".codex/agents/reviewer.toml"), "utf-8")).toContain("Keep me");

    const overwriteResult = await renderCodexAgentsFromMarkdown({
      folder: root,
      overwrite: true,
    });

    expect(overwriteResult.rendered).toHaveLength(1);
    expect(await fs.readFile(path.join(root, ".codex/agents/reviewer.toml"), "utf-8")).toContain('model = "gpt-5.5"');
  });
});
