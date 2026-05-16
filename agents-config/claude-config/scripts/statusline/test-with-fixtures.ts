#!/usr/bin/env bun

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

const fixtureArg = process.argv[2] || "test-input.json";
const fixturePath = join(
	import.meta.dir,
	"fixtures",
	fixtureArg.endsWith(".json") ? fixtureArg : `${fixtureArg}.json`,
);

try {
	const fixture = await readFile(fixturePath, "utf-8");

	console.log("📊 Testing statusline with fixture:", fixtureArg);
	console.log("─".repeat(60));

	const result =
		await $`echo ${fixture} | bun ${join(import.meta.dir, "src/index.ts")}`.quiet();

	console.log(result.stdout.toString());
	console.log("─".repeat(60));
	console.log("✅ Test complete!");
} catch (error) {
	if ((error as any).code === "ENOENT") {
		console.error(`❌ Fixture not found: ${fixturePath}`);
		console.log("\nAvailable fixtures:");
		const files =
			await $`ls ${join(import.meta.dir, "fixtures")}/*.json`.quiet();
		console.log(files.stdout.toString());
	} else {
		console.error("❌ Error:", error);
	}
	process.exit(1);
}
