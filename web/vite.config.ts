import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { defineConfig } from "vite";

function walkFiles(directory: string, extension: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    if (statSync(filePath).isDirectory()) {
      files.push(...walkFiles(filePath, extension));
      continue;
    }
    if (entry.endsWith(extension)) {
      files.push(filePath);
    }
  }

  return files;
}

function getDocsPaths() {
  const docsDirectory = join(import.meta.dirname, "content/docs");
  const docs = walkFiles(docsDirectory, ".mdx").map((filePath) => {
    const slug = relative(docsDirectory, filePath)
      .replace(/\.mdx$/, "")
      .split(sep)
      .filter((part) => part !== "index")
      .join("/");

    return slug ? `/${slug}` : "/";
  });

  return Array.from(new Set(["/", ...docs]));
}

const publicPages = getDocsPaths().map((path) => ({
  path,
  prerender: { enabled: true },
}));

export default defineConfig({
  base: "/",
  server: { port: Number(process.env.PORT) || 3000 },
  resolve: {
    tsconfigPaths: true,
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
        failOnError: false,
      },
      pages: publicPages,
    }),
    viteReact(),
  ],
});
