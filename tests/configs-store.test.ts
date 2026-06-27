import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanConfigBackups,
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
    vi.restoreAllMocks();
    await fs.remove(rootDir);
  });

  async function writeBackupFixture(
    name: string,
    createdAt: string | null,
    trigger = "setup",
  ): Promise<string> {
    const backupPath = path.join(rootDir, ".aiblueprint", "backups", name);

    if (!createdAt) {
      await fs.ensureDir(backupPath);
      return backupPath;
    }

    await fs.outputJson(path.join(backupPath, "metadata.json"), {
      name,
      type: "backup",
      createdAt,
      reason: `${name} backup`,
      trigger,
      folders: [".claude"],
    });

    return backupPath;
  }

  it("saves the three managed folders as a named config", async () => {
    const snapshotPath = await saveNamedConfig("work-main", { folder: rootDir });

    expect(await fs.readFile(path.join(snapshotPath, ".claude", "settings.json"), "utf-8")).toBe('{"theme":"one"}');
    expect(await fs.readFile(path.join(snapshotPath, ".codex", "config.toml"), "utf-8")).toBe('model = "one"');
    expect(await fs.readFile(path.join(snapshotPath, ".agents", "skills", "demo", "SKILL.md"), "utf-8")).toBe("one");
  });

  it("saves runtime sessions, caches, logs, package folders, and git data", async () => {
    await fs.outputFile(path.join(rootDir, ".codex", "sessions", "session.jsonl"), "large session");
    await fs.outputFile(path.join(rootDir, ".codex", "plugins", "cache", "plugin.bin"), "cache");
    await fs.outputFile(path.join(rootDir, ".codex", "log", "codex-tui.log"), "log");
    await fs.outputFile(path.join(rootDir, ".claude", "projects", "project.jsonl"), "project history");
    await fs.outputFile(path.join(rootDir, ".claude", "file-history", "history.json"), "history");
    await fs.outputFile(path.join(rootDir, ".claude", "hooks", "node_modules", "pkg", "index.js"), "dependency");
    await fs.outputFile(path.join(rootDir, ".agents", ".git", "config"), "git");

    const snapshotPath = await saveNamedConfig("work-main", { folder: rootDir });

    expect(await fs.pathExists(path.join(snapshotPath, ".codex", "sessions", "session.jsonl"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".codex", "plugins", "cache", "plugin.bin"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".codex", "log", "codex-tui.log"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".claude", "projects", "project.jsonl"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".claude", "file-history", "history.json"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".claude", "hooks", "node_modules", "pkg", "index.js"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".agents", ".git", "config"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".codex", "config.toml"))).toBe(true);
    expect(await fs.pathExists(path.join(snapshotPath, ".agents", "skills", "demo", "SKILL.md"))).toBe(true);
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

  it("dereferences symlinks in config backups on Windows", async () => {
    vi.spyOn(os, "platform").mockReturnValue("win32");

    const pluginSource = path.join(
      rootDir,
      ".codex",
      ".tmp",
      "bundled-marketplaces",
      "openai-bundled",
      "plugins",
      "chrome",
    );
    const pluginLink = path.join(
      rootDir,
      ".codex",
      "plugins",
      "cache",
      "openai-bundled",
      "chrome",
      "latest",
    );
    await fs.outputFile(path.join(pluginSource, "manifest.json"), '{"name":"chrome"}');
    await fs.ensureDir(path.dirname(pluginLink));
    await fs.symlink(pluginSource, pluginLink, "dir");

    const backupPath = await createConfigBackup(
      { folder: rootDir },
      "Before Windows setup",
      "setup",
      "windows-fixture",
    );

    const backedUpPlugin = path.join(
      backupPath!,
      ".codex",
      "plugins",
      "cache",
      "openai-bundled",
      "chrome",
      "latest",
    );
    expect((await fs.lstat(backedUpPlugin)).isSymbolicLink()).toBe(false);
    expect(await fs.readFile(path.join(backedUpPlugin, "manifest.json"), "utf-8")).toBe('{"name":"chrome"}');
  });

  it("deletes backups older than the retention window", async () => {
    const oldBackupPath = await writeBackupFixture("old-backup", "2026-05-01T00:00:00.000Z");
    const recentBackupPath = await writeBackupFixture("recent-backup", "2026-05-20T00:00:00.000Z");

    const result = await cleanConfigBackups({
      folder: rootDir,
      days: 30,
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(result.deleted.map((backup) => backup.name)).toEqual(["old-backup"]);
    expect(result.kept.map((backup) => backup.name)).toEqual(["recent-backup"]);
    expect(await fs.pathExists(oldBackupPath)).toBe(false);
    expect(await fs.pathExists(recentBackupPath)).toBe(true);
  });

  it("keeps old backups during dry run cleanup", async () => {
    const oldBackupPath = await writeBackupFixture("old-backup", "2026-05-01T00:00:00.000Z");

    const result = await cleanConfigBackups({
      folder: rootDir,
      days: 30,
      dryRun: true,
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(result.deleted.map((backup) => backup.name)).toEqual(["old-backup"]);
    expect(await fs.pathExists(oldBackupPath)).toBe(true);
  });

  it("keeps old manual backups unless explicitly included", async () => {
    const manualBackupPath = await writeBackupFixture(
      "manual-backup",
      "2026-05-01T00:00:00.000Z",
      "manual-backup",
    );

    const result = await cleanConfigBackups({
      folder: rootDir,
      days: 30,
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(result.deleted).toEqual([]);
    expect(result.skipped.map((entry) => entry.snapshot.name)).toEqual(["manual-backup"]);
    expect(await fs.pathExists(manualBackupPath)).toBe(true);
  });

  it("deletes old manual backups when explicitly included", async () => {
    const manualBackupPath = await writeBackupFixture(
      "manual-backup",
      "2026-05-01T00:00:00.000Z",
      "manual-backup",
    );

    const result = await cleanConfigBackups({
      folder: rootDir,
      days: 30,
      includeManual: true,
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(result.deleted.map((backup) => backup.name)).toEqual(["manual-backup"]);
    expect(await fs.pathExists(manualBackupPath)).toBe(false);
  });

  it("skips legacy backups without metadata", async () => {
    const legacyBackupPath = await writeBackupFixture("2026-05-01-00-00-00-legacy", null);

    const result = await cleanConfigBackups({
      folder: rootDir,
      days: 30,
      now: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(result.deleted).toEqual([]);
    expect(result.skipped.map((entry) => entry.snapshot.name)).toEqual(["2026-05-01-00-00-00-legacy"]);
    expect(await fs.pathExists(legacyBackupPath)).toBe(true);
  });

  it("rejects cleanup when the backups directory is a symlink", async () => {
    const backupsDir = path.join(rootDir, ".aiblueprint", "backups");
    const outsideDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-outside-backups-"));

    await fs.ensureDir(path.dirname(backupsDir));
    await fs.symlink(outsideDir, backupsDir, "dir");

    await expect(cleanConfigBackups({ folder: rootDir })).rejects.toThrow("Backup directory cannot be a symlink.");
    expect(await fs.pathExists(outsideDir)).toBe(true);

    await fs.remove(outsideDir);
  });
});
