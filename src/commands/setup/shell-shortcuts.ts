import fs from "fs-extra";
import path from "path";
import os from "os";
import chalk from "chalk";

type ShortcutBlock = {
  legacyHeaders: string[];
  commandLines: string[];
  lines: string[];
};

const BEGIN_MARKER = "# BEGIN AIBlueprint shell shortcuts";
const END_MARKER = "# END AIBlueprint shell shortcuts";

const POSIX_COMMAND_LINES = [
  'alias cc="claude --dangerously-skip-permissions"',
  'alias ccc="claude --dangerously-skip-permissions -c"',
  'alias cx="codex"',
  'alias cxc="codex resume --last"',
];

const POWERSHELL_COMMAND_LINES = [
  "function cc { claude --dangerously-skip-permissions $args }",
  "function ccc { claude --dangerously-skip-permissions -c $args }",
  "function cx { codex $args }",
  "function cxc { codex resume --last $args }",
];

const POSIX_SHORTCUT_BLOCK: ShortcutBlock = {
  legacyHeaders: [
    "# AIBlueprint Claude Code aliases",
    "# AIBlueprint Codex aliases",
  ],
  commandLines: POSIX_COMMAND_LINES,
  lines: [
    BEGIN_MARKER,
    "# Claude Code",
    POSIX_COMMAND_LINES[0],
    POSIX_COMMAND_LINES[1],
    "# Codex",
    POSIX_COMMAND_LINES[2],
    POSIX_COMMAND_LINES[3],
    END_MARKER,
  ],
};

const POWERSHELL_SHORTCUT_BLOCK: ShortcutBlock = {
  legacyHeaders: [
    "# AIBlueprint Claude Code shortcuts",
    "# AIBlueprint Codex shortcuts",
  ],
  commandLines: POWERSHELL_COMMAND_LINES,
  lines: [
    BEGIN_MARKER,
    "# Claude Code",
    POWERSHELL_COMMAND_LINES[0],
    POWERSHELL_COMMAND_LINES[1],
    "# Codex",
    POWERSHELL_COMMAND_LINES[2],
    POWERSHELL_COMMAND_LINES[3],
    END_MARKER,
  ],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectEol(content: string): string {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function upsertShortcutBlock(
  existingContent: string,
  shortcutBlock: ShortcutBlock,
): string {
  const eol = detectEol(existingContent);
  const managedBlockPattern = new RegExp(
    `${escapeRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}\\r?\\n?`,
    "g",
  );
  const removableLegacyLines = new Set([
    ...shortcutBlock.legacyHeaders,
    ...shortcutBlock.commandLines,
  ]);
  const existingWithoutManagedBlock = existingContent.replace(
    managedBlockPattern,
    "",
  );
  const existingLines = existingWithoutManagedBlock
    .split(/\r?\n/)
    .filter((line) => !removableLegacyLines.has(line.trim()));
  const baseContent = existingLines.join(eol).trimEnd();
  const blockContent = shortcutBlock.lines.join(eol);

  return `${baseContent}${baseContent ? `${eol}${eol}` : ""}${blockContent}${eol}`;
}

export async function setupShellShortcuts() {
  try {
    const platform = os.platform();
    let shellConfigFile: string;
    let shortcutBlock: ShortcutBlock;

    if (platform === "darwin") {
      shellConfigFile = path.join(os.homedir(), ".zshenv");
      shortcutBlock = POSIX_SHORTCUT_BLOCK;
    } else if (platform === "linux") {
      const shell = process.env.SHELL || "";
      if (shell.includes("zsh")) {
        shellConfigFile = path.join(os.homedir(), ".zshrc");
      } else {
        shellConfigFile = path.join(os.homedir(), ".bashrc");
      }
      shortcutBlock = POSIX_SHORTCUT_BLOCK;
    } else if (platform === "win32") {
      const pwshProfileDir = path.join(
        os.homedir(),
        "Documents",
        "PowerShell",
      );
      const windowsPwshProfileDir = path.join(
        os.homedir(),
        "Documents",
        "WindowsPowerShell",
      );

      let profileDir: string;
      if (await fs.pathExists(pwshProfileDir)) {
        profileDir = pwshProfileDir;
      } else if (await fs.pathExists(windowsPwshProfileDir)) {
        profileDir = windowsPwshProfileDir;
      } else {
        profileDir = pwshProfileDir;
        await fs.ensureDir(profileDir);
      }

      shellConfigFile = path.join(profileDir, "Profile.ps1");
      shortcutBlock = POWERSHELL_SHORTCUT_BLOCK;
    } else {
      console.log(
        chalk.yellow(
          `Shell shortcuts are not supported on platform: ${platform}`,
        ),
      );
      return;
    }

    const existingContent = await fs
      .readFile(shellConfigFile, "utf-8")
      .catch(() => "");

    const nextContent = upsertShortcutBlock(existingContent, shortcutBlock);

    if (nextContent !== existingContent) {
      await fs.writeFile(shellConfigFile, nextContent);
    }
  } catch (error) {
    console.error(chalk.red("Error setting up shell shortcuts:"), error);
    throw error;
  }
}
