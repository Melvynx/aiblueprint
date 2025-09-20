import { describe, expect, it } from "vitest";

describe("CLI Integration Tests", () => {
  it("should test setup command and verify files are created", async () => {
    const tempDir = `./tmp/test-claude-real-${Date.now()}`;

    try {
      // Execute the real CLI command
      const { execSync } = await import("child_process");

      const output = execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" --skip setup`,
        {
          cwd: process.cwd(),
          timeout: 15000,
          encoding: "utf8",
        },
      );

      // Wait for files to be created (GitHub API can take time)
      const waitForFiles = async (maxSeconds = 10): Promise<boolean> => {
        const realFs = await import("fs-extra");
        const interval = 1000; // Check every second
        const maxAttempts = maxSeconds;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const settingsExists = await realFs.pathExists(`${tempDir}/settings.json`);
          const scriptsExists = await realFs.pathExists(`${tempDir}/scripts`);

          if (settingsExists && scriptsExists) {
            return true;
          }

          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
        return false;
      };

      const filesCreated = await waitForFiles();
      expect(filesCreated).toBe(true);

      // Verify settings.json content
      const realFs = await import("fs-extra");
      const settingsContent = await realFs.readFile(`${tempDir}/settings.json`, 'utf-8');
      const settings = JSON.parse(settingsContent);

      expect(settings).toHaveProperty("hooks");
      expect(settings.hooks).toHaveProperty("PreToolUse");
      expect(settings.hooks).toHaveProperty("Stop");
      expect(settings.hooks).toHaveProperty("Notification");

      if (settings.statusLine) {
        expect(settings.statusLine).toHaveProperty("type", "command");
        expect(settings.statusLine).toHaveProperty("command");
      }

    } finally {
      // Cleanup
      try {
        const realFs = await import("fs-extra");
        if (await realFs.pathExists(tempDir)) {
          await realFs.remove(tempDir);
        }
      } catch (error) {
        console.warn(`Cleanup failed for ${tempDir}:`, error);
      }
    }
  }, 20000);
});