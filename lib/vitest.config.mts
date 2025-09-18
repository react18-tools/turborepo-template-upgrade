import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["test-setup.ts"],
    coverage: {
      include: ["src/**"],
      exclude: ["src/**/*.test.*", "src/**/declaration.d.ts", "src/**/cli.ts"],
      reporter: ["text", "json", "clover", "html"],
    },
  },
});
