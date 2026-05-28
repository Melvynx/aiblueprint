#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type HookPayload = {
  tool_input?: {
    command?: unknown;
  };
};

type ClaudeSettings = {
  permissions?: {
    deny?: unknown;
  };
};

const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");
const FALLBACK_DENY_PATTERNS = [
  "Bash(rm -rf *)",
  "Bash(sudo *)",
  "Bash(mkfs *)",
  "Bash(dd *)",
  "Bash(git push --force *)",
  "Bash(git reset --hard *)",
  "Bash(*prisma reset*)",
  "Bash(curl * | bash)",
  "Bash(wget * | bash)",
];

const BLOCK_REASON =
  "Blocked by Codex command safety rules. Use a safer alternative or ask the user.";
const TOKEN_BOUNDARY = String.raw`(?:^|[\s"'([{<])`;
const GH_COMMAND_PREFIX = String.raw`(?:(?:command|builtin|env)\s+(?:[A-Za-z_][A-Za-z0-9_]*=(?:\S+)\s+)*)?`;
const EXECUTABLE_PATH_PREFIX = String.raw`(?:\S*/)?`;

function getCommand(payload: HookPayload): string {
  const command = payload.tool_input?.command;
  return typeof command === "string" ? command : "";
}

function readClaudeDenyPatterns(): string[] {
  try {
    const settings = JSON.parse(
      readFileSync(CLAUDE_SETTINGS_PATH, "utf8"),
    ) as ClaudeSettings;
    const deny = settings.permissions?.deny;

    if (Array.isArray(deny)) {
      return deny.filter((pattern): pattern is string => typeof pattern === "string");
    }
  } catch {
    return FALLBACK_DENY_PATTERNS;
  }

  return FALLBACK_DENY_PATTERNS;
}

function extractBashPattern(pattern: string): string | null {
  const match = pattern.match(/^Bash\((.*)\)$/);
  return match?.[1] ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globPatternToRegExp(pattern: string): RegExp {
  const normalized = normalizeWhitespace(pattern);
  const regex = normalized
    .split("*")
    .map(escapeRegExp)
    .join(".*")
    .replaceAll(" ", "\\s+");

  return new RegExp(`^${regex}$`, "i");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
}

function commandCandidates(command: string): string[] {
  const normalized = normalizeWhitespace(command);
  const segments = normalized
    .split(/\s*(?:&&|\|\||;)\s*/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return [...new Set([normalized, ...segments])];
}

function containsForcedRecursiveRm(command: string): boolean {
  const rmInvocations = normalizeWhitespace(command).matchAll(
    /\brm\b(?<args>[^\n;&|()]*)/gi,
  );

  for (const match of rmInvocations) {
    const args = match.groups?.args ?? "";
    const shortOptions = [...args.matchAll(/(?<!\S)-([A-Za-z]+)\b/g)].map(
      (optionMatch) => optionMatch[1] ?? "",
    );

    let hasRecursive = shortOptions.some((option) =>
      option.toLowerCase().includes("r"),
    );
    let hasForce = shortOptions.some((option) =>
      option.toLowerCase().includes("f"),
    );

    const longOptions = new Set(
      [...args.matchAll(/--([A-Za-z-]+)\b/g)].map(
        (optionMatch) => optionMatch[1] ?? "",
      ),
    );

    hasRecursive ||= longOptions.has("recursive") || longOptions.has("dir");
    hasForce ||= longOptions.has("force");

    if (hasRecursive && hasForce) {
      return true;
    }
  }

  return false;
}

function containsPullRequestMergeCommand(command: string): boolean {
  const matcher = new RegExp(
    `${TOKEN_BOUNDARY}${GH_COMMAND_PREFIX}${EXECUTABLE_PATH_PREFIX}gh\\s+pr\\s+merge(?:\\s|$)`,
    "i",
  );

  return commandCandidates(command).some((candidate) => matcher.test(candidate));
}

function matchesImportedDenyPattern(command: string, patterns: string[]): boolean {
  const candidates = commandCandidates(command);

  for (const pattern of patterns) {
    const bashPattern = extractBashPattern(pattern);
    if (!bashPattern) {
      continue;
    }

    const matcher = globPatternToRegExp(bashPattern);
    if (candidates.some((candidate) => matcher.test(candidate))) {
      return true;
    }
  }

  return false;
}

function deny(): void {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: BLOCK_REASON,
      },
      decision: "block",
      reason: BLOCK_REASON,
    }),
  );
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  const input = await readStdin();
  if (!input.trim()) {
    return;
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(input) as HookPayload;
  } catch {
    return;
  }

  const command = getCommand(payload);
  if (
    containsForcedRecursiveRm(command) ||
    containsPullRequestMergeCommand(command) ||
    matchesImportedDenyPattern(command, readClaudeDenyPatterns())
  ) {
    deny();
  }
}

await main();
