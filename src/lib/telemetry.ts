import os from "os";
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
    ? error.stack?.slice(0, 500)
    : undefined;

  trackEvent("error", {
    message,
    stack,
    ...context,
  });
}

export async function flushTelemetry() {
  if (pendingRequest) {
    await pendingRequest;
  }
}
