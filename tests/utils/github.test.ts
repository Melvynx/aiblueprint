import { describe, expect, it, vi, beforeEach } from "vitest";
import { downloadFromGitHub, listFilesFromGitHub, isGitHubAvailable, downloadAndWriteFile } from "../../src/utils/github.js";
import fs from 'fs-extra';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn(),
    writeFile: vi.fn(),
  }
}));

describe("GitHub Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("downloadFromGitHub", () => {
    it("should download content successfully", async () => {
      const mockContent = "test content";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      });

      const result = await downloadFromGitHub("commands/test.md");

      expect(result).toBe(mockContent);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config/commands/test.md"
      );
    });

    it("should return null when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const result = await downloadFromGitHub("commands/test.md");

      expect(result).toBe(null);
    });

    it("should return null when fetch throws error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await downloadFromGitHub("commands/test.md");

      expect(result).toBe(null);
    });
  });

  describe("listFilesFromGitHub", () => {
    it("should list files successfully", async () => {
      const mockFiles = [
        { name: "commit.md", type: "file" },
        { name: "epct.md", type: "file" },
        { name: "subdir", type: "dir" }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFiles)
      });

      const result = await listFilesFromGitHub("commands");

      expect(result).toEqual(["commit.md", "epct.md"]);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/repos/Melvynx/aiblueprint-cli/contents/claude-code-config/commands"
      );
    });

    it("should return empty array when response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const result = await listFilesFromGitHub("commands");

      expect(result).toEqual([]);
    });

    it("should return empty array when fetch throws error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await listFilesFromGitHub("commands");

      expect(result).toEqual([]);
    });
  });

  describe("isGitHubAvailable", () => {
    it("should return true when GitHub is available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      const result = await isGitHubAvailable();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/Melvynx/aiblueprint-cli/main/claude-code-config/commands/commit.md"
      );
    });

    it("should return false when GitHub is not available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const result = await isGitHubAvailable();

      expect(result).toBe(false);
    });

    it("should return false when fetch throws error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await isGitHubAvailable();

      expect(result).toBe(false);
    });
  });

  describe("downloadAndWriteFile", () => {
    it("should download and write file successfully", async () => {
      const mockContent = "test content";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent)
      });

      const result = await downloadAndWriteFile("commands/test.md", "/tmp/test.md");

      expect(result).toBe(true);
      expect(fs.ensureDir).toHaveBeenCalledWith("/tmp");
      expect(fs.writeFile).toHaveBeenCalledWith("/tmp/test.md", mockContent);
    });

    it("should return false when download fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const result = await downloadAndWriteFile("commands/test.md", "/tmp/test.md");

      expect(result).toBe(false);
      expect(fs.ensureDir).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});