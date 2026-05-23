import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createConfigBackup,
  listConfigBackups,
  loadNamedConfig,
  saveNamedConfig,
  undoLastLoad,
} from "../src/lib/configs-store";

describe("configs store", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-configs-"));
    await fs.outputFile(path.join(rootDir, ".claude", "settings.json"), '{"theme":"one"}');
    await fs.outputFile(path.join(rootDir, ".codex", "config.toml"), 'model = "one"');
    await fs.outputFile(path.join(rootDir, ".agents", "skills", "demo", "SKILL.md"), "one");
  });

  afterEach(async () => {
    await fs.remove(rootDir);
  });

  it("saves the three managed folders as a named config", async () => {
    const snapshotPath = await saveNamedConfig("work-main", { folder: rootDir });

    expect(await fs.readFile(path.join(snapshotPath, ".claude", "settings.json"), "utf-8")).toBe('{"theme":"one"}');
    expect(await fs.readFile(path.join(snapshotPath, ".codex", "config.toml"), "utf-8")).toBe('model = "one"');
    expect(await fs.readFile(path.join(snapshotPath, ".agents", "skills", "demo", "SKILL.md"), "utf-8")).toBe("one");
  });

  it("loads a named config and backs up the previous folders", async () => {
    await saveNamedConfig("work-main", { folder: rootDir });
    await fs.outputFile(path.join(rootDir, ".codex", "config.toml"), 'model = "two"');

    const result = await loadNamedConfig("work-main", { folder: rootDir });

    expect(result.backupPath).toBeTruthy();
    expect(await fs.readFile(path.join(rootDir, ".codex", "config.toml"), "utf-8")).toBe('model = "one"');
    expect(await fs.readFile(path.join(result.backupPath!, ".codex", "config.toml"), "utf-8")).toBe('model = "two"');
  });

  it("undo restores the automatic backup from the last load", async () => {
    await saveNamedConfig("work-main", { folder: rootDir });
    await fs.outputFile(path.join(rootDir, ".codex", "config.toml"), 'model = "two"');
    await loadNamedConfig("work-main", { folder: rootDir });

    const result = await undoLastLoad({ folder: rootDir });

    expect(result.backupName).toContain("work-main");
    expect(await fs.readFile(path.join(rootDir, ".codex", "config.toml"), "utf-8")).toBe('model = "two"');
  });

  it("stores backup metadata with the reason", async () => {
    await createConfigBackup({ folder: rootDir }, "Before test replacement", "test", "fixture");

    const backups = await listConfigBackups({ folder: rootDir });

    expect(backups[0].metadata.reason).toBe("Before test replacement");
    expect(backups[0].metadata.trigger).toBe("test");
    expect(backups[0].metadata.folders).toEqual([".claude", ".codex", ".agents"]);
  });
});
