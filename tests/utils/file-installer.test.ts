import { describe, expect, it, vi, beforeEach } from "vitest";
import { installFileWithGitHubFallback, getFileContentWithGitHubFallback } from "../../src/utils/file-installer.js";
import * as github from "../../src/utils/github.js";
import * as claudeConfig from "../../src/utils/claude-config.js";
import fs from 'fs-extra';
import path from 'path';

// Mock dependencies
vi.mock('../../src/utils/github.js');
vi.mock('../../src/utils/claude-config.js');
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    copy: vi.fn(),
    pathExists: vi.fn(),
    readFile: vi.fn()
  }
}));

describe("File Installer Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("installFileWithGitHubFallback", () => {
    const options = {
      sourceDir: "commands",
      targetPath: "/target/test.md",
      fileName: "test.md"
    };

    it("should install from GitHub when available and successful", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(true);
      vi.mocked(github.downloadAndWriteFile).mockResolvedValue(true);

      await installFileWithGitHubFallback(options);

      // Check that the function was called with the dirname of the target path
      const calls = vi.mocked(fs.ensureDir).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(path.normalize(calls[0][0] as string)).toBe(path.normalize("/target"));

      // Check that downloadAndWriteFile was called with correct parameters
      const downloadCalls = vi.mocked(github.downloadAndWriteFile).mock.calls;
      expect(downloadCalls.length).toBeGreaterThan(0);
      expect(downloadCalls[0][0]).toBe("commands/test.md");
      expect(downloadCalls[0][1]).toBe("/target/test.md");

      expect(claudeConfig.findLocalConfigDir).not.toHaveBeenCalled();
    });

    it("should fallback to local when GitHub fails", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(true);
      vi.mocked(github.downloadAndWriteFile).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(true);

      await installFileWithGitHubFallback(options);

      expect(github.downloadAndWriteFile).toHaveBeenCalled();
      expect(claudeConfig.findLocalConfigDir).toHaveBeenCalledWith("commands");

      // Check copy was called with correct normalized paths
      const copyCalls = vi.mocked(fs.copy).mock.calls;
      expect(copyCalls.length).toBeGreaterThan(0);
      expect(path.normalize(copyCalls[0][0] as string)).toBe(path.normalize("/local/commands/test.md"));
      expect(copyCalls[0][1]).toBe("/target/test.md");
    });

    it("should use local when GitHub is not available", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(true);

      await installFileWithGitHubFallback({ ...options, useGitHub: false });

      expect(github.downloadAndWriteFile).not.toHaveBeenCalled();
      expect(claudeConfig.findLocalConfigDir).toHaveBeenCalledWith("commands");

      // Check copy was called with correct normalized paths
      const copyCalls = vi.mocked(fs.copy).mock.calls;
      expect(copyCalls.length).toBeGreaterThan(0);
      expect(path.normalize(copyCalls[0][0] as string)).toBe(path.normalize("/local/commands/test.md"));
      expect(copyCalls[0][1]).toBe("/target/test.md");
    });

    it("should throw error when neither GitHub nor local directory found", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue(null);

      await expect(installFileWithGitHubFallback(options)).rejects.toThrow(
        "Neither GitHub nor local commands directory found"
      );
    });

    it("should throw error when local file does not exist", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await expect(installFileWithGitHubFallback(options)).rejects.toThrow(
        "File not found: test.md"
      );
    });
  });

  describe("getFileContentWithGitHubFallback", () => {
    it("should get content from GitHub when available", async () => {
      const mockContent = "test content";
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(true);
      vi.mocked(github.downloadFromGitHub).mockResolvedValue(mockContent);

      const result = await getFileContentWithGitHubFallback("commands", "test.md");

      expect(result).toBe(mockContent);
      expect(github.downloadFromGitHub).toHaveBeenCalledWith("commands/test.md");
      expect(claudeConfig.findLocalConfigDir).not.toHaveBeenCalled();
    });

    it("should fallback to local when GitHub fails", async () => {
      const mockContent = "local content";
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(true);
      vi.mocked(github.downloadFromGitHub).mockResolvedValue(null);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await getFileContentWithGitHubFallback("commands", "test.md");

      expect(result).toBe(mockContent);
      expect(github.downloadFromGitHub).toHaveBeenCalled();
      expect(claudeConfig.findLocalConfigDir).toHaveBeenCalledWith("commands");

      // Check readFile was called with correct normalized path
      const readCalls = vi.mocked(fs.readFile).mock.calls;
      expect(readCalls.length).toBeGreaterThan(0);
      expect(path.normalize(readCalls[0][0] as string)).toBe(path.normalize("/local/commands/test.md"));
      expect(readCalls[0][1]).toBe("utf-8");
    });

    it("should use local when GitHub is not available", async () => {
      const mockContent = "local content";
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(true);
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await getFileContentWithGitHubFallback("commands", "test.md");

      expect(result).toBe(mockContent);
      expect(github.downloadFromGitHub).not.toHaveBeenCalled();
      expect(claudeConfig.findLocalConfigDir).toHaveBeenCalledWith("commands");

      // Check readFile was called with correct normalized path
      const readCalls = vi.mocked(fs.readFile).mock.calls;
      expect(readCalls.length).toBeGreaterThan(0);
      expect(path.normalize(readCalls[0][0] as string)).toBe(path.normalize("/local/commands/test.md"));
      expect(readCalls[0][1]).toBe("utf-8");
    });

    it("should throw error when neither GitHub nor local directory found", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue(null);

      await expect(getFileContentWithGitHubFallback("commands", "test.md")).rejects.toThrow(
        "Neither GitHub nor local commands directory found"
      );
    });

    it("should throw error when local file does not exist", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(false);

      await expect(getFileContentWithGitHubFallback("commands", "test.md")).rejects.toThrow(
        "File not found: test.md"
      );
    });
  });
});