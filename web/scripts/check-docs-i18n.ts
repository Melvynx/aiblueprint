import { readdir } from "node:fs/promises";
import { join } from "node:path";

const docsRoot = join(import.meta.dir, "../content/docs");
const frRoot = join(import.meta.dir, "../content/fr");

async function listRel(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listRel(join(root, entry.name), rel)));
      continue;
    }
    if (entry.name.endsWith(".mdx") || entry.name === "meta.json") {
      files.push(rel);
    }
  }

  return files.toSorted();
}

const enFiles = await listRel(docsRoot);
const frFiles = await listRel(frRoot);
const missingInFr = enFiles.filter((file) => !frFiles.includes(file));
const extraInFr = frFiles.filter((file) => !enFiles.includes(file));

if (missingInFr.length === 0 && extraInFr.length === 0) {
  console.log(`docs i18n ok: ${enFiles.length} files match in en and fr`);
  process.exit(0);
}

if (missingInFr.length > 0) {
  console.error("Missing French copies:");
  for (const file of missingInFr) console.error(`  - ${file}`);
}
if (extraInFr.length > 0) {
  console.error("French files without English source:");
  for (const file of extraInFr) console.error(`  - ${file}`);
}
process.exit(1);
