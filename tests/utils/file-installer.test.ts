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

      expect(fs.ensureDir).toHaveBeenCalledWith("/target");
      expect(github.downloadAndWriteFile).toHaveBeenCalledWith(
        "commands/test.md",
        "/target/test.md"
      );
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
      expect(fs.copy).toHaveBeenCalledWith("/local/commands/test.md", "/target/test.md");
    });

    it("should use local when GitHub is not available", async () => {
      vi.mocked(github.isGitHubAvailable).mockResolvedValue(false);
      vi.mocked(claudeConfig.findLocalConfigDir).mockResolvedValue("/local/commands");
      vi.mocked(fs.pathExists).mockResolvedValue(true);

      await installFileWithGitHubFallback({ ...options, useGitHub: false });

      expect(github.downloadAndWriteFile).not.toHaveBeenCalled();
      expect(claudeConfig.findLocalConfigDir).toHaveBeenCalledWith("commands");
      expect(fs.copy).toHaveBeenCalledWith("/local/commands/test.md", "/target/test.md");
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
      expect(fs.readFile).toHaveBeenCalledWith("/local/commands/test.md", "utf-8");
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
      expect(fs.readFile).toHaveBeenCalledWith("/local/commands/test.md", "utf-8");
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