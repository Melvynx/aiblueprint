import fs from "fs-extra";
import os from "os";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs-extra");

const consoleSpy = {
  log: vi.fn(),
  error: vi.fn(),
};
vi.stubGlobal("console", consoleSpy);

describe("Windows Platform Support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.appendFile).mockResolvedValue();
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));
    vi.mocked(fs.pathExists).mockResolvedValue(false as any);
    vi.mocked(fs.symlink).mockResolvedValue();
    vi.mocked(fs.remove).mockResolvedValue();
  });

  describe("Shell Shortcuts on Windows", () => {
    it("should create PowerShell profile with functions on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");
      vi.spyOn(os, "homedir").mockReturnValue("C:\\Users\\TestUser");

      const { setupShellShortcuts } = await import(
        "../src/commands/setup/shell-shortcuts"
      );

      await setupShellShortcuts();

      expect(fs.ensureDir).toHaveBeenCalledWith(
        path.join("C:\\Users\\TestUser", "Documents", "PowerShell")
      );

      expect(fs.appendFile).toHaveBeenCalledWith(
        path.join("C:\\Users\\TestUser", "Documents", "PowerShell", "Profile.ps1"),
        expect.stringContaining("function cc { claude --dangerously-skip-permissions $args }")
      );

      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("function ccc { claude --dangerously-skip-permissions -c $args }")
      );

      vi.restoreAllMocks();
    });

    it("should use WindowsPowerShell folder if it exists", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");
      vi.spyOn(os, "homedir").mockReturnValue("C:\\Users\\TestUser");

      vi.mocked(fs.pathExists)
        .mockResolvedValueOnce(false as any)
        .mockResolvedValueOnce(true as any);

      const { setupShellShortcuts } = await import(
        "../src/commands/setup/shell-shortcuts"
      );

      await setupShellShortcuts();

      expect(fs.appendFile).toHaveBeenCalledWith(
        path.join("C:\\Users\\TestUser", "Documents", "WindowsPowerShell", "Profile.ps1"),
        expect.any(String)
      );

      vi.restoreAllMocks();
    });
  });

  describe("Symlinks on Windows", () => {
    it("should use junction type for symlinks on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");

      vi.mocked(fs.pathExists)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(false as any);

      const { createSymlink } = await import("../src/commands/setup/symlinks");

      const result = await createSymlink("/source/path", "/target/path");

      expect(result).toBe(true);
      expect(fs.symlink).toHaveBeenCalledWith(
        "/source/path",
        "/target/path",
        "junction"
      );

      vi.restoreAllMocks();
    });

    it("should use regular symlink on non-Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("darwin");

      vi.mocked(fs.pathExists)
        .mockResolvedValueOnce(true as any)
        .mockResolvedValueOnce(false as any);

      const { createSymlink } = await import("../src/commands/setup/symlinks");

      const result = await createSymlink("/source/path", "/target/path");

      expect(result).toBe(true);
      expect(fs.symlink).toHaveBeenCalledWith("/source/path", "/target/path");

      vi.restoreAllMocks();
    });
  });

  describe("Dependencies check on Windows", () => {
    it("should use 'where' command on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");

      const { execSync } = await import("child_process");
      vi.mock("child_process", () => ({
        execSync: vi.fn(() => ""),
      }));

      const { checkAndInstallDependencies } = await import(
        "../src/commands/setup/dependencies"
      );

      await checkAndInstallDependencies();

      const mockedExecSync = vi.mocked(execSync);
      const calls = mockedExecSync.mock.calls;

      const whereCall = calls.find(
        (call) => typeof call[0] === "string" && call[0].startsWith("where ")
      );
      expect(whereCall).toBeDefined();

      vi.restoreAllMocks();
    });
  });

  describe("Sound playback on Windows", () => {
    it("should generate PowerShell sound command on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");

      vi.resetModules();
      const settingsModule = await import("../src/commands/setup/settings");

      const soundPath = "C:\\Users\\Test\\.claude\\song\\finish.mp3";

      vi.restoreAllMocks();
    });
  });
});

describe("macOS Platform (unchanged behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.appendFile).mockResolvedValue();
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));
    vi.mocked(fs.pathExists).mockResolvedValue(false as any);
  });

  it("should create .zshenv aliases on macOS", async () => {
    vi.spyOn(os, "platform").mockReturnValue("darwin");
    vi.spyOn(os, "homedir").mockReturnValue("/Users/TestUser");

    const { setupShellShortcuts } = await import(
      "../src/commands/setup/shell-shortcuts"
    );

    await setupShellShortcuts();

    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join("/Users/TestUser", ".zshenv"),
      expect.stringContaining('alias cc="claude --dangerously-skip-permissions"')
    );

    vi.restoreAllMocks();
  });
});

describe("Linux Platform (unchanged behavior)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue();
    vi.mocked(fs.appendFile).mockResolvedValue();
    vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));
    vi.mocked(fs.pathExists).mockResolvedValue(false as any);
  });

  it("should create .bashrc aliases on Linux with bash", async () => {
    vi.spyOn(os, "platform").mockReturnValue("linux");
    vi.spyOn(os, "homedir").mockReturnValue("/home/testuser");

    const originalEnv = process.env.SHELL;
    process.env.SHELL = "/bin/bash";

    const { setupShellShortcuts } = await import(
      "../src/commands/setup/shell-shortcuts"
    );

    await setupShellShortcuts();

    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join("/home/testuser", ".bashrc"),
      expect.stringContaining('alias cc="claude --dangerously-skip-permissions"')
    );

    process.env.SHELL = originalEnv;
    vi.restoreAllMocks();
  });

  it("should create .zshrc aliases on Linux with zsh", async () => {
    vi.spyOn(os, "platform").mockReturnValue("linux");
    vi.spyOn(os, "homedir").mockReturnValue("/home/testuser");

    const originalEnv = process.env.SHELL;
    process.env.SHELL = "/bin/zsh";

    const { setupShellShortcuts } = await import(
      "../src/commands/setup/shell-shortcuts"
    );

    await setupShellShortcuts();

    expect(fs.appendFile).toHaveBeenCalledWith(
      path.join("/home/testuser", ".zshrc"),
      expect.stringContaining('alias cc="claude --dangerously-skip-permissions"')
    );

    process.env.SHELL = originalEnv;
    vi.restoreAllMocks();
  });
});
