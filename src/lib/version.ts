import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedVersion: string | null = null;

export function getVersion(): string {
  if (cachedVersion) return cachedVersion;

  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf8")
    );
    cachedVersion = packageJson.version;
    return cachedVersion;
  } catch {
    return "unknown";
  }
}
