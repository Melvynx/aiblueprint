import fs from "fs-extra";
import path from "path";

export interface ScriptCommand {
  prefix: string;
  action: string;
  fullScriptName: string;
}

const EXCLUDED_SCRIPTS = ["test", "lint", "format", "start"];
const EXCLUDED_SUFFIXES = [":test", ":lint", ":test-fixtures", ":start"];

function shouldIncludeScript(scriptName: string): boolean {
  if (EXCLUDED_SCRIPTS.includes(scriptName)) return false;
  if (EXCLUDED_SUFFIXES.some((suffix) => scriptName.endsWith(suffix)))
    return false;
  return true;
}

export async function readScriptsPackageJson(
  claudeDir: string,
): Promise<Record<string, string> | null> {
  const packageJsonPath = path.join(claudeDir, "scripts", "package.json");

  try {
    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    const content = await fs.readFile(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content);

    return parsed.scripts || null;
  } catch (error) {
    if (process.env.DEBUG) {
      console.error("Failed to read scripts package.json:", error);
    }
    return null;
  }
}

export function parseScriptCommands(
  scripts: Record<string, string>,
): ScriptCommand[] {
  const commands: ScriptCommand[] = [];

  for (const scriptName of Object.keys(scripts)) {
    if (!shouldIncludeScript(scriptName)) {
      continue;
    }

    if (!scriptName.includes(":")) {
      continue;
    }

    const [prefix, ...actionParts] = scriptName.split(":");
    const action = actionParts.join(":");

    if (!action) {
      continue;
    }

    commands.push({
      prefix,
      action,
      fullScriptName: scriptName,
    });
  }

  return commands;
}

export function groupScriptsByPrefix(
  commands: ScriptCommand[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const command of commands) {
    if (!groups[command.prefix]) {
      groups[command.prefix] = [];
    }
    groups[command.prefix].push(command.action);
  }

  return groups;
}
