import os from "os";
import { execSync } from "child_process";

const SHELL_UNSAFE_CHARS = /[;&|`$(){}[\]<>*?!#~'"\\]/;

export function isPathSafeForShell(p: string): boolean {
  return !SHELL_UNSAFE_CHARS.test(p);
}

function escapeShellArg(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export interface PlatformInfo {
  platform: NodeJS.Platform;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  isWSL: boolean;
  homeDir: string;
}

let cachedPlatformInfo: PlatformInfo | null = null;
let cachedAudioPlayer: string | null | undefined = undefined;

export function isWSL(): boolean {
  if (os.platform() !== "linux") return false;
  const release = os.release().toLowerCase();
  return release.includes("microsoft") || release.includes("wsl");
}

export function getPlatformInfo(): PlatformInfo {
  if (cachedPlatformInfo) return cachedPlatformInfo;

  const platform = os.platform();
  const wsl = isWSL();

  cachedPlatformInfo = {
    platform,
    isWindows: platform === "win32",
    isMacOS: platform === "darwin",
    isLinux: platform === "linux" && !wsl,
    isWSL: wsl,
    homeDir: os.homedir(),
  };

  return cachedPlatformInfo;
}

export function detectAudioPlayer(): string | null {
  if (cachedAudioPlayer !== undefined) return cachedAudioPlayer;

  const platform = os.platform();

  if (platform === "darwin") {
    cachedAudioPlayer = "afplay";
    return cachedAudioPlayer;
  }

  if (platform === "win32") {
    cachedAudioPlayer = "powershell";
    return cachedAudioPlayer;
  }

  const linuxPlayers = ["paplay", "aplay", "mpv", "ffplay"];
  for (const player of linuxPlayers) {
    try {
      execSync(`which ${player}`, { stdio: "ignore" });
      cachedAudioPlayer = player;
      return cachedAudioPlayer;
    } catch {
      continue;
    }
  }

  cachedAudioPlayer = null;
  return cachedAudioPlayer;
}

export function getPlaySoundCommand(soundPath: string): string | null {
  const player = detectAudioPlayer();
  if (!player) return null;

  const platform = os.platform();
  const safePath = escapeShellArg(soundPath);

  if (platform === "darwin") {
    return `afplay -v 0.1 ${safePath}`;
  }

  if (platform === "win32") {
    const escapedPath = soundPath.replace(/'/g, "''");
    return `powershell -c "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()"`;
  }

  switch (player) {
    case "paplay":
      return `paplay ${safePath} 2>/dev/null || true`;
    case "aplay":
      return `aplay ${safePath} 2>/dev/null || true`;
    case "mpv":
      return `mpv --no-video --volume=10 ${safePath} 2>/dev/null || true`;
    case "ffplay":
      return `ffplay -nodisp -autoexit -volume 10 ${safePath} 2>/dev/null || true`;
    default:
      return null;
  }
}

const KNOWN_CLAUDE_PATHS = [
  /\/Users\/[^/]+\/\.claude\//,
  /\/home\/[^/]+\/\.claude\//,
  /C:\\Users\\[^\\]+\\\.claude\\/i,
];

export function transformHookCommand(command: string, claudeDir: string): string {
  let transformed = command;

  for (const pattern of KNOWN_CLAUDE_PATHS) {
    transformed = transformed.replace(pattern, `${claudeDir}/`);
  }

  transformed = transformed.replace(/\\/g, "/");

  return transformed;
}

export function transformHook(hook: any, claudeDir: string): any {
  if (!hook) return hook;

  const transformed = { ...hook };

  if (transformed.command && typeof transformed.command === "string") {
    transformed.command = transformHookCommand(transformed.command, claudeDir);
  }

  if (Array.isArray(transformed.hooks)) {
    transformed.hooks = transformed.hooks.map((h: any) => transformHook(h, claudeDir));
  }

  return transformed;
}
