import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { defineConfig } from "vite";

function walkFiles(directory: string, extension: string): string[] {
  if (!existsSync(directory)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      files.push(...walkFiles(filePath, extension));
    } else if (entry.endsWith(extension)) {
      files.push(filePath);
    }
  }
  return files;
}

function getDocsPaths() {
  const docsDirectory = join(import.meta.dirname, "content/docs");
  const docs = walkFiles(docsDirectory, ".mdx")
    .map((filePath) => {
      const slug = relative(docsDirectory, filePath)
        .replace(/\.mdx$/, "")
        .split(sep)
        .filter((part) => part !== "index")
        .join("/");

      return slug ? `/docs/${slug}` : "/docs";
    })
    .filter((path) => path !== "/docs");

  return ["/", "/docs", ...docs];
}

export default defineConfig({
  server: { port: Number(process.env.PORT) || 3000 },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      router: {
        routeFileIgnorePrefix: "-",
      },
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        failOnError: true,
      },
      pages: Array.from(new Set(getDocsPaths())).map((path) => ({
        path,
        prerender: { enabled: true },
      })),
    }),
    nitro({
      serverAssets: [{ baseName: "docs", dir: "content/docs" }],
    } as Parameters<typeof nitro>[0]),
    viteReact(),
  ],
});
