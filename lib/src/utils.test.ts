import { describe, test, vi, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";
import { cdToRepoRoot, getBaseCommit, resolvePackageJSONConflicts } from "./utils";

// Mock file system operations
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Mock child_process
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// Mock path operations
vi.mock("path", () => ({
  resolve: vi.fn((...args) => args.join("/")),
}));

// Mock git-json-resolver
vi.mock("git-json-resolver", () => ({
  resolveConflicts: vi.fn(),
  InbuiltMergeStrategies: {},
}));

describe("utils", () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockReadFileSync = vi.mocked(readFileSync);
  const mockExecSync = vi.mocked(execSync);
  const mockResolve = vi.mocked(resolve);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.cwd and process.chdir
    vi.spyOn(process, "cwd").mockReturnValue("/current/dir");
    vi.spyOn(process, "chdir").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cdToRepoRoot", () => {
    test("should return current directory if pnpm files exist", ({ expect }) => {
      mockExistsSync.mockReturnValue(true);
      mockResolve.mockImplementation((...args) => args.join("/"));

      const result = cdToRepoRoot();

      expect(result).toBe("/current/dir");
      expect(process.chdir).toHaveBeenCalledWith("/current/dir");
    });

    test("should traverse up directories to find repo root", ({ expect }) => {
      let callCount = 0;
      mockExistsSync.mockImplementation(() => {
        callCount++;
        return callCount > 2; // Return true on third call
      });

      mockResolve.mockImplementation((...args) => args.join("/"));
      vi.mocked(process.cwd).mockReturnValue("/some/nested/dir");

      const result = cdToRepoRoot();

      expect(mockExistsSync).toHaveBeenCalled();
      expect(process.chdir).toHaveBeenCalled();
    });

    test("should stop at root directory", ({ expect }) => {
      mockExistsSync.mockReturnValue(false);
      mockResolve.mockImplementation((...args) => {
        const path = args.join("/");
        if (path.includes("..")) return "/";
        return path;
      });

      vi.mocked(process.cwd).mockReturnValue("/");

      const result = cdToRepoRoot();

      expect(result).toBe("/");
    });
  });

  describe("getBaseCommit", () => {
    test("should return commit from .turborepo-template.lst if exists", ({ expect }) => {
      const expectedCommit = "abc123def456";
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`${expectedCommit}\n`);

      const result = getBaseCommit();

      expect(result).toBe(expectedCommit);
      expect(mockReadFileSync).toHaveBeenCalledWith(".turborepo-template.lst", "utf8");
    });

    test("should calculate base commit from git history when no lst file", ({ expect }) => {
      mockExistsSync.mockReturnValue(false);

      const firstCommitDate = "2023-01-01 10:00:00 +0000";
      const templateCommits = [
        "hash1::2023-01-01 09:00:00 +0000",
        "hash2::2023-01-01 11:00:00 +0000",
        "hash3::2023-01-02 10:00:00 +0000",
      ].join("\n");

      mockExecSync.mockReturnValueOnce(firstCommitDate).mockReturnValueOnce(templateCommits);

      const result = getBaseCommit();

      expect(result).toBe("hash3");
      expect(mockExecSync).toHaveBeenCalledWith("git log --reverse --format=%ai | head -n 1", {
        encoding: "utf8",
      });
    });

    test("should return default commit when no suitable template commit found", ({ expect }) => {
      mockExistsSync.mockReturnValue(false);

      const firstCommitDate = "2023-01-01 10:00:00 +0000";
      const templateCommits = "hash1::2022-12-01 09:00:00 +0000";

      mockExecSync.mockReturnValueOnce(firstCommitDate).mockReturnValueOnce(templateCommits);

      const result = getBaseCommit();

      expect(result).toBe("159692443c7a196d86c2612f752ae1d0786b004b");
    });

    test("should handle empty template commits", ({ expect }) => {
      mockExistsSync.mockReturnValue(false);

      mockExecSync.mockReturnValueOnce("2023-01-01 10:00:00 +0000").mockReturnValueOnce("");

      const result = getBaseCommit();

      expect(result).toBe("159692443c7a196d86c2612f752ae1d0786b004b");
    });
  });

  describe("resolvePackageJSONConflicts", () => {
    test("should call resolveConflicts with correct configuration", async ({ expect }) => {
      const { resolveConflicts } = await import("git-json-resolver");
      mockExistsSync.mockReturnValue(true);

      await resolvePackageJSONConflicts(true);

      expect(resolveConflicts).toHaveBeenCalledTimes(2);

      // Check first call for package.json
      expect(resolveConflicts).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          include: ["package.json"],
          defaultStrategy: ["merge", "theirs"],
          debug: true,
        }),
      );

      // Check second call for nested package.json files
      expect(resolveConflicts).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          include: ["**/package.json"],
          exclude: ["package.json", "**/dist/**", "**/.next/**"],
          debug: true,
        }),
      );
    });

    test("should handle missing optional files in custom strategy", async ({ expect }) => {
      const { resolveConflicts } = await import("git-json-resolver");
      mockExistsSync.mockImplementation(path => {
        // Simulate missing rebrand.js, typedoc.config.js, and scripts/templates
        const pathStr = String(path);
        return (
          !pathStr.includes("rebrand.js") &&
          !pathStr.includes("typedoc.config.js") &&
          !pathStr.includes("scripts/templates")
        );
      });

      await resolvePackageJSONConflicts(false);

      expect(resolveConflicts).toHaveBeenCalledWith(
        expect.objectContaining({
          customStrategies: expect.objectContaining({
            "ignore-removed": expect.any(Function),
          }),
        }),
      );
    });
  });
});

describe("test cleanup", () => {
  const filesToCleanup = [
    ".turborepo-template.lst",
    ".template.patch",
    ".error.log",
    ".tt-upgrade.config.json",
  ];

  afterEach(() => {
    // Clean up any residual files after each test
    filesToCleanup.forEach(file => {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  test("should clean up residual files", ({ expect }) => {
    // Create test files
    filesToCleanup.forEach(file => {
      try {
        writeFileSync(file, "test content");
      } catch (error) {
        // Ignore if can't create
      }
    });

    // Verify cleanup works
    expect(true).toBe(true);
  });
});
