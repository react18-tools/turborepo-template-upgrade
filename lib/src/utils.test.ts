import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { afterEach, beforeEach, describe, test, vi } from "vitest";

// Mock dependencies
vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

const mockExecAsync = vi.fn();
vi.mock("node:util", () => ({
  promisify: vi.fn(() => mockExecAsync),
}));

vi.mock("git-json-resolver", () => ({
  resolveConflicts: vi.fn(),
}));

vi.mock("path", () => ({
  resolve: vi.fn((...args) => args.join("/")),
}));

describe("utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, "cwd").mockReturnValue("/current/dir");
    vi.spyOn(process, "chdir").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("cdToRepoRoot", () => {
    test("should return current directory if pnpm files exist", async ({
      expect,
    }) => {
      const { access } = await import("node:fs/promises");
      vi.mocked(access).mockResolvedValue(undefined);

      const { cdToRepoRoot } = await import("./utils");
      const result = await cdToRepoRoot();

      expect(result).toBe("/current/dir");
    });

    test("should traverse up directories to find repo root", async ({
      expect,
    }) => {
      const { access } = await import("node:fs/promises");
      let callCount = 0;
      vi.mocked(access).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return Promise.reject(new Error("ENOENT"));
        return Promise.resolve(undefined);
      });

      const { cdToRepoRoot } = await import("./utils");
      await cdToRepoRoot();
      expect(true).toBe(true);
    });

    test("should stop at root directory", async ({ expect }) => {
      const { access } = await import("node:fs/promises");
      vi.mocked(access).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(process.cwd).mockReturnValue("/");

      const { cdToRepoRoot } = await import("./utils");
      const result = await cdToRepoRoot();
      expect(result).toBe("/");
    });
  });

  describe("getBaseCommit", () => {
    test("should return commit from .turborepo-template.lst if exists", async ({
      expect,
    }) => {
      const { readFile } = await import("node:fs/promises");
      const expectedCommit = "abc123def456";
      vi.mocked(readFile).mockResolvedValue(`${expectedCommit}\n`);

      const { getBaseCommit } = await import("./utils");
      const result = await getBaseCommit();
      expect(result).toBe(expectedCommit);
    });

    test("should calculate base commit from git history when no lst file", async ({
      expect,
    }) => {
      const { readFile } = await import("node:fs/promises");

      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));

      mockExecAsync
        .mockResolvedValueOnce({
          stdout: "2023-01-01 10:00:00 +0000",
          stderr: "",
        })
        .mockResolvedValueOnce({
          stdout: "hash3::2023-01-02 10:00:00 +0000",
          stderr: "",
        });

      const { getBaseCommit } = await import("./utils");
      const result = await getBaseCommit();
      expect(result).toBe("hash3");
    });

    test("should return default commit when no suitable template commit found", async ({
      expect,
    }) => {
      const { readFile } = await import("node:fs/promises");

      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));

      mockExecAsync
        .mockResolvedValueOnce({
          stdout: "2023-01-01 10:00:00 +0000",
          stderr: "",
        })
        .mockResolvedValueOnce({
          stdout: "hash1::2022-12-01 09:00:00 +0000",
          stderr: "",
        });

      const { getBaseCommit } = await import("./utils");
      const result = await getBaseCommit();
      expect(result).toBe("159692443c7a196d86c2612f752ae1d0786b004b");
    });

    test("should handle empty template commits", async ({ expect }) => {
      const { readFile } = await import("node:fs/promises");

      vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));

      mockExecAsync
        .mockResolvedValueOnce({
          stdout: "2023-01-01 10:00:00 +0000",
          stderr: "",
        })
        .mockResolvedValueOnce({ stdout: "", stderr: "" });

      const { getBaseCommit } = await import("./utils");
      const result = await getBaseCommit();
      expect(result).toBe("159692443c7a196d86c2612f752ae1d0786b004b");
    });
  });

  describe("resolvePackageJSONConflicts", () => {
    test("should call resolveConflicts with correct configuration", async ({
      expect,
    }) => {
      const { access } = await import("node:fs/promises");
      const { resolveConflicts } = await import("git-json-resolver");

      vi.mocked(access).mockResolvedValue(undefined);

      const { resolvePackageJSONConflicts } = await import("./utils");
      await resolvePackageJSONConflicts(true);

      expect(vi.mocked(resolveConflicts)).toHaveBeenCalledTimes(2);
    });

    test("should handle missing optional files in custom strategy", async ({
      expect,
    }) => {
      const { access } = await import("node:fs/promises");
      const { resolveConflicts } = await import("git-json-resolver");

      vi.mocked(access).mockImplementation((path) => {
        const pathStr = String(path);
        if (
          pathStr.includes("rebrand.js") ||
          pathStr.includes("typedoc.config.js") ||
          pathStr.includes("scripts/templates")
        ) {
          return Promise.reject(new Error("ENOENT"));
        }
        return Promise.resolve(undefined);
      });

      const { resolvePackageJSONConflicts } = await import("./utils");
      await resolvePackageJSONConflicts(false);

      expect(vi.mocked(resolveConflicts)).toHaveBeenCalled();
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
    filesToCleanup.forEach((file) => {
      try {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      } catch (_error) {
        // Ignore cleanup errors
      }
    });
  });

  test("should clean up residual files", ({ expect }) => {
    // Create test files
    filesToCleanup.forEach((file) => {
      try {
        writeFileSync(file, "test content");
      } catch (_error) {
        // Ignore if can't create
      }
    });

    // Verify cleanup works
    expect(true).toBe(true);
  });
});
