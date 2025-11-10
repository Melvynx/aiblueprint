import { describe, expect, it } from "vitest";

describe("CLI Integration Tests - Add Command", () => {
  it("should list available commands when no argument is provided", async () => {
    const { execSync } = await import("child_process");

    const output = execSync(
      `bun src/cli.ts claude-code add commands`,
      {
        cwd: process.cwd(),
        timeout: 10000,
        encoding: "utf8",
      },
    );

    // Check that the output contains expected commands
    expect(output).toContain("Available Claude Code Commands");
    expect(output).toContain("commit");
    expect(output).toContain("create-pull-request");
    expect(output).toContain("epct");
    expect(output).toContain("Quick commit and push with minimal, clean messages");
    expect(output).toContain("Usage:");
    expect(output).toContain("aiblueprint claude-code add commands <command-name>");
  });

  it("should add a specific command and verify file is created", async () => {
    const tempDir = `./tmp/test-command-${Date.now()}`;

    try {
      const { execSync } = await import("child_process");
      const realFs = await import("fs-extra");

      // Add a specific command
      console.log("Adding commit command...");
      const output = execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" add commands commit`,
        {
          cwd: process.cwd(),
          timeout: 10000,
          encoding: "utf8",
        },
      );

      // Verify output messages
      expect(output).toContain("Command installed successfully!");
      expect(output).toContain("Name: Commit");
      expect(output).toContain("Description: Quick commit and push with minimal, clean messages");
      expect(output).toContain("Tools: Bash(git :*)");

      // Verify command file was created
      const commandFilePath = `${tempDir}/commands/commit.md`;
      const commandFileExists = await realFs.pathExists(commandFilePath);
      expect(commandFileExists).toBe(true);

      // Verify file content is correct
      const commandContent = await realFs.readFile(commandFilePath, 'utf-8');
      expect(commandContent).toContain("---");
      expect(commandContent).toContain("allowed-tools: Bash(git :*)");
      expect(commandContent).toContain("description: Quick commit and push with minimal, clean messages");
      expect(commandContent).toContain("You are a git commit automation tool");

      console.log("✅ Command added successfully!");

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
  });

  it("should handle invalid command names gracefully", async () => {
    const { execSync } = await import("child_process");

    try {
      execSync(
        `bun src/cli.ts claude-code add commands nonexistent-command`,
        {
          cwd: process.cwd(),
          timeout: 10000,
          encoding: "utf8",
        },
      );
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message;
      expect(output).toContain("Command 'nonexistent-command' not found");
      expect(output).toContain("Available commands:");
      expect(output).toContain("commit:");
    }
  });

  it("should add multiple different commands successfully", async () => {
    const tempDir = `./tmp/test-multiple-commands-${Date.now()}`;

    try {
      const { execSync } = await import("child_process");
      const realFs = await import("fs-extra");

      // Add first command
      execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" add commands commit`,
        {
          cwd: process.cwd(),
          timeout: 10000,
          encoding: "utf8",
        },
      );

      // Add second command
      execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" add commands epct`,
        {
          cwd: process.cwd(),
          timeout: 10000,
          encoding: "utf8",
        },
      );

      // Verify both files exist
      const commitExists = await realFs.pathExists(`${tempDir}/commands/commit.md`);
      const epctExists = await realFs.pathExists(`${tempDir}/commands/epct.md`);

      expect(commitExists).toBe(true);
      expect(epctExists).toBe(true);

      // Verify content of both files
      const commitContent = await realFs.readFile(`${tempDir}/commands/commit.md`, 'utf-8');
      const epctContent = await realFs.readFile(`${tempDir}/commands/epct.md`, 'utf-8');

      expect(commitContent).toContain("git commit automation tool");
      expect(epctContent).toContain("EPCT");

      console.log("✅ Multiple commands added successfully!");

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
  });

  it("should handle existing command file conflict properly", async () => {
    const tempDir = `./tmp/test-conflict-${Date.now()}`;

    try {
      const { execSync } = await import("child_process");
      const realFs = await import("fs-extra");

      // Add command first time
      execSync(
        `bun src/cli.ts claude-code -f "${tempDir}" add commands commit`,
        {
          cwd: process.cwd(),
          timeout: 10000,
          encoding: "utf8",
        },
      );

      // Verify file exists
      const commandFilePath = `${tempDir}/commands/commit.md`;
      const fileExists = await realFs.pathExists(commandFilePath);
      expect(fileExists).toBe(true);

      // Try to add the same command again (this will prompt for overwrite)
      // The command should detect the existing file and prompt for overwrite
      try {
        const conflictOutput = execSync(
          `echo "n" | bun src/cli.ts claude-code -f "${tempDir}" add commands commit`,
          {
            cwd: process.cwd(),
            timeout: 10000,
            encoding: "utf8",
            shell: true,
          } as any
        );
        // If it succeeds without error, it should at least show the overwrite prompt
        expect(conflictOutput).toContain("Command file already exists");
      } catch (error: any) {
        // If it fails (which is expected when user says "no"), check the output
        const output = error.stdout?.toString() || "";
        expect(output).toContain("Command file already exists");
        expect(output).toContain("Command installation cancelled");
      }

      console.log("✅ Conflict handling working correctly!");

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
  });
}, 60000);