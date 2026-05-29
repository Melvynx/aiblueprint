import fs from "fs-extra";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { previewSessionsFromSnapshots, unifySessionsFromSnapshots } from "../src/lib/session-unifier";

describe("session unifier", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "aiblueprint-sessions-"));
  });

  afterEach(async () => {
    await fs.remove(rootDir);
  });

  it("imports sessions from saved configs and backups without overwriting current sessions", async () => {
    await fs.outputFile(path.join(rootDir, ".codex", "sessions", "current.jsonl"), "current");
    await fs.outputFile(path.join(rootDir, ".codex", "sessions", "same.jsonl"), "current same id");
    await fs.outputFile(path.join(rootDir, ".codex", "sessions", "duplicate.jsonl"), "already present");

    await fs.outputFile(path.join(rootDir, ".aiblueprint", "configs", "work", ".codex", "sessions", "saved.jsonl"), "saved codex");
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "configs", "work", ".codex", "sessions", "same.jsonl"), "saved different same id");
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "configs", "work", ".codex", "sessions", "duplicate.jsonl"), "already present");
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "backups", "auto", ".claude", "projects", "project", "session.jsonl"), "claude project");
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "backups", "auto", ".codex", "archived_sessions", "old.jsonl"), "archived codex");
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "backups", "auto", ".agents", "sessions", "agent.jsonl"), "agent session");

    const result = await unifySessionsFromSnapshots({ folder: rootDir });

    expect(await fs.readFile(path.join(rootDir, ".codex", "sessions", "saved.jsonl"), "utf-8")).toBe("saved codex");
    expect(await fs.readFile(path.join(rootDir, ".codex", "sessions", "same--config-work.jsonl"), "utf-8")).toBe("saved different same id");
    expect(await fs.readFile(path.join(rootDir, ".claude", "projects", "project", "session.jsonl"), "utf-8")).toBe("claude project");
    expect(await fs.readFile(path.join(rootDir, ".codex", "archived_sessions", "old.jsonl"), "utf-8")).toBe("archived codex");
    expect(await fs.readFile(path.join(rootDir, ".agents", "sessions", "agent.jsonl"), "utf-8")).toBe("agent session");

    expect(result.scannedSnapshots.map((snapshot) => snapshot.name).sort()).toEqual(["auto", "work"]);
    expect(result.imported).toHaveLength(4);
    expect(result.duplicates).toHaveLength(1);
    expect(result.conflicts).toHaveLength(1);
  });

  it("previews session imports without writing files", async () => {
    await fs.outputFile(path.join(rootDir, ".aiblueprint", "configs", "work", ".codex", "sessions", "saved.jsonl"), "saved codex");

    const result = await previewSessionsFromSnapshots({ folder: rootDir });

    expect(result.imported).toContainEqual(expect.objectContaining({
      from: path.join(rootDir, ".aiblueprint", "configs", "work", ".codex", "sessions", "saved.jsonl"),
      to: path.join(rootDir, ".codex", "sessions", "saved.jsonl"),
    }));
    expect(await fs.pathExists(path.join(rootDir, ".codex", "sessions", "saved.jsonl"))).toBe(false);
  });
});
