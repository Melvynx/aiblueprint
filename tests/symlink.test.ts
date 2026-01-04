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
    expect(paths.commandsPath).toBe(path.join(homeDir, ".claude", "commands"));
    expect(paths.agentsPath).toBe(path.join(homeDir, ".claude", "agents"));
  });

  it("should return correct paths for codex", async () => {
    const paths = await getToolPaths("codex");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".codex"));
    expect(paths.commandsPath).toBe(path.join(homeDir, ".codex", "prompts"));
    expect(paths.agentsPath).toBeUndefined();
  });

  it("should return correct paths for opencode", async () => {
    const paths = await getToolPaths("opencode");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".config", "opencode"));
    expect(paths.commandsPath).toBe(
      path.join(homeDir, ".config", "opencode", "command"),
    );
    expect(paths.agentsPath).toBeUndefined();
  });

  it("should return correct paths for factoryai", async () => {
    const paths = await getToolPaths("factoryai");
    const homeDir = os.homedir();

    expect(paths.baseDir).toBe(path.join(homeDir, ".factory"));
    expect(paths.commandsPath).toBe(path.join(homeDir, ".factory", "commands"));
    expect(paths.agentsPath).toBe(path.join(homeDir, ".factory", "droids"));
  });

  it("should use custom folder when provided", async () => {
    const customPath = "/custom/path";
    const paths = await getToolPaths("claude-code", customPath);

    const expectedBase = path.resolve(customPath);
    const expectedCommands = path.resolve(path.join(customPath, "commands"));

    expect(path.resolve(paths.baseDir)).toBe(expectedBase);
    expect(path.resolve(paths.commandsPath!)).toBe(expectedCommands);
  });

  it("should throw error for unknown tool type", async () => {
    await expect(
      getToolPaths("unknown-tool" as ToolType),
    ).rejects.toThrow("Unknown tool type: unknown-tool");
  });
});

describe("createSymlink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.symlink).mockResolvedValue();
    vi.mocked(fs.remove).mockResolvedValue();
  });

  it("should create a symlink successfully when target does not exist", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(true);
    expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(targetPath));
    const isWindows = os.platform() === "win32";
    if (isWindows) {
      expect(fs.symlink).toHaveBeenCalledWith(sourcePath, targetPath, "junction");
    } else {
      expect(fs.symlink).toHaveBeenCalledWith(sourcePath, targetPath);
    }
  });

  it("should replace existing symlink", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValue({
      isSymbolicLink: () => true,
    } as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(true);
    expect(fs.remove).toHaveBeenCalledWith(targetPath);
    const isWindows = os.platform() === "win32";
    if (isWindows) {
      expect(fs.symlink).toHaveBeenCalledWith(sourcePath, targetPath, "junction");
    } else {
      expect(fs.symlink).toHaveBeenCalledWith(sourcePath, targetPath);
    }
  });

  it("should skip when target exists and is not a symlink", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValue({
      isSymbolicLink: () => false,
    } as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(false);
    expect(fs.symlink).not.toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("already exists and is not a symlink"),
    );
  });

  it("should use custom skip message", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);
    vi.mocked(fs.lstat).mockResolvedValue({
      isSymbolicLink: () => false,
    } as any);

    await createSymlink(sourcePath, targetPath, {
      skipMessage: "Custom skip message",
    });

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Custom skip message"),
    );
  });

  it("should skip when source does not exist", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";

    vi.mocked(fs.pathExists).mockResolvedValueOnce(false as any);

    const result = await createSymlink(sourcePath, targetPath);

    expect(result).toBe(false);
    expect(fs.symlink).not.toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("does not exist"),
    );
  });

  it("should throw error and log with custom prefix on failure", async () => {
    const sourcePath = "/source/path";
    const targetPath = "/target/path";
    const error = new Error("Symlink creation failed");

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

  it("should create symlink from Claude Code commands to Codex", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({ destinations: ["codex-commands"] });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand();

    expect(inquirer.prompt).toHaveBeenCalledTimes(3);
    expect(fs.symlink).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Symlink Manager"),
    );
  });

  it("should create symlink from Claude Code to multiple destinations", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({
        destinations: ["codex-commands", "opencode-commands"],
      });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand();

    expect(fs.symlink).toHaveBeenCalledTimes(2);
  });

  it("should handle both commands and agents for FactoryAI", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "both" })
      .mockResolvedValueOnce({
        destinations: ["factoryai-commands", "factoryai-agents"],
      });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand();

    expect(fs.symlink).toHaveBeenCalledTimes(2);
  });

  it("should respect custom folder paths", async () => {
    const customClaudeFolder = "/custom/claude";
    const customCodexFolder = "/custom/codex";

    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({ destinations: ["codex-commands"] });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand({
      claudeCodeFolder: customClaudeFolder,
      codexFolder: customCodexFolder,
    });

    expect(fs.symlink).toHaveBeenCalledWith(
      path.join(customClaudeFolder, "commands"),
      path.join(customCodexFolder, "prompts"),
    );
  });

  it("should show only agents option when source supports agents only", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "agents" })
      .mockResolvedValueOnce({ destinations: ["factoryai-agents"] });

    await symlinkCommand();

    const secondPromptCall = vi.mocked(inquirer.prompt).mock.calls[1][0];
    expect(secondPromptCall).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "contentType",
          choices: expect.arrayContaining([
            expect.objectContaining({ value: "agents" }),
          ]),
        }),
      ]),
    );
  });

  it("should filter out source tool from destination choices", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "codex" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({ destinations: ["claude-code-commands"] });

    await symlinkCommand();

    const thirdPromptCall = vi.mocked(inquirer.prompt).mock.calls[2][0];
    const choices = (thirdPromptCall as any)[0].choices;

    const codexChoice = choices.find((c: any) => c.value === "codex-commands");
    expect(codexChoice).toBeUndefined();
  });

  it("should validate that at least one destination is selected", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({ destinations: ["codex-commands"] });

    await symlinkCommand();

    const thirdPromptCall = vi.mocked(inquirer.prompt).mock.calls[2][0];
    const validateFn = (thirdPromptCall as any)[0].validate;

    expect(validateFn([])).toBe("Please select at least one destination");
    expect(validateFn(["codex-commands"])).toBe(true);
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

  it("should count successful and skipped symlinks", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "claude-code" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({
        destinations: ["codex-commands", "opencode-commands"],
      });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(true as any);

    vi.mocked(fs.lstat).mockResolvedValueOnce({
      isSymbolicLink: () => false,
    } as any);

    await symlinkCommand();

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("1 created, 1 skipped"),
    );
  });

  it("should exit when source tool has no syncable content", async () => {
    const mockTool = "codex";
    vi.mocked(inquirer.prompt).mockResolvedValueOnce({ source: mockTool });

    await symlinkCommand();

    const secondPromptCall = vi.mocked(inquirer.prompt).mock.calls[1];
    expect(secondPromptCall).toBeDefined();
  });

  it("should exit when no compatible destinations found", async () => {
    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ source: "codex" })
      .mockResolvedValueOnce({ contentType: "commands" })
      .mockResolvedValueOnce({ destinations: ["claude-code-commands"] });

    vi.mocked(fs.pathExists)
      .mockResolvedValueOnce(true as any)
      .mockResolvedValueOnce(false as any);

    await symlinkCommand();

    expect(fs.symlink).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Symlink setup complete!"),
    );
  });
});
