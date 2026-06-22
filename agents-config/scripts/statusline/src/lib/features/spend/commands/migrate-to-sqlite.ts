#!/usr/bin/env bun

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDb, upsertPeriod, upsertSession } from "../database";

interface OldSpendSession {
	id: string;
	cost: number;
	date: string;
	duration_ms: number;
	lines_added: number;
	lines_removed: number;
	cwd: string;
	last_resets_at?: string;
}

interface OldSpendData {
	sessions: OldSpendSession[];
}

interface OldDailyUsageEntry {
	date: string;
	utilization: number;
	resets_at: string;
	timestamp: number;
	period_cost: number;
}

async function loadOldSpendData(): Promise<OldSpendData | null> {
	const projectRoot = join(import.meta.dir, "..", "..", "..", "..", "..");
	const spendFile = join(projectRoot, "data", "spend.json");

	if (!existsSync(spendFile)) {
		console.log("No spend.json found, skipping session migration");
		return null;
	}

	const content = await readFile(spendFile, "utf-8");
	return JSON.parse(content);
}

async function loadOldDailyUsage(): Promise<OldDailyUsageEntry[]> {
	const projectRoot = join(import.meta.dir, "..", "..", "..", "..", "..");
	const dailyUsageFile = join(projectRoot, "data", "daily-usage.json");

	if (!existsSync(dailyUsageFile)) {
		console.log("No daily-usage.json found, skipping period migration");
		return [];
	}

	const content = await readFile(dailyUsageFile, "utf-8");
	return JSON.parse(content);
}

async function migrate() {
	console.log("🔄 Starting migration to SQLite...\n");

	const db = getDb();
	console.log("✅ Database initialized\n");

	const oldSpendData = await loadOldSpendData();
	if (oldSpendData) {
		console.log(`📦 Migrating ${oldSpendData.sessions.length} sessions...`);

		let migrated = 0;
		let skipped = 0;

		for (const session of oldSpendData.sessions) {
			try {
				upsertSession({
					session_id: session.id,
					total_cost: session.cost,
					cwd: session.cwd,
					date: session.date,
					duration_ms: session.duration_ms,
					lines_added: session.lines_added,
					lines_removed: session.lines_removed,
					last_resets_at: session.last_resets_at ?? null,
					cumulative_counted: 0,
				});
				migrated++;
			} catch (error) {
				console.error(`  ❌ Failed to migrate session ${session.id}:`, error);
				skipped++;
			}
		}

		console.log(`  ✅ Migrated: ${migrated}`);
		console.log(`  ⚠️  Skipped: ${skipped}\n`);
	}

	const oldDailyUsage = await loadOldDailyUsage();
	if (oldDailyUsage.length > 0) {
		console.log(`📅 Migrating ${oldDailyUsage.length} period entries...`);

		let migrated = 0;

		for (const entry of oldDailyUsage) {
			try {
				upsertPeriod({
					period_id: entry.resets_at,
					total_cost: 0,
					utilization: entry.utilization,
					date: entry.date,
				});
				migrated++;
			} catch (error) {
				console.error(
					`  ❌ Failed to migrate period ${entry.resets_at}:`,
					error,
				);
			}
		}

		console.log(`  ✅ Migrated: ${migrated}\n`);
	}

	const sessionCount = db
		.query<{ count: number }, []>("SELECT COUNT(*) as count FROM sessions")
		.get();
	const periodCount = db
		.query<{ count: number }, []>("SELECT COUNT(*) as count FROM periods")
		.get();

	console.log("📊 Migration Summary:");
	console.log(`  Sessions in DB: ${sessionCount?.count ?? 0}`);
	console.log(`  Periods in DB: ${periodCount?.count ?? 0}`);
	console.log("\n✅ Migration complete!");
	console.log("\n⚠️  Note: Period costs have been reset to 0.");
	console.log("   They will be recalculated correctly as you use Claude Code.");
	console.log("   The old JSON files are preserved as backup.");
}

migrate().catch(console.error);
