import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { updateSettings, type SetupOptions } from "../src/commands/setup/settings";

const baseOptions: SetupOptions = {
  shellShortcuts: false,
  customStatusline: false,
  aiblueprintAgents: false,
  aiblueprintSkills: false,
  installCodex: false,
};

describe("updateSettings with mods", () => {
  let claudeDir: string;

  beforeEach(async () => {
    claudeDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-mods-"));
  });

  afterEach(async () => {
    await fs.remove(claudeDir);
  });

  const readEnv = async () => (await fs.readJson(path.join(claudeDir, "settings.json"))).env;

  it("enables function hooks and lists each installed mod", async () => {
    await updateSettings({ ...baseOptions, installedMods: ["agent4everything", "skills-sync"] }, claudeDir);

    const env = await readEnv();
    expect(env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS).toBe("1");
    expect(env.CLAUDE_CODE_PLUGIN_DIRS.split(path.delimiter)).toEqual([
      path.join(claudeDir, "mods", "agent4everything"),
      path.join(claudeDir, "mods", "skills-sync"),
    ]);
  });

  it("keeps existing plugin dirs and does not duplicate mods", async () => {
    const custom = path.join(claudeDir, "my-mod");
    const existing = path.join(claudeDir, "mods", "skills-sync");
    await fs.writeJson(path.join(claudeDir, "settings.json"), {
      env: { CLAUDE_CODE_PLUGIN_DIRS: [custom, existing].join(path.delimiter) },
    });

    await updateSettings({ ...baseOptions, installedMods: ["skills-sync", "agent4everything"] }, claudeDir);

    const env = await readEnv();
    expect(env.CLAUDE_CODE_PLUGIN_DIRS.split(path.delimiter)).toEqual([
      custom,
      existing,
      path.join(claudeDir, "mods", "agent4everything"),
    ]);
  });

  it("leaves plugin settings untouched when no mod is installed", async () => {
    await updateSettings(baseOptions, claudeDir);

    const env = await readEnv();
    expect(env.CLAUDE_CODE_PLUGIN_DIRS).toBeUndefined();
    expect(env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS).toBeUndefined();
  });
});
