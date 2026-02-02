import fs from "fs-extra";
import os from "os";
import path from "path";

function getConfigDir(): string {
  const platform = os.platform();
  if (platform === "win32") {
    return path.join(process.env.APPDATA || os.homedir(), "openclaw");
  }
  return path.join(os.homedir(), ".config", "openclaw");
}

function getTokenPath(): string {
  return path.join(getConfigDir(), "token.txt");
}

export async function saveOpenclawToken(githubToken: string): Promise<void> {
  const configDir = getConfigDir();
  await fs.ensureDir(configDir);
  await fs.writeFile(getTokenPath(), githubToken, { mode: 0o600 });
}

export async function getOpenclawToken(): Promise<string | null> {
  const tokenPath = getTokenPath();
  if (await fs.pathExists(tokenPath)) {
    const token = await fs.readFile(tokenPath, "utf8");
    return token.trim();
  }
  return null;
}

export async function hasOpenclawToken(): Promise<boolean> {
  return fs.pathExists(getTokenPath());
}

export function getOpenclawTokenInfo(): { path: string; platform: string } {
  return {
    path: getTokenPath(),
    platform: os.platform(),
  };
}
