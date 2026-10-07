import fs from "fs-extra";
import os from "os";
import path from "path";

function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

function expandHome(p: string): string {
  return p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p;
}

/**
 * Enables function hooks and appends each installed mod folder to
 * CLAUDE_CODE_PLUGIN_DIRS, keeping folders the user already listed.
 */
function enableMods(env: Record<string, string>, mods: string[], claudeDir: string) {
  env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS = "1";

  const dirs = (env.CLAUDE_CODE_PLUGIN_DIRS ?? "").split(path.delimiter).filter(Boolean);
  const known = new Set(dirs.map((dir) => path.resolve(expandHome(dir))));
  for (const mod of mods) {
    const dir = path.join(claudeDir, "mods", mod);
    if (known.has(path.resolve(dir))) continue;
    dirs.push(toPosixPath(dir));
    known.add(path.resolve(dir));
  }
  env.CLAUDE_CODE_PLUGIN_DIRS = dirs.join(path.delimiter);
}

export interface SetupOptions {
  shellShortcuts: boolean;
  customStatusline: boolean;
  aiblueprintAgents: boolean;
  aiblueprintSkills: boolean;
  installCodex: boolean;
  claudeMods?: boolean;
  installedMods?: string[];
  skipInteractive?: boolean;
  replaceStatusline?: boolean;
}

export async function hasExistingStatusLine(claudeDir: string): Promise<boolean> {
  const settingsPath = path.join(claudeDir, "settings.json");
  try {
    const existingSettings = await fs.readFile(settingsPath, "utf-8");
    const settings = JSON.parse(existingSettings);
    return !!settings.statusLine;
  } catch {
    return false;
  }
}

export async function updateSettings(options: SetupOptions, claudeDir: string) {
  const settingsPath = path.join(claudeDir, "settings.json");
  let settings: any = {};

  try {
    const existingSettings = await fs.readFile(settingsPath, "utf-8");
    settings = JSON.parse(existingSettings);
  } catch {
  }

  if (options.customStatusline) {
    const shouldReplace = options.replaceStatusline !== false;

    if (shouldReplace) {
      settings.statusLine = {
        type: "command",
        command: `bun ${toPosixPath(path.join(claudeDir, "scripts/statusline/src/index.ts"))}`,
        padding: 0,
      };
    }
  }

  if (!settings.env || typeof settings.env !== "object" || Array.isArray(settings.env)) {
    settings.env = {};
  }

  // Older Premium configs forced the Sonnet alias onto paid 1M context.
  // Remove only that historical value so custom model mappings stay untouched.
  if (
    settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL ===
    "claude-sonnet-4-6[1m]"
  ) {
    delete settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL;
  }
  settings.env.CLAUDE_CODE_DISABLE_1M_CONTEXT = "1";

  if (options.installedMods && options.installedMods.length > 0) {
    enableMods(settings.env, options.installedMods, claudeDir);
  }

  if (!settings.permissions) {
    settings.permissions = {};
  }
  settings.permissions.defaultMode = "bypassPermissions";
  if (!settings.permissions.deny) {
    settings.permissions.deny = [];
  }
  const denyRules = [
    "Bash(rm -rf *)",
    "Bash(sudo *)",
    "Bash(curl * | bash)",
    "Bash(wget * | bash)",
    "Read(./.env)",
    "Read(./.env.*)",
  ];
  for (const rule of denyRules) {
    if (!settings.permissions.deny.includes(rule)) {
      settings.permissions.deny.push(rule);
    }
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}
