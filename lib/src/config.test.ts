import { describe, test, beforeEach, afterEach, vi } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { loadConfig, mergeConfig } from "./config";

describe("config", () => {
  const testDir = process.cwd();
  const configPath = resolve(testDir, ".turborepo-template.config.json");
  
  beforeEach(() => {
    // Clean up any existing config file
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  describe("loadConfig", () => {
    test("should return empty config when file doesn't exist", ({ expect }) => {
      const config = loadConfig(testDir);
      expect(config).toEqual({});
    });

    test("should load valid config from file", ({ expect }) => {
      const testConfig = {
        debug: true,
        skipInstall: true,
        excludePaths: ["docs", "examples"],
        templateUrl: "https://github.com/custom/template",
        remoteName: "upstream",
        maxPatchRetries: 5
      };
      
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
      
      const config = loadConfig(testDir);
      expect(config).toEqual(testConfig);
    });

    test("should handle invalid JSON gracefully", ({ expect }) => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      writeFileSync(configPath, "{ invalid json }");
      
      const config = loadConfig(testDir);
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to parse config file")
      );
      
      consoleSpy.mockRestore();
    });

    test("should handle empty file gracefully", ({ expect }) => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      writeFileSync(configPath, "");
      
      const config = loadConfig(testDir);
      expect(config).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe("mergeConfig", () => {
    test("should merge configs with CLI taking precedence", ({ expect }) => {
      const fileConfig = {
        debug: false,
        skipInstall: false,
        excludePaths: ["docs"],
        templateUrl: "https://github.com/file/template"
      };
      
      const cliConfig = {
        debug: true,
        excludePaths: ["examples"],
        remoteName: "upstream"
      };
      
      const merged = mergeConfig(fileConfig, cliConfig);
      
      expect(merged).toEqual({
        debug: true, // CLI overrides file
        skipInstall: false, // from file
        excludePaths: ["docs", "examples"], // arrays are merged
        templateUrl: "https://github.com/file/template", // from file
        remoteName: "upstream" // from CLI only
      });
    });

    test("should handle empty file config", ({ expect }) => {
      const cliConfig = {
        debug: true,
        excludePaths: ["examples"]
      };
      
      const merged = mergeConfig({}, cliConfig);
      
      expect(merged).toEqual({
        debug: true,
        excludePaths: ["examples"]
      });
    });

    test("should handle empty CLI config", ({ expect }) => {
      const fileConfig = {
        debug: false,
        excludePaths: ["docs"]
      };
      
      const merged = mergeConfig(fileConfig, {});
      
      expect(merged).toEqual({
        debug: false,
        excludePaths: ["docs"]
      });
    });

    test("should handle both empty configs", ({ expect }) => {
      const merged = mergeConfig({}, {});
      
      expect(merged).toEqual({
        excludePaths: []
      });
    });

    test("should merge exclude paths correctly", ({ expect }) => {
      const fileConfig = {
        excludePaths: ["docs", "lib"]
      };
      
      const cliConfig = {
        excludePaths: ["examples", "tests"]
      };
      
      const merged = mergeConfig(fileConfig, cliConfig);
      
      expect(merged.excludePaths).toEqual(["docs", "lib", "examples", "tests"]);
    });

    test("should handle undefined exclude paths", ({ expect }) => {
      const fileConfig = {
        debug: true
      };
      
      const cliConfig = {
        skipInstall: true
      };
      
      const merged = mergeConfig(fileConfig, cliConfig);
      
      expect(merged.excludePaths).toEqual([]);
    });
  });
});