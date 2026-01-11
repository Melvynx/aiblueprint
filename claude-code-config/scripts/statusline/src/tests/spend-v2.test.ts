import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const TEST_DB_PATH = join(import.meta.dir, "..", "..", "data", "test.db");

describe("SQLite Delta Tracking", () => {
	let db: Database;

	beforeEach(() => {
		if (existsSync(TEST_DB_PATH)) {
			rmSync(TEST_DB_PATH);
		}

		db = new Database(TEST_DB_PATH);

		db.run(`
			CREATE TABLE sessions (
				session_id TEXT PRIMARY KEY,
				total_cost REAL NOT NULL DEFAULT 0,
				cwd TEXT NOT NULL,
				date TEXT NOT NULL,
				duration_ms INTEGER NOT NULL DEFAULT 0,
				lines_added INTEGER NOT NULL DEFAULT 0,
				lines_removed INTEGER NOT NULL DEFAULT 0,
				last_resets_at TEXT
			)
		`);

		db.run(`
			CREATE TABLE session_period_tracking (
				session_id TEXT NOT NULL,
				period_id TEXT NOT NULL,
				counted_cost REAL NOT NULL DEFAULT 0,
				last_session_cost REAL NOT NULL DEFAULT 0,
				PRIMARY KEY (session_id, period_id)
			)
		`);

		db.run(`
			CREATE TABLE periods (
				period_id TEXT PRIMARY KEY,
				total_cost REAL NOT NULL DEFAULT 0,
				utilization INTEGER NOT NULL DEFAULT 0,
				date TEXT NOT NULL
			)
		`);
	});

	afterEach(() => {
		db.close();
		if (existsSync(TEST_DB_PATH)) {
			rmSync(TEST_DB_PATH);
		}
	});

	test("New session: full cost added to period", () => {
		const sessionId = "session-1";
		const periodId = "2025-12-09T10:00:00.000Z";
		const sessionCost = 10.0;

		db.run(
			"INSERT INTO sessions (session_id, total_cost, cwd, date, last_resets_at) VALUES (?, ?, ?, ?, ?)",
			[sessionId, sessionCost, "/test", "2025-12-09", periodId],
		);

		db.run(
			"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
			[sessionId, periodId, sessionCost, sessionCost],
		);

		db.run(
			"INSERT INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodId, sessionCost, 0, "2025-12-09"],
		);

		const period = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodId);

		expect(period?.total_cost).toBe(10.0);
	});

	test("Continued session: only delta added to period", () => {
		const sessionId = "session-1";
		const periodId = "2025-12-09T10:00:00.000Z";

		db.run(
			"INSERT INTO sessions (session_id, total_cost, cwd, date, last_resets_at) VALUES (?, ?, ?, ?, ?)",
			[sessionId, 10.0, "/test", "2025-12-09", periodId],
		);

		db.run(
			"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
			[sessionId, periodId, 10.0, 10.0],
		);

		db.run(
			"INSERT INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodId, 10.0, 0, "2025-12-09"],
		);

		const newSessionCost = 24.0;
		const delta = newSessionCost - 10.0;

		db.run("UPDATE sessions SET total_cost = ? WHERE session_id = ?", [
			newSessionCost,
			sessionId,
		]);

		const tracking = db
			.query<
				{ counted_cost: number; last_session_cost: number },
				[string, string]
			>(
				"SELECT counted_cost, last_session_cost FROM session_period_tracking WHERE session_id = ? AND period_id = ?",
			)
			.get(sessionId, periodId);

		const newCountedCost = (tracking?.counted_cost ?? 0) + delta;

		db.run(
			"UPDATE session_period_tracking SET counted_cost = ?, last_session_cost = ? WHERE session_id = ? AND period_id = ?",
			[newCountedCost, newSessionCost, sessionId, periodId],
		);

		db.run(
			"UPDATE periods SET total_cost = total_cost + ? WHERE period_id = ?",
			[delta, periodId],
		);

		const period = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodId);
		const updatedTracking = db
			.query<{ counted_cost: number }, [string, string]>(
				"SELECT counted_cost FROM session_period_tracking WHERE session_id = ? AND period_id = ?",
			)
			.get(sessionId, periodId);

		expect(period?.total_cost).toBe(24.0);
		expect(updatedTracking?.counted_cost).toBe(24.0);
	});

	test("Session spanning periods: only new delta in new period", () => {
		const sessionId = "session-1";
		const periodA = "2025-12-09T05:00:00.000Z";
		const periodB = "2025-12-09T10:00:00.000Z";

		db.run(
			"INSERT INTO sessions (session_id, total_cost, cwd, date, last_resets_at) VALUES (?, ?, ?, ?, ?)",
			[sessionId, 10.0, "/test", "2025-12-09", periodA],
		);

		db.run(
			"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
			[sessionId, periodA, 10.0, 10.0],
		);

		db.run(
			"INSERT INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodA, 10.0, 0, "2025-12-09"],
		);

		const newSessionCost = 24.0;
		const session = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM sessions WHERE session_id = ?",
			)
			.get(sessionId);
		const delta = newSessionCost - (session?.total_cost ?? 0);

		db.run(
			"UPDATE sessions SET total_cost = ?, last_resets_at = ? WHERE session_id = ?",
			[newSessionCost, periodB, sessionId],
		);

		db.run(
			"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
			[sessionId, periodB, delta, newSessionCost],
		);

		db.run(
			"INSERT OR IGNORE INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodB, 0, 0, "2025-12-09"],
		);
		db.run(
			"UPDATE periods SET total_cost = total_cost + ? WHERE period_id = ?",
			[delta, periodB],
		);

		const periodACost = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodA);
		const periodBCost = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodB);
		const trackingA = db
			.query<{ counted_cost: number }, [string, string]>(
				"SELECT counted_cost FROM session_period_tracking WHERE session_id = ? AND period_id = ?",
			)
			.get(sessionId, periodA);
		const trackingB = db
			.query<{ counted_cost: number }, [string, string]>(
				"SELECT counted_cost FROM session_period_tracking WHERE session_id = ? AND period_id = ?",
			)
			.get(sessionId, periodB);

		expect(periodACost?.total_cost).toBe(10.0);
		expect(periodBCost?.total_cost).toBe(14.0);
		expect(trackingA?.counted_cost).toBe(10.0);
		expect(trackingB?.counted_cost).toBe(14.0);

		expect(
			(periodACost?.total_cost ?? 0) + (periodBCost?.total_cost ?? 0),
		).toBe(24.0);
	});

	test("Multiple sessions in same period: costs sum correctly", () => {
		const periodId = "2025-12-09T10:00:00.000Z";

		db.run(
			"INSERT INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodId, 0, 0, "2025-12-09"],
		);

		const sessions = [
			{ id: "session-1", cost: 10.0 },
			{ id: "session-2", cost: 15.0 },
			{ id: "session-3", cost: 8.0 },
		];

		for (const session of sessions) {
			db.run(
				"INSERT INTO sessions (session_id, total_cost, cwd, date, last_resets_at) VALUES (?, ?, ?, ?, ?)",
				[session.id, session.cost, "/test", "2025-12-09", periodId],
			);

			db.run(
				"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
				[session.id, periodId, session.cost, session.cost],
			);

			db.run(
				"UPDATE periods SET total_cost = total_cost + ? WHERE period_id = ?",
				[session.cost, periodId],
			);
		}

		const period = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodId);

		expect(period?.total_cost).toBe(33.0);
	});

	test("No double counting: continuing old session after restart", () => {
		const sessionId = "session-1";
		const periodId = "2025-12-09T10:00:00.000Z";

		db.run(
			"INSERT INTO sessions (session_id, total_cost, cwd, date, last_resets_at) VALUES (?, ?, ?, ?, ?)",
			[sessionId, 10.0, "/test", "2025-12-09", periodId],
		);

		db.run(
			"INSERT INTO session_period_tracking (session_id, period_id, counted_cost, last_session_cost) VALUES (?, ?, ?, ?)",
			[sessionId, periodId, 10.0, 10.0],
		);

		db.run(
			"INSERT INTO periods (period_id, total_cost, utilization, date) VALUES (?, ?, ?, ?)",
			[periodId, 10.0, 0, "2025-12-09"],
		);

		const tracking = db
			.query<{ last_session_cost: number }, [string, string]>(
				"SELECT last_session_cost FROM session_period_tracking WHERE session_id = ? AND period_id = ?",
			)
			.get(sessionId, periodId);

		const currentSessionCost = 10.0;
		const delta = currentSessionCost - (tracking?.last_session_cost ?? 0);

		expect(delta).toBe(0);

		const period = db
			.query<{ total_cost: number }, [string]>(
				"SELECT total_cost FROM periods WHERE period_id = ?",
			)
			.get(periodId);

		expect(period?.total_cost).toBe(10.0);
	});
});
