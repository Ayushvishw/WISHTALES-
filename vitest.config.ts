import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: { PGLITE_DIR: "memory", UPLOAD_DIR: ".data/test-uploads" },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
