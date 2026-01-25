#!/usr/bin/env bun
/**
 * Skill Validator - Validates skill structure and frontmatter
 *
 * Usage:
 *   bun scripts/validate.ts <skill-directory>
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { parse as parseYaml } from "yaml";

const ALLOWED_PROPERTIES = new Set([
  "name",
  "description",
  "license",
  "metadata",
  "allowed-tools",
  "disable-model-invocation",
  "user-invocable",
  "argument-hint",
  "model",
  "context",
  "agent",
  "hooks",
]);

interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateSkill(skillPath: string): ValidationResult {
  const skillMdPath = join(skillPath, "SKILL.md");

  if (!existsSync(skillMdPath)) {
    return { valid: false, message: "SKILL.md not found" };
  }

  const content = readFileSync(skillMdPath, "utf-8");

  if (!content.startsWith("---")) {
    return { valid: false, message: "No YAML frontmatter found" };
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { valid: false, message: "Invalid frontmatter format" };
  }

  let frontmatter: Record<string, unknown>;
  try {
    frontmatter = parseYaml(frontmatterMatch[1]);
    if (typeof frontmatter !== "object" || frontmatter === null) {
      return { valid: false, message: "Frontmatter must be a YAML dictionary" };
    }
  } catch (e) {
    return { valid: false, message: `Invalid YAML in frontmatter: ${e}` };
  }

  const unexpectedKeys = Object.keys(frontmatter).filter(
    (key) => !ALLOWED_PROPERTIES.has(key)
  );
  if (unexpectedKeys.length > 0) {
    return {
      valid: false,
      message: `Unexpected key(s) in frontmatter: ${unexpectedKeys.join(", ")}. Allowed: ${[...ALLOWED_PROPERTIES].sort().join(", ")}`,
    };
  }

  const name = frontmatter.name;
  if (name !== undefined) {
    if (typeof name !== "string") {
      return { valid: false, message: `Name must be a string` };
    }
    const trimmedName = name.trim();
    if (trimmedName) {
      if (!/^[a-z0-9-]+$/.test(trimmedName)) {
        return {
          valid: false,
          message: `Name '${trimmedName}' should be hyphen-case (lowercase letters, digits, and hyphens only)`,
        };
      }
      if (
        trimmedName.startsWith("-") ||
        trimmedName.endsWith("-") ||
        trimmedName.includes("--")
      ) {
        return {
          valid: false,
          message: `Name '${trimmedName}' cannot start/end with hyphen or contain consecutive hyphens`,
        };
      }
      if (trimmedName.length > 64) {
        return {
          valid: false,
          message: `Name is too long (${trimmedName.length} characters). Maximum is 64 characters.`,
        };
      }
    }
  }

  const description = frontmatter.description;
  if (description !== undefined) {
    if (typeof description !== "string") {
      return { valid: false, message: `Description must be a string` };
    }
    const trimmedDesc = description.trim();
    if (trimmedDesc) {
      if (trimmedDesc.includes("<") || trimmedDesc.includes(">")) {
        return {
          valid: false,
          message: "Description cannot contain angle brackets (< or >)",
        };
      }
      if (trimmedDesc.length > 1024) {
        return {
          valid: false,
          message: `Description is too long (${trimmedDesc.length} characters). Maximum is 1024 characters.`,
        };
      }
    }
  }

  return { valid: true, message: "Skill is valid!" };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log("Usage: bun scripts/validate.ts <skill_directory>");
    process.exit(1);
  }

  const { valid, message } = validateSkill(args[0]);
  console.log(message);
  process.exit(valid ? 0 : 1);
}
