import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    testTimeout: 30000,
    hookTimeout: 30000,
    isolate: false, // lets writes persist between tests
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
});
