import fs from "fs-extra";
import inquirer from "inquirer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupCommand } from "../src/commands/setup";

// Mock dependencies
vi.mock("inquirer");
vi.mock("fs-extra");
vi.mock("child_process");

// Mock process.exit to prevent test termination
const mockExit = vi.fn();
vi.stubGlobal("process", { ...process, exit: mockExit });

// Mock console methods to capture output
const consoleSpy = {
  log: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal("console", consoleSpy);

// Mock fetch for GitHub API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  }),
) as any;

describe("Setup Command with Inquirer.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fs-extra methods
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.writeJson).mockResolvedValue();
    // @ts-expect-error Not important
    vi.mocked(fs.readFile).mockResolvedValue("{}");
    // @ts-expect-error Not important
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.copy).mockResolvedValue();

    // Clear process.exit mock
    mockExit.mockClear();
  });

  it("should run setup with --skip flag successfully", async () => {
    const tempDir = "/tmp/test-claude";

    // Should not throw any errors
    await expect(
      setupCommand({
        claudeCodeFolder: tempDir,
        skipInteractive: true,
      }),
    ).resolves.not.toThrow();

    // Should not call inquirer.prompt when skipping
    expect(inquirer.prompt).not.toHaveBeenCalled();

    // Should show setup intro
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("🚀 AIBlueprint Claude Code Setup"),
    );

    // Should show skip mode message
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("✓ Installing all features (--skip mode)"),
    );

    // Should create directories and files
    expect(fs.ensureDir).toHaveBeenCalled();
    expect(fs.writeJson).toHaveBeenCalled();
  });

  it("should run interactive setup with inquirer prompts", async () => {
    const tempDir = "/tmp/test-claude";

    // Mock inquirer prompt to return selected features
    vi.mocked(inquirer.prompt).mockResolvedValue({
      features: ["shellShortcuts", "customStatusline"],
    });

    // Should not throw any errors
    await expect(
      setupCommand({
        claudeCodeFolder: tempDir,
        skipInteractive: false,
      }),
    ).resolves.not.toThrow();

    // Should call inquirer.prompt for feature selection
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "checkbox",
        name: "features",
        message: "Which features would you like to install?",
        choices: expect.arrayContaining([
          expect.objectContaining({
            value: "shellShortcuts",
            checked: true,
          }),
        ]),
      },
    ]);

    // Should create files
    expect(fs.writeJson).toHaveBeenCalled();
  });
});
