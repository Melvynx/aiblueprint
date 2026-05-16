#!/usr/bin/env bun

import { join } from "node:path";
import { $ } from "bun";

const fixtureFile = process.argv[2] || "fixtures/test-input.json";
const fixtureFullPath = join(import.meta.dir, fixtureFile);

console.log(`\n📝 Testing with fixture: ${fixtureFile}\n`);

try {
	const content = await Bun.file(fixtureFullPath).text();
	const result = await $`echo ${content} | bun run src/index.ts`.text();

	console.log(result);
	console.log("\n✅ Test completed successfully!\n");
} catch (error) {
	console.error("❌ Test failed:", error);
	process.exit(1);
}
