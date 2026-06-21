import fs from "fs-extra";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { symlinkCommand } from "../src/commands/symlink";
import {
  getToolPaths,
  createSymlink,
  type ToolType,
} from "../src/commands/setup/symlinks";

vi.mock("inquirer");
vi.mock("fs-extra");

const mockExit = vi.fn();
vi.stubGlobal("process", { ...process, exit: mockExit });

const consoleSpy = {
  log: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal("console", consoleSpy);

describe("getToolPaths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct paths for claude-code", async () => {
    const paths = await getToolPaths("claude-code");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".claude"));
    expect(paths.agentsPath).toBe(path.join(homeDir, ".claude", "agents"));
  });

  it("should return correct paths for codex", async () => {
    const paths = await getToolPaths("codex");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".codex"));
    expect(paths.agentsPath).toBe(path.join(homeDir, ".codex", "agents"));
  });

  it("should return correct paths for factoryai", async () => {
    const paths = await getToolPaths("factoryai");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".factory"));
    expect(paths.agentsPath).toBe(path.join(homeDir, ".factory", "droids"));
  });

  it("should use custom folder when provided", async () => {
    const customPath = "/custom/path";
    const paths = await getToolPaths("claude-code", customPath);

    const expectedBase = path.resolve(customPath);
    const expectedAgents = path.resolve(path.join(customPath, "agents"));

    expect(path.resolve(paths.baseDir)).toBe(expectedBase);
    expect(path.resolve(paths.agentsPath!)).toBe(expectedAgents);
  });

  it("should throw error for unknown tool type", async () => {
    await expect(getToolPaths("unknown" as ToolType)).rejects.toThrow(
      "Unknown tool type: unknown",
    );
  });
});

describe("createSymlink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create symlink when source exists and target does not", async () => {
    const sourcePath = "/source";
    const targetPath = "/target";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.symlink).mockResolvedValue();

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(true);
    expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(targetPath));
    expect(fs.symlink).toHaveBeenCalled();
  });

  it("should return false when source does not exist", async () => {
    const sourcePath = "/nonexistent";
    const targetPath = "/target";

    vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(false);
    expect(fs.symlink).not.toHaveBeenCalled();
  });

  it("should remove existing symlink and create new one", async () => {
    const sourcePath = "/source";
    const targetPath = "/target";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValueOnce({
      isSymbolicLink: () => true,
    } as any);
    vi.mocked(fs.remove).mockResolvedValue();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.symlink).mockResolvedValue();

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(true);
    expect(fs.remove).toHaveBeenCalledWith(targetPath);
    expect(fs.symlink).toHaveBeenCalled();
  });

  it("should skip when target exists and is not a symlink", async () => {
    const sourcePath = "/source";
    const targetPath = "/target";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValueOnce({
      isSymbolicLink: () => false,
    } as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(false);
    expect(fs.symlink).not.toHaveBeenCalled();
  });

  it("should use custom skip message when provided", async () => {
    const sourcePath = "/source";
    const targetPath = "/target";
    const customSkipMessage = "Custom skip message";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValueOnce({
      isSymbolicLink: () => false,
    } as any);

    await createSymlink(sourcePath, targetPath, {
      skipMessage: customSkipMessage,
    });

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining(customSkipMessage),
    );
  });

  it("should handle errors with custom error prefix", async () => {
    const sourcePath = "/source";
    const targetPath = "/target";
    const error = new Error("Symlink failed");

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);
    vi.mocked(fs.symlink).mockRejectedValue(error);

    await expect(
      createSymlink(sourcePath, targetPath, {
        errorPrefix: "Custom error:",
      }),
    ).rejects.toThrow(error);

    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("Custom error:"),
      error,
    );
  });
});

describe("symlinkCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExit.mockClear();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.symlink).mockResolvedValue();
  });

  it("should create agents symlink from Claude Code to FactoryAI", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ destinations: ["factoryai-agents"] });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand();

    expect(inquirer.prompt).toHaveBeenCalledTimes(2);
    expect(fs.symlink).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Symlink Manager"),
    );
  });

  it("should respect custom folder paths", async () => {
    const customClaudeFolder = "/custom/claude";
    const customCodexFolder = "/custom/codex";

    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ destinations: ["codex-agents"] });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand({
      claudeCodeFolder: customClaudeFolder,
      codexFolder: customCodexFolder,
    });

    expect(fs.symlink).toHaveBeenCalledWith(
      path.resolve(customClaudeFolder, "agents"),
      path.resolve(customCodexFolder, "agents"),
    );
  });

  it("should filter out source tool from destination choices", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ destinations: ["factoryai-agents"] });

    await symlinkCommand();

    const destinationPromptCall = vi.mocked(inquirer.prompt).mock.calls[1][0];
    const choices = (destinationPromptCall as any)[0].choices;

    const claudeChoice = choices.find(
      (c: any) => c.value === "claude-code-agents",
    );
    expect(claudeChoice).toBeUndefined();
  });

  it("should validate that at least one destination is selected", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ destinations: ["factoryai-agents"] });

    await symlinkCommand();

    const destinationPromptCall = vi.mocked(inquirer.prompt).mock.calls[1][0];
    const validateFn = (destinationPromptCall as any)[0].validate;

    expect(validateFn([])).toBe("Please select at least one destination");
    expect(validateFn(["factoryai-agents"])).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Test error");
    vi.mocked(inquirer.prompt).mockRejectedValue(error);

    await symlinkCommand();

    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("Symlink setup failed:"),
      error,
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

});
