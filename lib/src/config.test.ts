import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, test } from "vitest";
import { loadConfig, mergeConfig } from "./config";

describe("config", () => {
  const testDir = process.cwd();
  const configPath = resolve(testDir, ".tt-upgrade.config.json");

  beforeEach(() => {
    // Clean up any existing config file
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  describe("loadConfig", () => {
    test("should return empty config when file doesn't exist", async ({
      expect,
    }) => {
      const config = await loadConfig(testDir);
      expect(config).toEqual({});
    });

    test("should load valid config from file", async ({ expect }) => {
      const testConfig = {
        debug: true,
        skipInstall: true,
        excludePaths: ["docs", "examples"],
        templateUrl: "https://github.com/custom/template",
        remoteName: "upstream",
        maxPatchRetries: 5,
      };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      const config = await loadConfig(testDir);
      expect(config).toEqual(testConfig);
    });

    test("should handle invalid JSON gracefully", async ({ expect }) => {
      writeFileSync(configPath, "{ invalid json }");
      const config = await loadConfig(testDir);
      expect(config).toEqual({});
    });

    test("should handle empty file gracefully", async ({ expect }) => {
      writeFileSync(configPath, "");
      const config = await loadConfig(testDir);
      expect(config).toEqual({});
    });
  });

  describe("mergeConfig", () => {
    test("should merge configs with CLI taking precedence", ({ expect }) => {
      const fileConfig = {
        debug: false,
        skipInstall: false,
        excludePaths: ["docs"],
        templateUrl: "https://github.com/file/template",
      };

      const cliConfig = {
        debug: true,
        excludePaths: ["examples"],
        remoteName: "upstream",
      };

      const merged = mergeConfig(fileConfig, cliConfig);

      expect(merged).toEqual({
        debug: true, // CLI overrides file
        skipInstall: false, // from file
        excludePaths: ["docs", "examples"], // arrays are merged
        templateUrl: "https://github.com/file/template", // from file
        remoteName: "upstream", // from CLI only
      });
    });

    test("should handle empty file config", ({ expect }) => {
      const cliConfig = {
        debug: true,
        excludePaths: ["examples"],
      };

      const merged = mergeConfig({}, cliConfig);

      expect(merged).toEqual({
        debug: true,
        excludePaths: ["examples"],
      });
    });

    test("should handle empty CLI config", ({ expect }) => {
      const fileConfig = {
        debug: false,
        excludePaths: ["docs"],
      };

      const merged = mergeConfig(fileConfig, {});

      expect(merged).toEqual({
        debug: false,
        excludePaths: ["docs"],
      });
    });

    test("should handle both empty configs", ({ expect }) => {
      const merged = mergeConfig({}, {});

      expect(merged).toEqual({
        excludePaths: [],
      });
    });

    test("should merge exclude paths correctly", ({ expect }) => {
      const fileConfig = {
        excludePaths: ["docs", "lib"],
      };

      const cliConfig = {
        excludePaths: ["examples", "tests"],
      };

      const merged = mergeConfig(fileConfig, cliConfig);

      expect(merged.excludePaths).toEqual(["docs", "lib", "examples", "tests"]);
    });

    test("should handle undefined exclude paths", ({ expect }) => {
      const fileConfig = {
        debug: true,
      };

      const cliConfig = {
        skipInstall: true,
      };

      const merged = mergeConfig(fileConfig, cliConfig);

      expect(merged.excludePaths).toEqual([]);
    });
  });
});
