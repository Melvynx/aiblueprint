import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBackup, createTimestampedBackupName, listBackups, loadBackup } from "../src/lib/backup-utils";

describe("backup utils", () => {
  let rootDir: string;
  let restoreDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-backup-"));
    restoreDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-backup-restore-"));
    process.env.AIBLUEPRINT_BACKUP_DIR = path.join(rootDir, "backups");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    delete process.env.AIBLUEPRINT_BACKUP_DIR;
    await fs.remove(rootDir);
    await fs.remove(restoreDir);
  });

  it("backs up and restores complete Claude, Codex, and agents folders", async () => {
    const claudeDir = path.join(rootDir, ".claude");
    const codexDir = path.join(rootDir, ".codex");
    const agentsDir = path.join(rootDir, ".agents");

    await fs.outputFile(path.join(claudeDir, "projects", "project.jsonl"), "claude session");
    await fs.outputFile(path.join(codexDir, "sessions", "session.jsonl"), "codex session");
    await fs.outputFile(path.join(codexDir, "logs_2.sqlite"), "sqlite");
    await fs.outputFile(path.join(agentsDir, "sessions", "agent-session.jsonl"), "agent session");

    const backupPath = await createBackup(claudeDir, codexDir, agentsDir);

    expect(backupPath).toBeTruthy();
    expect(await fs.readFile(path.join(backupPath!, ".claude", "projects", "project.jsonl"), "utf-8")).toBe("claude session");
    expect(await fs.readFile(path.join(backupPath!, ".codex", "sessions", "session.jsonl"), "utf-8")).toBe("codex session");
    expect(await fs.readFile(path.join(backupPath!, ".codex", "logs_2.sqlite"), "utf-8")).toBe("sqlite");
    expect(await fs.readFile(path.join(backupPath!, ".agents", "sessions", "agent-session.jsonl"), "utf-8")).toBe("agent session");

    await loadBackup(
      backupPath!,
      path.join(restoreDir, ".claude"),
      path.join(restoreDir, ".codex"),
      path.join(restoreDir, ".agents"),
    );

    expect(await fs.readFile(path.join(restoreDir, ".claude", "projects", "project.jsonl"), "utf-8")).toBe("claude session");
    expect(await fs.readFile(path.join(restoreDir, ".codex", "sessions", "session.jsonl"), "utf-8")).toBe("codex session");
    expect(await fs.readFile(path.join(restoreDir, ".agents", "sessions", "agent-session.jsonl"), "utf-8")).toBe("agent session");
  });

  it("dereferences symlinks in legacy backups on Windows", async () => {
    vi.spyOn(os, "platform").mockReturnValue("win32");
    const claudeDir = path.join(rootDir, ".claude");
    const agentsDir = path.join(rootDir, ".agents");
    const skillSource = path.join(agentsDir, "skills", "demo");
    const skillLink = path.join(claudeDir, "skills", "demo");

    await fs.outputFile(path.join(skillSource, "SKILL.md"), "linked skill");
    await fs.ensureDir(path.dirname(skillLink));
    await fs.symlink(skillSource, skillLink, "dir");

    const backupPath = await createBackup(claudeDir, undefined, agentsDir);
    const backedUpSkill = path.join(backupPath!, ".claude", "skills", "demo");

    expect((await fs.lstat(backedUpSkill)).isSymbolicLink()).toBe(false);
    expect(await fs.readFile(path.join(backedUpSkill, "SKILL.md"), "utf-8")).toBe("linked skill");
  });

  it("lists project-suffixed backup folders by their timestamp prefix", async () => {
    const name = createTimestampedBackupName("/Users/melvynx/Documents/TestCodex", new Date(2026, 4, 29, 10, 30, 0));
    await fs.ensureDir(path.join(process.env.AIBLUEPRINT_BACKUP_DIR!, name));

    const backups = await listBackups();

    expect(backups[0].name).toBe(name);
    expect(name).toContain("Users--melvynx--Documents--TestCodex");
  });
});
