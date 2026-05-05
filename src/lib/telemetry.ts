import os from "os";
import fs from "fs";
import path from "path";
import { getVersion } from "./version.js";

const TELEMETRY_URL = "https://codelynx.dev/api/cli/events";

const isDisabled = () => {
  return process.env.AIBLUEPRINT_TELEMETRY_DISABLED === "1";
};

const getBasePayload = () => ({
  cliVersion: getVersion(),
  platform: os.platform(),
  arch: os.arch(),
  nodeVersion: process.version,
});

function getTokenFilePath(): string {
  const homeDir = os.homedir();
  if (os.platform() === "win32") {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    return path.join(appData, "aiblueprint", "token.txt");
  }
  const configHome = process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config");
  return path.join(configHome, "aiblueprint", "token.txt");
}

function getSystemInfo(): Record<string, unknown> {
  let hasProToken = false;
  try {
    hasProToken = fs.existsSync(getTokenFilePath());
  } catch {}

  return {
    osVersion: os.release(),
    osType: os.type(),
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))}GB`,
    cpus: os.cpus().length,
    shell: process.env.SHELL || process.env.COMSPEC || "unknown",
    homeDir: os.homedir(),
    locale: process.env.LANG || process.env.LC_ALL || "unknown",
    hasProToken,
  };
}

let pendingRequest: Promise<void> | null = null;

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (isDisabled()) return;

  const payload = {
    ...getBasePayload(),
    event,
    data,
  };

  pendingRequest = fetch(TELEMETRY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  })
    .catch(() => {})
    .then(() => {
      pendingRequest = null;
    });
}

export function trackError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (isDisabled()) return;

  const message =
    error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error
    ? error.stack?.slice(0, 1500)
    : undefined;

  trackEvent("error", {
    message,
    stack,
    ...getSystemInfo(),
    ...context,
  });
}

export async function flushTelemetry() {
  if (pendingRequest) {
    await pendingRequest;
  }
}
