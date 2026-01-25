#!/usr/bin/env bun
/**
 * Skill Initializer - Creates a new skill from template
 *
 * Usage:
 *   bun scripts/init-skill.ts <skill-name> --path <path>
 *
 * Examples:
 *   bun scripts/init-skill.ts my-new-skill --path ~/.claude/skills
 *   bun scripts/init-skill.ts my-api-helper --path .claude/skills
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import { join, resolve } from "path";

const SKILL_TEMPLATE = `---
name: {skill_name}
description: [TODO: What the skill does and when to use it. Include trigger phrases like "use when..." or specific scenarios.]
---

# {skill_title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Quick Start

[TODO: Immediate, actionable guidance - minimal working example]

## Workflow

[TODO: Step-by-step procedures if applicable]

## Resources

This skill includes example resource directories:

### scripts/
Executable code (TypeScript/Python/Bash) for automation tasks.

### references/
Documentation loaded into context as needed. Keep SKILL.md lean (<500 lines) and move detailed content here.

### assets/
Files used in output (templates, images, fonts) - not loaded into context.

---

**Delete unused directories.** Not every skill needs all three resource types.
`;

const EXAMPLE_SCRIPT = `#!/usr/bin/env bun
/**
 * Example helper script for {skill_name}
 *
 * Replace with actual implementation or delete if not needed.
 */

function main() {
  console.log("This is an example script for {skill_name}");
  // TODO: Add actual script logic here
}

main();
`;

const EXAMPLE_REFERENCE = `# Reference Documentation for {skill_title}

This is a placeholder for detailed reference documentation.
Replace with actual content or delete if not needed.

## When Reference Docs Are Useful

- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content only needed for specific use cases

## Structure Suggestions

### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
`;

const EXAMPLE_ASSET = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual assets (templates, images, fonts) or delete if not needed.

Asset files are NOT loaded into context - they're used in Claude's output.

## Common Asset Types

- Templates: .pptx, .docx, boilerplate directories
- Images: .png, .jpg, .svg
- Fonts: .ttf, .woff2
- Boilerplate: Project directories, starter files
- Data: .csv, .json sample files
`;

function titleCase(skillName: string): string {
  return skillName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initSkill(skillName: string, basePath: string): string | null {
  const skillDir = resolve(basePath, skillName);

  if (existsSync(skillDir)) {
    console.log(`❌ Error: Skill directory already exists: ${skillDir}`);
    return null;
  }

  try {
    mkdirSync(skillDir, { recursive: true });
    console.log(`✅ Created skill directory: ${skillDir}`);
  } catch (e) {
    console.log(`❌ Error creating directory: ${e}`);
    return null;
  }

  const skillTitle = titleCase(skillName);

  // Create SKILL.md
  const skillContent = SKILL_TEMPLATE.replace(/{skill_name}/g, skillName).replace(
    /{skill_title}/g,
    skillTitle
  );
  const skillMdPath = join(skillDir, "SKILL.md");
  try {
    writeFileSync(skillMdPath, skillContent);
    console.log("✅ Created SKILL.md");
  } catch (e) {
    console.log(`❌ Error creating SKILL.md: ${e}`);
    return null;
  }

  try {
    // Create scripts/
    const scriptsDir = join(skillDir, "scripts");
    mkdirSync(scriptsDir);
    const exampleScript = join(scriptsDir, "example.ts");
    writeFileSync(
      exampleScript,
      EXAMPLE_SCRIPT.replace(/{skill_name}/g, skillName)
    );
    chmodSync(exampleScript, 0o755);
    console.log("✅ Created scripts/example.ts");

    // Create references/
    const referencesDir = join(skillDir, "references");
    mkdirSync(referencesDir);
    writeFileSync(
      join(referencesDir, "api-reference.md"),
      EXAMPLE_REFERENCE.replace(/{skill_title}/g, skillTitle)
    );
    console.log("✅ Created references/api-reference.md");

    // Create assets/
    const assetsDir = join(skillDir, "assets");
    mkdirSync(assetsDir);
    writeFileSync(join(assetsDir, "example-asset.txt"), EXAMPLE_ASSET);
    console.log("✅ Created assets/example-asset.txt");
  } catch (e) {
    console.log(`❌ Error creating resource directories: ${e}`);
    return null;
  }

  console.log(`\n✅ Skill '${skillName}' initialized at ${skillDir}`);
  console.log("\nNext steps:");
  console.log("1. Edit SKILL.md to complete the TODO items");
  console.log("2. Customize or delete example files in scripts/, references/, assets/");
  console.log("3. Run validator: bun scripts/validate.ts " + skillDir);

  return skillDir;
}

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length < 3 || args[1] !== "--path") {
    console.log("Usage: bun scripts/init-skill.ts <skill-name> --path <path>");
    console.log("\nSkill name requirements:");
    console.log("  - Hyphen-case (e.g., 'data-analyzer')");
    console.log("  - Lowercase letters, digits, and hyphens only");
    console.log("  - Max 64 characters");
    console.log("\nExamples:");
    console.log("  bun scripts/init-skill.ts my-skill --path ~/.claude/skills");
    console.log("  bun scripts/init-skill.ts api-helper --path .claude/skills");
    process.exit(1);
  }

  const skillName = args[0];
  const basePath = args[2];

  console.log(`🚀 Initializing skill: ${skillName}`);
  console.log(`   Location: ${basePath}\n`);

  const result = initSkill(skillName, basePath);
  process.exit(result ? 0 : 1);
}
