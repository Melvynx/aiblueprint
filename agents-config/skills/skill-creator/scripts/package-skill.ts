#!/usr/bin/env bun
/**
 * Skill Packager - Creates a distributable .skill file
 *
 * Usage:
 *   bun scripts/package-skill.ts <path/to/skill-folder> [output-directory]
 *
 * Examples:
 *   bun scripts/package-skill.ts ~/.claude/skills/my-skill
 *   bun scripts/package-skill.ts ~/.claude/skills/my-skill ./dist
 */

import { existsSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { join, resolve, relative, basename } from "path";
import { validateSkill } from "./validate";

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir);
    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

async function packageSkill(
  skillPath: string,
  outputDir?: string
): Promise<string | null> {
  const resolvedPath = resolve(skillPath);

  if (!existsSync(resolvedPath)) {
    console.log(`❌ Error: Skill folder not found: ${resolvedPath}`);
    return null;
  }

  const stat = statSync(resolvedPath);
  if (!stat.isDirectory()) {
    console.log(`❌ Error: Path is not a directory: ${resolvedPath}`);
    return null;
  }

  const skillMdPath = join(resolvedPath, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    console.log(`❌ Error: SKILL.md not found in ${resolvedPath}`);
    return null;
  }

  // Validate skill
  console.log("🔍 Validating skill...");
  const { valid, message } = validateSkill(resolvedPath);
  if (!valid) {
    console.log(`❌ Validation failed: ${message}`);
    console.log("   Please fix the validation errors before packaging.");
    return null;
  }
  console.log(`✅ ${message}\n`);

  // Determine output location
  const skillName = basename(resolvedPath);
  const outputPath = outputDir ? resolve(outputDir) : process.cwd();

  if (outputDir && !existsSync(outputPath)) {
    mkdirSync(outputPath, { recursive: true });
  }

  const skillFilename = join(outputPath, `${skillName}.skill`);

  // Create zip file using Bun's built-in zip
  try {
    const files = await getAllFiles(resolvedPath);
    const zipEntries: { path: string; data: Uint8Array }[] = [];

    for (const filePath of files) {
      const relativePath = join(skillName, relative(resolvedPath, filePath));
      const data = readFileSync(filePath);
      zipEntries.push({ path: relativePath, data });
      console.log(`  Added: ${relativePath}`);
    }

    // Use Bun's native zip writer
    const zipFile = Bun.file(skillFilename);
    const writer = zipFile.writer();

    // Create a simple zip manually or use a library
    // For now, use the 'archiver' pattern with Bun.spawn
    const { spawn } = await import("child_process");

    // Create zip using system zip command (cross-platform approach)
    const parentDir = resolve(resolvedPath, "..");
    const result = Bun.spawnSync(["zip", "-r", skillFilename, skillName], {
      cwd: parentDir,
      stdout: "pipe",
      stderr: "pipe",
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `zip command failed: ${Buffer.from(result.stderr).toString()}`
      );
    }

    console.log(`\n✅ Successfully packaged skill to: ${skillFilename}`);
    return skillFilename;
  } catch (e) {
    console.log(`❌ Error creating .skill file: ${e}`);
    return null;
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(
      "Usage: bun scripts/package-skill.ts <path/to/skill-folder> [output-directory]"
    );
    console.log("\nExamples:");
    console.log("  bun scripts/package-skill.ts ~/.claude/skills/my-skill");
    console.log("  bun scripts/package-skill.ts ~/.claude/skills/my-skill ./dist");
    process.exit(1);
  }

  const skillPath = args[0];
  const outputDir = args[1];

  console.log(`📦 Packaging skill: ${skillPath}`);
  if (outputDir) {
    console.log(`   Output directory: ${outputDir}`);
  }
  console.log();

  const result = await packageSkill(skillPath, outputDir);
  process.exit(result ? 0 : 1);
}
