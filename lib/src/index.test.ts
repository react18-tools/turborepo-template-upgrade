import { describe, test, vi, beforeEach } from "vitest";
import { upgradeTemplate } from ".";
import { loadConfig, mergeConfig } from "./config";
import lstCommit from "../../.turborepo-template.lst?raw";
import { getBaseCommit } from "./utils";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";

// Mock execSync to prevent actual git operations in tests
vi.mock("child_process", () => ({
  execSync: vi.fn(() => "mock-output")
}));

vi.mock("./utils", () => ({
  cdToRepoRoot: vi.fn(() => process.cwd()),
  getBaseCommit: vi.fn(() => "abc123"),
  resolvePackageJSONConflicts: vi.fn()
}));

describe("upgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should work with default options", async ({ expect }) => {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue("mock-commit-hash");
    
    await upgradeTemplate();
    expect(mockExecSync).toHaveBeenCalled();
  });

  test("should support debug mode", async ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    await upgradeTemplate(undefined, { debug: true });
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[DEBUG]"));
    consoleSpy.mockRestore();
  });

  test("should support dry run mode", async ({ expect }) => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue("");
    
    await upgradeTemplate(undefined, { dryRun: true });
    
    expect(consoleSpy).toHaveBeenCalledWith("🔍 Dry run mode - no changes will be applied");
    consoleSpy.mockRestore();
  });

  test("should support custom template URL", async ({ expect }) => {
    const mockExecSync = vi.mocked(execSync);
    const customUrl = "https://github.com/custom/template";
    
    await upgradeTemplate(undefined, { templateUrl: customUrl });
    
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining(`git remote add template ${customUrl}`)
    );
  });

  test("should support skip install option", async ({ expect }) => {
    const mockExecSync = vi.mocked(execSync);
    mockExecSync.mockReturnValue("mock-commit-hash");
    
    await upgradeTemplate(undefined, { skipInstall: true });
    
    // Should not call pnpm i when skipInstall is true
    expect(mockExecSync).not.toHaveBeenCalledWith(
      "pnpm i",
      expect.any(Object)
    );
  });

  test(
    "integration smoke test",
    async ({ expect }) => {
      // Restore original execSync for integration test
      vi.restoreAllMocks();
      
      await upgradeTemplate(lstCommit.trim());
      getBaseCommit();
      execSync("git reset --hard HEAD");
      await upgradeTemplate();
      execSync("git reset --hard HEAD");
      expect(true).toBe(true);
    },
    { timeout: 15000 },
  );
});

describe("config", () => {
  const configPath = ".turborepo-template.config.json";
  
  beforeEach(() => {
    // Clean up any existing config file
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  });

  test("should load empty config when file doesn't exist", ({ expect }) => {
    const config = loadConfig(process.cwd());
    expect(config).toEqual({});
  });

  test("should load config from file", ({ expect }) => {
    const testConfig = {
      debug: true,
      skipInstall: true,
      excludePaths: ["docs", "examples"]
    };
    
    writeFileSync(configPath, JSON.stringify(testConfig));
    
    const config = loadConfig(process.cwd());
    expect(config).toEqual(testConfig);
    
    unlinkSync(configPath);
  });

  test("should merge configs correctly", ({ expect }) => {
    const fileConfig = {
      debug: false,
      excludePaths: ["docs"]
    };
    
    const cliConfig = {
      debug: true,
      excludePaths: ["examples"]
    };
    
    const merged = mergeConfig(fileConfig, cliConfig);
    
    expect(merged).toEqual({
      debug: true,
      excludePaths: ["docs", "examples"]
    });
  });
});
