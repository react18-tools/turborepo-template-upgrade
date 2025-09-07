import { afterAll } from "vitest";
import { existsSync, unlinkSync } from "fs";

// Files that might be created during tests and need cleanup
const CLEANUP_FILES = [
  ".turborepo-template.lst",
  ".template.patch",
  ".error.log",
  ".turborepo-template.config.json",
  ".tt-upgrade.config.json",
];

// Global cleanup after all tests
afterAll(() => {
  CLEANUP_FILES.forEach(file => {
    try {
      if (existsSync(file)) {
        unlinkSync(file);
        console.log(`Cleaned up: ${file}`);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});
