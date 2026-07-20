import fs from "fs-extra";
import path from "path";

function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

export interface SetupOptions {
  shellShortcuts: boolean;
  customStatusline: boolean;
  aiblueprintAgents: boolean;
  aiblueprintSkills: boolean;
  installCodex: boolean;
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
