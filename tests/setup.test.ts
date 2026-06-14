import fs from "fs-extra";
import inquirer from "inquirer";
import * as clack from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupCommand } from "../src/commands/setup";
import { proSetupCommand } from "../src/commands/pro";
import { installProConfigs } from "../src/lib/pro-installer.js";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

// Mock dependencies
vi.mock("inquirer");
vi.mock("fs-extra");
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock("../src/lib/pro-installer.js", () => ({
  installProConfigs: vi.fn(),
}));
vi.mock("child_process", () => ({
  exec: vi.fn(),
  execSync: vi.fn(),
}));

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
  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock fs-extra methods
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.writeJson).mockResolvedValue();
    // @ts-expect-error Not important
    vi.mocked(fs.readFile).mockResolvedValue("{}");
    vi.mocked(fs.pathExists).mockImplementation((path: string) => {
      // Mock the source directory to exist
      if (path.includes("agents-config")) {
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    });
    vi.mocked(fs.copy).mockResolvedValue();
    vi.mocked(fs.remove).mockResolvedValue();
    vi.mocked(fs.lstat).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.stat).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.realpath).mockImplementation(async (path: any) => path);
    // @ts-expect-error Not important
    vi.mocked(fs.readdir).mockResolvedValue([]);

    // Mock exec for git clone
    const { exec } = await import("child_process");
    vi.mocked(exec).mockImplementation((cmd: any, callback: any) => {
      if (typeof callback === "function") {
        callback(null, { stdout: "", stderr: "" });
      }
      return {} as any;
    });

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
      expect.stringContaining("🚀 AIBlueprint AI Coding Setup"),
    );

    // Should show skip mode message
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("✓ Installing all features (--skip mode)"),
    );

    // Should create directories and complete the settings step
    expect(fs.ensureDir).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Settings updated"),
    );
  });

  it("should install scripts through an existing scripts directory symlink", async () => {
    const tempDir = "/tmp/test-claude";
    const linkedScriptsDir = "/tmp/linked-claude-scripts";

    vi.mocked(fs.lstat).mockImplementation(async (targetPath: any) => {
      if (targetPath === `${tempDir}/scripts`) {
        return { isSymbolicLink: () => true } as any;
      }
      throw new Error("not found");
    });
    vi.mocked(fs.stat).mockImplementation(async (targetPath: any) => {
      if (targetPath === `${tempDir}/scripts`) {
        return { isDirectory: () => true } as any;
      }
      throw new Error("not found");
    });
    vi.mocked(fs.realpath).mockImplementation(async (targetPath: any) => {
      if (targetPath === `${tempDir}/scripts`) {
        return linkedScriptsDir;
      }
      return targetPath;
    });

    await expect(
      setupCommand({
        claudeCodeFolder: tempDir,
        skipInteractive: true,
      }),
    ).resolves.not.toThrow();

    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining("/agents-config/claude-config/scripts"),
      linkedScriptsDir,
      { overwrite: true },
    );
    expect(fs.remove).not.toHaveBeenCalledWith(`${tempDir}/scripts`);
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

    // Should complete the settings step
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Settings updated"),
    );
  });
});

describe("Premium setup", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.writeJson).mockResolvedValue();
    // @ts-expect-error Not important
    vi.mocked(fs.readFile).mockResolvedValue("{}");
    // @ts-expect-error Not important
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.appendFile).mockResolvedValue();
    // @ts-expect-error Not important
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(installProConfigs).mockResolvedValue();
    vi.mocked(clack.text).mockResolvedValue("premium user token");

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            hasAccess: true,
            user: { name: "Melvyn", email: "melvyn@example.com" },
            product: {
              title: "AIBlueprint Premium",
              metadata: { "cli-github-token": "github-token" },
            },
          }),
      }),
    ) as any;

    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));

    mockExit.mockClear();
  });

  it("asks for a Premium token during setup when no token is saved", async () => {
    await expect(
      proSetupCommand({
        claudeCodeFolder: "/tmp/test-claude",
        codexFolder: "/tmp/test-codex",
        agentsFolder: "/tmp/test-agents",
      }),
    ).resolves.not.toThrow();

    expect(clack.text).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Enter your Premium access token:",
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("token=premium%20user%20token"),
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("token.txt"),
      "github-token",
      { mode: 0o600 },
    );
    expect(installProConfigs).toHaveBeenCalledWith(
      expect.objectContaining({
        githubToken: "github-token",
        claudeCodeFolder: "/tmp/test-claude",
        codexFolder: "/tmp/test-codex",
        agentsFolder: "/tmp/test-agents",
      }),
    );
    expect(clack.log.success).toHaveBeenCalledWith(
      "✅ Token activated. Continuing setup...",
    );
    expect(mockExit).not.toHaveBeenCalled();
  });
});
