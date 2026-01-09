import os from "os";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("Platform Utilities", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("isWSL", () => {
    it("should return true when running on WSL", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");
      vi.spyOn(os, "release").mockReturnValue("5.15.153.1-microsoft-standard-WSL2");

      const { isWSL } = await import("../src/lib/platform");
      expect(isWSL()).toBe(true);

      vi.restoreAllMocks();
    });

    it("should return true when running on older WSL", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");
      vi.spyOn(os, "release").mockReturnValue("4.4.0-19041-Microsoft");

      const { isWSL } = await import("../src/lib/platform");
      expect(isWSL()).toBe(true);

      vi.restoreAllMocks();
    });

    it("should return false on native Linux", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");
      vi.spyOn(os, "release").mockReturnValue("5.15.0-generic");

      const { isWSL } = await import("../src/lib/platform");
      expect(isWSL()).toBe(false);

      vi.restoreAllMocks();
    });

    it("should return false on macOS", async () => {
      vi.spyOn(os, "platform").mockReturnValue("darwin");
      vi.spyOn(os, "release").mockReturnValue("23.0.0");

      const { isWSL } = await import("../src/lib/platform");
      expect(isWSL()).toBe(false);

      vi.restoreAllMocks();
    });

    it("should return false on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");
      vi.spyOn(os, "release").mockReturnValue("10.0.19045");

      const { isWSL } = await import("../src/lib/platform");
      expect(isWSL()).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe("getPlatformInfo", () => {
    it("should detect macOS correctly", async () => {
      vi.spyOn(os, "platform").mockReturnValue("darwin");
      vi.spyOn(os, "release").mockReturnValue("23.0.0");
      vi.spyOn(os, "homedir").mockReturnValue("/Users/testuser");

      const { getPlatformInfo } = await import("../src/lib/platform");
      const info = getPlatformInfo();

      expect(info.isMacOS).toBe(true);
      expect(info.isWindows).toBe(false);
      expect(info.isLinux).toBe(false);
      expect(info.isWSL).toBe(false);
      expect(info.homeDir).toBe("/Users/testuser");

      vi.restoreAllMocks();
    });

    it("should detect Windows correctly", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");
      vi.spyOn(os, "release").mockReturnValue("10.0.19045");
      vi.spyOn(os, "homedir").mockReturnValue("C:\\Users\\testuser");

      const { getPlatformInfo } = await import("../src/lib/platform");
      const info = getPlatformInfo();

      expect(info.isWindows).toBe(true);
      expect(info.isMacOS).toBe(false);
      expect(info.isLinux).toBe(false);
      expect(info.isWSL).toBe(false);

      vi.restoreAllMocks();
    });

    it("should detect WSL correctly", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");
      vi.spyOn(os, "release").mockReturnValue("5.15.153.1-microsoft-standard-WSL2");
      vi.spyOn(os, "homedir").mockReturnValue("/home/testuser");

      const { getPlatformInfo } = await import("../src/lib/platform");
      const info = getPlatformInfo();

      expect(info.isWSL).toBe(true);
      expect(info.isLinux).toBe(false);
      expect(info.isWindows).toBe(false);
      expect(info.isMacOS).toBe(false);

      vi.restoreAllMocks();
    });

    it("should detect native Linux correctly", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");
      vi.spyOn(os, "release").mockReturnValue("5.15.0-generic");
      vi.spyOn(os, "homedir").mockReturnValue("/home/testuser");

      const { getPlatformInfo } = await import("../src/lib/platform");
      const info = getPlatformInfo();

      expect(info.isLinux).toBe(true);
      expect(info.isWSL).toBe(false);
      expect(info.isWindows).toBe(false);
      expect(info.isMacOS).toBe(false);

      vi.restoreAllMocks();
    });
  });

  describe("transformHookCommand", () => {
    it("should transform macOS paths to local path", async () => {
      const { transformHookCommand } = await import("../src/lib/platform");

      const command = "bun /Users/melvynx/.claude/scripts/auto-rename-session/src/index.ts";
      const result = transformHookCommand(command, "/home/testuser/.claude");

      expect(result).toBe("bun /home/testuser/.claude/scripts/auto-rename-session/src/index.ts");
    });

    it("should transform Linux paths to local path", async () => {
      const { transformHookCommand } = await import("../src/lib/platform");

      const command = "bun /home/melvyn/.claude/scripts/statusline/src/index.ts";
      const result = transformHookCommand(command, "/Users/newuser/.claude");

      expect(result).toBe("bun /Users/newuser/.claude/scripts/statusline/src/index.ts");
    });

    it("should transform Windows backslash paths to POSIX", async () => {
      const { transformHookCommand } = await import("../src/lib/platform");

      const command = "bun C:\\Users\\TestUser\\.claude\\scripts\\validator.ts";
      const result = transformHookCommand(command, "/home/testuser/.claude");

      expect(result).toBe("bun /home/testuser/.claude/scripts/validator.ts");
    });

    it("should convert remaining backslashes to forward slashes", async () => {
      const { transformHookCommand } = await import("../src/lib/platform");

      const command = "bun C:\\some\\path\\script.ts";
      const result = transformHookCommand(command, "/home/user/.claude");

      expect(result).not.toContain("\\");
      expect(result).toBe("bun C:/some/path/script.ts");
    });

    it("should not modify already correct paths", async () => {
      const { transformHookCommand } = await import("../src/lib/platform");

      const command = "bun /home/testuser/.claude/scripts/test.ts";
      const result = transformHookCommand(command, "/home/testuser/.claude");

      expect(result).toBe("bun /home/testuser/.claude/scripts/test.ts");
    });
  });

  describe("transformHook", () => {
    it("should transform hook with command property", async () => {
      const { transformHook } = await import("../src/lib/platform");

      const hook = {
        type: "command",
        command: "bun /Users/melvynx/.claude/scripts/test.ts",
      };
      const result = transformHook(hook, "/home/user/.claude");

      expect(result.command).toBe("bun /home/user/.claude/scripts/test.ts");
    });

    it("should transform nested hooks array", async () => {
      const { transformHook } = await import("../src/lib/platform");

      const hook = {
        matcher: "Bash",
        hooks: [
          {
            type: "command",
            command: "bun /Users/melvynx/.claude/scripts/validator.ts",
          },
        ],
      };
      const result = transformHook(hook, "/home/user/.claude");

      expect(result.hooks[0].command).toBe("bun /home/user/.claude/scripts/validator.ts");
    });

    it("should handle null/undefined hooks", async () => {
      const { transformHook } = await import("../src/lib/platform");

      expect(transformHook(null, "/home/user/.claude")).toBe(null);
      expect(transformHook(undefined, "/home/user/.claude")).toBe(undefined);
    });
  });

  describe("detectAudioPlayer", () => {
    it("should return afplay on macOS", async () => {
      vi.spyOn(os, "platform").mockReturnValue("darwin");

      const { detectAudioPlayer } = await import("../src/lib/platform");
      const player = detectAudioPlayer();

      expect(player).toBe("afplay");

      vi.restoreAllMocks();
    });

    it("should return powershell on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");

      const { detectAudioPlayer } = await import("../src/lib/platform");
      const player = detectAudioPlayer();

      expect(player).toBe("powershell");

      vi.restoreAllMocks();
    });

    it("should detect available player on Linux", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");

      const { execSync } = await import("child_process");
      vi.mocked(execSync).mockImplementation((cmd: string) => {
        if (cmd === "which paplay") return Buffer.from("/usr/bin/paplay");
        throw new Error("not found");
      });

      const { detectAudioPlayer } = await import("../src/lib/platform");
      const player = detectAudioPlayer();

      expect(player).toBe("paplay");

      vi.restoreAllMocks();
    });

    it("should return null when no player available on Linux", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");

      const { execSync } = await import("child_process");
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("not found");
      });

      const { detectAudioPlayer } = await import("../src/lib/platform");
      const player = detectAudioPlayer();

      expect(player).toBe(null);

      vi.restoreAllMocks();
    });
  });

  describe("getPlaySoundCommand", () => {
    it("should return afplay command on macOS", async () => {
      vi.spyOn(os, "platform").mockReturnValue("darwin");

      const { getPlaySoundCommand } = await import("../src/lib/platform");
      const cmd = getPlaySoundCommand("/path/to/sound.mp3");

      expect(cmd).toBe("afplay -v 0.1 '/path/to/sound.mp3'");

      vi.restoreAllMocks();
    });

    it("should return PowerShell command on Windows", async () => {
      vi.spyOn(os, "platform").mockReturnValue("win32");

      const { getPlaySoundCommand } = await import("../src/lib/platform");
      const cmd = getPlaySoundCommand("C:/path/to/sound.mp3");

      expect(cmd).toContain("powershell");
      expect(cmd).toContain("SoundPlayer");

      vi.restoreAllMocks();
    });

    it("should return null when no player available", async () => {
      vi.spyOn(os, "platform").mockReturnValue("linux");

      const { execSync } = await import("child_process");
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("not found");
      });

      const { getPlaySoundCommand } = await import("../src/lib/platform");
      const cmd = getPlaySoundCommand("/path/to/sound.mp3");

      expect(cmd).toBe(null);

      vi.restoreAllMocks();
    });
  });
});
