import { describe, expect, it } from "vitest";

describe("CLI Integration Tests - Add Hook Command", () => {
  it("should test add hook command and verify hook files are created", async () => {
    const tempDir = `./tmp/test-hook-${Date.now()}`;

    try {
      // First: Setup a basic Claude Code configuration
      const { execSync } = await import("child_process");

      console.log("Setting up basic configuration...");
      execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" --skip setup`,
        {
          cwd: process.cwd(),
          timeout: 30000,
          encoding: "utf8",
        },
      );

      // Wait for setup to complete
      const waitForSetup = async (maxSeconds = 10): Promise<boolean> => {
        const realFs = await import("fs-extra");
        const interval = 1000;
        const maxAttempts = maxSeconds;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const settingsExists = await realFs.pathExists(`${tempDir}/settings.json`);
          if (settingsExists) {
            return true;
          }
          if (attempt < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
        return false;
      };

      const setupComplete = await waitForSetup();
      expect(setupComplete).toBe(true);

      // Second: Add the hook
      console.log("Adding post-edit-typescript hook...");
      execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" add hook post-edit-typescript`,
        {
          cwd: process.cwd(),
          timeout: 30000,
          encoding: "utf8",
        },
      );

      // Third: Verify hook files were created
      const realFs = await import("fs-extra");


      // Check if hook file was copied to scripts directory
      const hookFileExists = await realFs.pathExists(`${tempDir}/scripts/hook-post-file.ts`);
      expect(hookFileExists).toBe(true);

      // Check if settings.json was updated with the hook
      const settingsContent = await realFs.readFile(`${tempDir}/settings.json`, 'utf-8');
      const settings = JSON.parse(settingsContent);

      expect(settings).toHaveProperty("hooks");
      expect(settings.hooks).toHaveProperty("PostToolUse");

      // Verify the hook configuration
      const postToolUseHooks = settings.hooks.PostToolUse;
      expect(Array.isArray(postToolUseHooks)).toBe(true);

      const hookConfig = postToolUseHooks.find((hook: any) =>
        hook.matcher === "Edit|Write|MultiEdit"
      );
      expect(hookConfig).toBeDefined();
      expect(hookConfig.hooks).toBeDefined();
      expect(Array.isArray(hookConfig.hooks)).toBe(true);

      const hookCommand = hookConfig.hooks[0];
      expect(hookCommand).toHaveProperty("type", "command");
      expect(hookCommand).toHaveProperty("command");
      expect(hookCommand.command).toContain("hook-post-file.ts");

      console.log("✅ Hook added successfully!");

    } finally {
      // Cleanup
      try {
        const realFs = await import("fs-extra");
        if (await realFs.pathExists(tempDir)) {
          await realFs.remove(tempDir);
          console.log(`Cleaned up ${tempDir}`);
        }
      } catch (error) {
        console.warn(`Cleanup failed for ${tempDir}:`, error);
      }
    }
  }, 60000);
});