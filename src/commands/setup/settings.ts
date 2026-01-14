import fs from "fs-extra";
import path from "path";
import { getPlaySoundCommand } from "../../lib/platform.js";

function toPosixPath(p: string): string {
  return p.replace(/\\/g, "/");
}

export interface SetupOptions {
  shellShortcuts: boolean;
  commandValidation: boolean;
  customStatusline: boolean;
  aiblueprintCommands: boolean;
  aiblueprintAgents: boolean;
  aiblueprintSkills: boolean;
  notificationSounds: boolean;
  codexSymlink: boolean;
  openCodeSymlink: boolean;
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
    // Settings file doesn't exist or is invalid
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

  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (options.commandValidation) {
    if (!settings.hooks.PreToolUse) {
      settings.hooks.PreToolUse = [];
    }

    const bashHook = {
      matcher: "Bash",
      hooks: [
        {
          type: "command",
          command: `bun ${toPosixPath(path.join(claudeDir, "scripts/command-validator/src/cli.ts"))}`,
        },
      ],
    };

    const existingBashHook = settings.hooks.PreToolUse.find(
      (h: any) => h.matcher === "Bash",
    );
    if (!existingBashHook) {
      settings.hooks.PreToolUse.push(bashHook);
    }
  }

  if (options.notificationSounds) {
    const finishSoundPath = toPosixPath(path.join(claudeDir, "song/finish.mp3"));
    const finishSoundCommand = getPlaySoundCommand(finishSoundPath);

    if (finishSoundCommand) {
      if (!settings.hooks.Stop) {
        settings.hooks.Stop = [];
      }

      const stopHook = {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: finishSoundCommand,
          },
        ],
      };

      const existingStopHook = settings.hooks.Stop.find((h: any) =>
        h.hooks?.some((hook: any) => hook.command?.includes("finish.mp3")),
      );
      if (!existingStopHook) {
        settings.hooks.Stop.push(stopHook);
      }
    }

    const needHumanSoundPath = toPosixPath(path.join(claudeDir, "song/need-human.mp3"));
    const needHumanSoundCommand = getPlaySoundCommand(needHumanSoundPath);

    if (needHumanSoundCommand) {
      if (!settings.hooks.Notification) {
        settings.hooks.Notification = [];
      }

      const notificationHook = {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: needHumanSoundCommand,
          },
        ],
      };

      const existingNotificationHook = settings.hooks.Notification.find(
        (h: any) =>
          h.hooks?.some((hook: any) => hook.command?.includes("need-human.mp3")),
      );
      if (!existingNotificationHook) {
        settings.hooks.Notification.push(notificationHook);
      }
    }
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}
