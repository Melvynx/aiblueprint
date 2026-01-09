import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";

describe("Setup Terminal - Unit Tests", () => {
  describe("sanitizeThemeName", () => {
    it("should allow valid theme names", async () => {
      const { sanitizeThemeName } = await import("../src/commands/setup-terminal.js");
      expect(sanitizeThemeName("robbyrussell")).toBe("robbyrussell");
      expect(sanitizeThemeName("af-magic")).toBe("af-magic");
      expect(sanitizeThemeName("theme_name")).toBe("theme_name");
      expect(sanitizeThemeName("Theme123")).toBe("Theme123");
    });

    it("should remove invalid characters", async () => {
      const { sanitizeThemeName } = await import("../src/commands/setup-terminal.js");
      expect(sanitizeThemeName('evil"; rm -rf /')).toBe("evilrm-rf");
      expect(sanitizeThemeName("theme$(whoami)")).toBe("themewhoami");
      expect(sanitizeThemeName("theme`id`")).toBe("themeid");
      expect(sanitizeThemeName("theme;echo pwned")).toBe("themeechopwned");
    });

    it("should return default theme for empty input", async () => {
      const { sanitizeThemeName } = await import("../src/commands/setup-terminal.js");
      expect(sanitizeThemeName("")).toBe("robbyrussell");
      expect(sanitizeThemeName("!!!")).toBe("robbyrussell");
      expect(sanitizeThemeName("   ")).toBe("robbyrussell");
    });
  });

  describe("zshrc updates", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `test-setup-terminal-${Date.now()}`);
      await fs.ensureDir(tempDir);
    });

    afterEach(async () => {
      await fs.remove(tempDir);
    });

    it("should update existing theme in .zshrc", async () => {
      const zshrcPath = path.join(tempDir, ".zshrc");
      await fs.writeFile(zshrcPath, 'ZSH_THEME="robbyrussell"\nplugins=(git)\n');

      const { updateZshrcTheme } = await import("../src/commands/setup-terminal.js");
      updateZshrcTheme("agnoster", tempDir);

      const content = await fs.readFile(zshrcPath, "utf-8");
      expect(content).toContain('ZSH_THEME="agnoster"');
      expect(content).not.toContain('ZSH_THEME="robbyrussell"');
    });

    it("should add theme if not present in .zshrc", async () => {
      const zshrcPath = path.join(tempDir, ".zshrc");
      await fs.writeFile(zshrcPath, "# Some content\nplugins=(git)\n");

      const { updateZshrcTheme } = await import("../src/commands/setup-terminal.js");
      updateZshrcTheme("dst", tempDir);

      const content = await fs.readFile(zshrcPath, "utf-8");
      expect(content).toContain('ZSH_THEME="dst"');
    });

    it("should update existing plugins in .zshrc", async () => {
      const zshrcPath = path.join(tempDir, ".zshrc");
      await fs.writeFile(zshrcPath, 'ZSH_THEME="robbyrussell"\nplugins=(git)\n');

      const { updateZshrcPlugins } = await import("../src/commands/setup-terminal.js");
      updateZshrcPlugins(["git", "zsh-autosuggestions", "zsh-syntax-highlighting"], tempDir);

      const content = await fs.readFile(zshrcPath, "utf-8");
      expect(content).toContain("plugins=(git zsh-autosuggestions zsh-syntax-highlighting)");
      expect(content).not.toContain("plugins=(git)");
    });

    it("should add plugins if not present in .zshrc", async () => {
      const zshrcPath = path.join(tempDir, ".zshrc");
      await fs.writeFile(zshrcPath, 'ZSH_THEME="robbyrussell"\n# No plugins line');

      const { updateZshrcPlugins } = await import("../src/commands/setup-terminal.js");
      updateZshrcPlugins(["git", "zsh-autosuggestions"], tempDir);

      const content = await fs.readFile(zshrcPath, "utf-8");
      expect(content).toContain("plugins=(git zsh-autosuggestions)");
    });

    it("should throw error if .zshrc does not exist", async () => {
      const { updateZshrcTheme } = await import("../src/commands/setup-terminal.js");
      expect(() => updateZshrcTheme("robbyrussell", tempDir)).toThrow(".zshrc file not found");
    });

    it("should sanitize theme name when updating", async () => {
      const zshrcPath = path.join(tempDir, ".zshrc");
      await fs.writeFile(zshrcPath, 'ZSH_THEME="robbyrussell"\n');

      const { updateZshrcTheme } = await import("../src/commands/setup-terminal.js");
      updateZshrcTheme('evil"; rm -rf /', tempDir);

      const content = await fs.readFile(zshrcPath, "utf-8");
      expect(content).toContain('ZSH_THEME="evilrm-rf"');
      expect(content).not.toContain('";');
      expect(content).not.toContain("rm -rf");
    });
  });

  describe("isOhMyZshInstalled", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `test-omz-${Date.now()}`);
      await fs.ensureDir(tempDir);
    });

    afterEach(async () => {
      await fs.remove(tempDir);
    });

    it("should return true if .oh-my-zsh directory exists", async () => {
      await fs.ensureDir(path.join(tempDir, ".oh-my-zsh"));

      const { isOhMyZshInstalled } = await import("../src/commands/setup-terminal.js");
      expect(isOhMyZshInstalled(tempDir)).toBe(true);
    });

    it("should return false if .oh-my-zsh directory does not exist", async () => {
      const { isOhMyZshInstalled } = await import("../src/commands/setup-terminal.js");
      expect(isOhMyZshInstalled(tempDir)).toBe(false);
    });
  });

  describe("backupFile", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = path.join(os.tmpdir(), `test-backup-${Date.now()}`);
      await fs.ensureDir(tempDir);
    });

    afterEach(async () => {
      await fs.remove(tempDir);
    });

    it("should create backup of existing file", async () => {
      const filePath = path.join(tempDir, ".zshrc");
      await fs.writeFile(filePath, "original content");

      const { backupFile } = await import("../src/commands/setup-terminal.js");
      const backupPath = backupFile(filePath);

      expect(backupPath).not.toBeNull();
      expect(backupPath).toContain(".backup-");
      expect(await fs.pathExists(backupPath!)).toBe(true);
      expect(await fs.readFile(backupPath!, "utf-8")).toBe("original content");
    });

    it("should return null if file does not exist", async () => {
      const { backupFile } = await import("../src/commands/setup-terminal.js");
      const backupPath = backupFile(path.join(tempDir, "nonexistent"));

      expect(backupPath).toBeNull();
    });
  });

  describe("commandExists", () => {
    it("should return true for existing commands", async () => {
      const { commandExists } = await import("../src/commands/setup-terminal.js");
      // These should exist on any Unix system
      expect(commandExists("ls")).toBe(true);
      expect(commandExists("echo")).toBe(true);
    });

    it("should return false for non-existing commands", async () => {
      const { commandExists } = await import("../src/commands/setup-terminal.js");
      expect(commandExists("definitely-not-a-real-command-12345")).toBe(false);
    });

    it("should reject invalid command names", async () => {
      const { commandExists } = await import("../src/commands/setup-terminal.js");
      // These should be rejected due to invalid characters
      expect(commandExists("ls; rm -rf /")).toBe(false);
      expect(commandExists("cmd$(whoami)")).toBe(false);
    });
  });

  describe("installPlugin validation", () => {
    it("should reject invalid plugin names", async () => {
      const { installPlugin } = await import("../src/commands/setup-terminal.js");
      const tempDir = path.join(os.tmpdir(), `test-plugin-${Date.now()}`);

      await expect(
        installPlugin("../../../etc/passwd", "https://github.com/zsh-users/zsh-autosuggestions", tempDir)
      ).rejects.toThrow("Invalid plugin name");

      await expect(
        installPlugin("plugin;rm -rf /", "https://github.com/zsh-users/zsh-autosuggestions", tempDir)
      ).rejects.toThrow("Invalid plugin name");
    });

    it("should reject invalid repository URLs", async () => {
      const { installPlugin } = await import("../src/commands/setup-terminal.js");
      const tempDir = path.join(os.tmpdir(), `test-plugin-${Date.now()}`);

      await expect(
        installPlugin("valid-plugin", "https://evil.com/malware", tempDir)
      ).rejects.toThrow("Invalid repository URL");

      await expect(
        installPlugin("valid-plugin", "file:///etc/passwd", tempDir)
      ).rejects.toThrow("Invalid repository URL");
    });
  });
});
