import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseYamlFrontmatter, getLocalConfigPaths, findLocalConfigDir, getTargetDirectory } from "../../src/utils/claude-config.js";
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn()
  }
}));

// Mock process.env and process.cwd
const originalEnv = process.env;
const originalCwd = process.cwd;

describe("Claude Config Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.cwd = originalCwd;
  });

  describe("parseYamlFrontmatter", () => {
    it("should parse YAML frontmatter correctly", () => {
      const content = `---
description: Test command
allowed-tools: Bash(git :*)
argument-hint: <test-arg>
---

This is the body content`;

      const result = parseYamlFrontmatter(content);

      expect(result.metadata).toEqual({
        description: "Test command",
        "allowed-tools": "Bash(git :*)",
        "argument-hint": "<test-arg>"
      });
      expect(result.body).toBe("\nThis is the body content");
    });

    it("should handle content without frontmatter", () => {
      const content = "Just some regular content";

      const result = parseYamlFrontmatter(content);

      expect(result.metadata).toEqual({});
      expect(result.body).toBe(content);
    });

    it("should handle incomplete frontmatter", () => {
      const content = `---
description: Test command
This is missing closing ---`;

      const result = parseYamlFrontmatter(content);

      expect(result.metadata).toEqual({});
      expect(result.body).toBe(content);
    });

    it("should handle frontmatter with colons in values", () => {
      const content = `---
description: Test: command with colons
url: https://example.com
---

Body content`;

      const result = parseYamlFrontmatter(content);

      expect(result.metadata).toEqual({
        description: "Test: command with colons",
        url: "https://example.com"
      });
    });
  });

  describe("getLocalConfigPaths", () => {
    it("should return correct paths for commands", () => {
      const paths = getLocalConfigPaths("commands");

      expect(paths).toHaveLength(2);
      // Use path.normalize for cross-platform regex matching
      expect(path.normalize(paths[0])).toMatch(/claude-code-config[\/\\]commands$/);
      expect(path.normalize(paths[1])).toMatch(/claude-code-config[\/\\]commands$/);
    });

    it("should return correct paths for different subdirs", () => {
      const paths = getLocalConfigPaths("agents");

      expect(paths).toHaveLength(2);
      // Use path.normalize for cross-platform regex matching
      expect(path.normalize(paths[0])).toMatch(/claude-code-config[\/\\]agents$/);
      expect(path.normalize(paths[1])).toMatch(/claude-code-config[\/\\]agents$/);
    });
  });

  describe("findLocalConfigDir", () => {
    it("should return first existing path", async () => {
      const mockPathExists = fs.pathExists as any;
      // Mock the first call to return true, rest false
      let callCount = 0;
      mockPathExists.mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount === 1);
      });

      const result = await findLocalConfigDir("commands");

      expect(result).toBeTruthy();
      // Normalize the path for cross-platform matching
      expect(path.normalize(result!)).toContain(path.normalize('claude-code-config/commands'));
    });

    it("should return null when no paths exist", async () => {
      const mockPathExists = fs.pathExists as any;
      mockPathExists.mockResolvedValue(false);

      const result = await findLocalConfigDir("commands");

      expect(result).toBe(null);
    });
  });

  describe("getTargetDirectory", () => {
    it("should use custom folder when provided", async () => {
      const options = { folder: "/custom/path" };

      const result = await getTargetDirectory(options);

      expect(result).toBe("/custom/path");
    });

    it("should use project directory when in git repo", async () => {
      const mockPathExists = fs.pathExists as any;
      const mockCwd = "/project/dir";
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockCwd);

      mockPathExists.mockImplementation((checkPath: string) => {
        return Promise.resolve(path.normalize(checkPath) === path.normalize(path.join(mockCwd, ".git")));
      });

      const result = await getTargetDirectory({});
      process.cwd = originalCwd;

      expect(path.normalize(result)).toBe(path.normalize("/project/dir/.claude"));
    });

    it("should use project directory when .claude config exists", async () => {
      const mockPathExists = fs.pathExists as any;
      const mockCwd = "/project/dir";
      const originalCwd = process.cwd;
      process.cwd = vi.fn().mockReturnValue(mockCwd);

      mockPathExists.mockImplementation((checkPath: string) => {
        return Promise.resolve(path.normalize(checkPath) === path.normalize(path.join(mockCwd, ".claude")));
      });

      const result = await getTargetDirectory({});
      process.cwd = originalCwd;

      expect(path.normalize(result)).toBe(path.normalize("/project/dir/.claude"));
    });

    it("should use home directory as fallback", async () => {
      const mockPathExists = fs.pathExists as any;
      process.cwd = vi.fn().mockReturnValue("/project/dir");
      process.env.HOME = "/home/user";

      mockPathExists.mockResolvedValue(false);

      const result = await getTargetDirectory({});

      // Normalize paths for cross-platform compatibility
      expect(path.normalize(result)).toBe(path.normalize("/home/user/.claude"));
    });

    it("should use USERPROFILE on Windows", async () => {
      const mockPathExists = fs.pathExists as any;
      process.cwd = vi.fn().mockReturnValue("/project/dir");
      delete process.env.HOME;
      process.env.USERPROFILE = "C:/Users/user";

      mockPathExists.mockResolvedValue(false);

      const result = await getTargetDirectory({});

      // Normalize paths for cross-platform compatibility
      expect(path.normalize(result)).toBe(path.normalize("C:/Users/user/.claude"));
    });
  });
});