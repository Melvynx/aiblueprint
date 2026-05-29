import chalk from "chalk";
import { unifySessionsFromSnapshots } from "../lib/session-unifier.js";
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

export async function sessionsUnifyCommand(params: SessionsUnifyCommandParams = {}): Promise<void> {
  try {
    console.log(chalk.blue("Unifying saved sessions from configs and backups..."));
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
