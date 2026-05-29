import * as p from "@clack/prompts";
import chalk from "chalk";
import { previewSessionsFromSnapshots, unifySessionsFromSnapshots, type SessionUnifyResult } from "../lib/session-unifier.js";
import type { FolderOptions } from "../lib/folder-paths.js";

export type SessionsUnifyCommandParams = FolderOptions;

function summarizeByFolder(entries: Array<{ folder: string }>): string {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.folder, (counts.get(entry.folder) ?? 0) + 1);
  }

  if (counts.size === 0) return "none";
  return [...counts.entries()]
    .map(([folder, count]) => `${folder}: ${count}`)
    .join(", ");
}

function printPreviewList(title: string, entries: string[]) {
  if (entries.length === 0) return;
  console.log(chalk.gray(`\n${title}:`));
  for (const entry of entries.slice(0, 12)) {
    console.log(chalk.gray(`  - ${entry}`));
  }
  if (entries.length > 12) {
    console.log(chalk.gray(`  ...and ${entries.length - 12} more`));
  }
}

function printSessionUnifyPreview(result: SessionUnifyResult) {
  console.log(chalk.yellow("\nPlanned session changes"));
  console.log(chalk.gray(`  Root: ${result.rootDir}`));
  console.log(chalk.gray(`  Snapshots to scan: ${result.scannedSnapshots.length}`));
  console.log(chalk.gray(`  Sessions to import: ${result.imported.length} (${summarizeByFolder(result.imported)})`));
  console.log(chalk.gray(`  Duplicates to skip: ${result.duplicates.length}`));
  console.log(chalk.gray(`  Conflicts to preserve: ${result.conflicts.length}`));

  printPreviewList(
    "Session files/folders to import",
    result.imported.map((entry) => `${entry.from} -> ${entry.to}`),
  );
  printPreviewList(
    "Conflicting sessions to copy with source suffix",
    result.conflicts.map((entry) => `${entry.from} -> ${entry.to}`),
  );
}

async function confirmUnify(): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return true;
  }

  const answer = await p.confirm({
    message: "Continue with these session unify changes?",
    initialValue: false,
  });

  if (p.isCancel(answer)) {
    return false;
  }

  return Boolean(answer);
}

export async function sessionsUnifyCommand(params: SessionsUnifyCommandParams = {}): Promise<void> {
  try {
    console.log(chalk.blue("Unifying saved sessions from configs and backups..."));
    const preview = await previewSessionsFromSnapshots(params);
    printSessionUnifyPreview(preview);

    if (!(await confirmUnify())) {
      console.log(chalk.gray("\nSession unify cancelled"));
      return;
    }

    const result = await unifySessionsFromSnapshots(params);

    console.log(chalk.green("Session unify complete"));
    console.log(chalk.gray(`  Snapshots scanned: ${result.scannedSnapshots.length}`));
    console.log(chalk.gray(`  Imported: ${result.imported.length} (${summarizeByFolder(result.imported)})`));
    console.log(chalk.gray(`  Duplicates skipped: ${result.duplicates.length}`));
    console.log(chalk.gray(`  Conflicts preserved: ${result.conflicts.length}`));

    if (result.conflicts.length > 0) {
      console.log(chalk.yellow("\nConflicting session paths were copied with source suffixes:"));
      for (const conflict of result.conflicts.slice(0, 10)) {
        console.log(chalk.yellow(`  ${conflict.to}`));
      }
      if (result.conflicts.length > 10) {
        console.log(chalk.yellow(`  ...and ${result.conflicts.length - 10} more`));
      }
    }
  } catch (error) {
    console.error(chalk.red("Session unify failed:"), error);
    process.exit(1);
  }
}
