import fs from "fs-extra";
import os from "os";
import path from "path";

/**
 * Get the config directory based on platform
 * - macOS/Linux: ~/.config/aiblueprint/
 * - Windows: %APPDATA%/aiblueprint/
 */
export function getConfigDir(): string {
  const platform = os.platform();

  if (platform === "win32") {
    // Windows: C:\Users\Username\AppData\Roaming\aiblueprint
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "aiblueprint");
  } else {
    // macOS/Linux: ~/.config/aiblueprint
    const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
    return path.join(configHome, "aiblueprint");
  }
}

/**
 * Get the path to the token file
 */
export function getTokenFilePath(): string {
  return path.join(getConfigDir(), "token.txt");
}

/**
 * Save GitHub token to file
 */
export async function saveToken(githubToken: string): Promise<void> {
  const tokenFile = getTokenFilePath();
  const configDir = path.dirname(tokenFile);

  try {
    await fs.ensureDir(configDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      throw new Error(
        `Permission denied creating config directory: ${configDir}\n` +
        `Please create the directory manually: mkdir -p ${configDir}`
      );
    }
    throw error;
  }

  await fs.writeFile(tokenFile, githubToken, { mode: 0o600 });
}

/**
 * Read GitHub token from file
 * Returns null if file doesn't exist
 */
export async function getToken(): Promise<string | null> {
  const tokenFile = getTokenFilePath();

  if (!(await fs.pathExists(tokenFile))) {
    return null;
  }

  try {
    const token = await fs.readFile(tokenFile, "utf-8");
    return token.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if token exists
 */
export async function hasToken(): Promise<boolean> {
  const token = await getToken();
  return token !== null && token.length > 0;
}

/**
 * Delete token file
 */
export async function deleteToken(): Promise<void> {
  const tokenFile = getTokenFilePath();
  if (await fs.pathExists(tokenFile)) {
    await fs.remove(tokenFile);
  }
}

/**
 * Get token info for display
 */
export function getTokenInfo(): { path: string; platform: string } {
  return {
    path: getTokenFilePath(),
    platform: os.platform(),
  };
}
