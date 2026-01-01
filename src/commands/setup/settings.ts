import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";

export interface SetupOptions {
  shellShortcuts: boolean;
  commandValidation: boolean;
  customStatusline: boolean;
  aiblueprintCommands: boolean;
  aiblueprintAgents: boolean;
  aiblueprintSkills: boolean;
  notificationSounds: boolean;
  postEditTypeScript: boolean;
  codexSymlink: boolean;
  openCodeSymlink: boolean;
}

export async function updateSettings(options: SetupOptions, claudeDir: string, skipInteractive = false) {
  const settingsPath = path.join(claudeDir, "settings.json");
  let settings: any = {};

  try {
    const existingSettings = await fs.readFile(settingsPath, "utf-8");
    settings = JSON.parse(existingSettings);
  } catch {
    // Settings file doesn't exist or is invalid
  }

  if (options.customStatusline) {
    if (settings.statusLine && !skipInteractive) {
      const confirmAnswer = await inquirer.prompt([
        {
          type: "confirm",
          name: "replace",
          message: "You already have a statusLine configuration. Replace it?",
        },
      ]);

      if (!confirmAnswer.replace) {
        console.log(
          chalk.yellow("  Keeping existing statusLine configuration"),
        );
      } else {
        settings.statusLine = {
          type: "command",
          command: `bun ${path.join(claudeDir, "scripts/statusline/src/index.ts")}`,
          padding: 0,
        };
      }
    } else {
      settings.statusLine = {
        type: "command",
        command: `bun ${path.join(claudeDir, "scripts/statusline/src/index.ts")}`,
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
          command: `bun ${path.join(claudeDir, "scripts/command-validator/src/cli.ts")}`,
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
    if (!settings.hooks.Stop) {
      settings.hooks.Stop = [];
    }

    const stopHook = {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `afplay -v 0.1 ${path.join(claudeDir, "song/finish.mp3")}`,
        },
      ],
    };

    const existingStopHook = settings.hooks.Stop.find((h: any) =>
      h.hooks?.some((hook: any) => hook.command?.includes("finish.mp3")),
    );
    if (!existingStopHook) {
      settings.hooks.Stop.push(stopHook);
    }

    if (!settings.hooks.Notification) {
      settings.hooks.Notification = [];
    }

    const notificationHook = {
      matcher: "",
      hooks: [
        {
          type: "command",
          command: `afplay -v 0.1 ${path.join(claudeDir, "song/need-human.mp3")}`,
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

  if (options.postEditTypeScript) {
    if (!settings.hooks.PostToolUse) {
      settings.hooks.PostToolUse = [];
    }

    const postEditHook = {
      matcher: "Edit|Write|MultiEdit",
      hooks: [
        {
          type: "command",
          command: `bun ${path.join(claudeDir, "scripts/hook-post-file.ts")}`,
        },
      ],
    };

    const existingPostEditHook = settings.hooks.PostToolUse.find(
      (h: any) =>
        h.matcher === "Edit|Write|MultiEdit" &&
        h.hooks?.some((hook: any) => hook.command?.includes("hook-post-file.ts")),
    );
    if (!existingPostEditHook) {
      settings.hooks.PostToolUse.push(postEditHook);
    }
  }

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}
