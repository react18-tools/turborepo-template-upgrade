import { exec, execFile } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

import { DEFAULT_BACKUP_DIR } from "git-json-resolver/utils";
import {
  DEFAULT_CONFIG,
  loadConfig,
  mergeConfig,
  type UpgradeConfig,
} from "./config";
import {
  cdToRepoRoot,
  getBaseCommit,
  resolvePackageJSONConflicts,
} from "./utils";

const errorLogs: unknown[] = [];

// Helper functions for sanitization
const sanitizeGitRef = (ref: string) => ref.replace(/[^a-zA-Z0-9]/g, "");
const sanitizeRemoteName = (name: string) => {
  // Only allow alphanumeric, underscore, hyphen, *not* starting with dash
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "");
  // Must start with alphanumeric or underscore
  if (!cleaned || !/^[a-zA-Z0-9_]/.test(cleaned) || cleaned.startsWith("-")) {
    throw new Error(
      `Invalid remote name: "${name}". Remote names may only contain letters, numbers, underscore, and hyphen, and cannot start with '-'.`,
    );
  }
  return cleaned;
};
const sanitizeLogInput = (input: string) => input.replace(/[\r\n]/g, "");

const DEFAULT_EXCLUSIONS = [
  ".tkb",
  "CHANGELOG.md",
  "README.md",
  "**/CHANGELOG.md",
  "**/FUNDING.md",
  "SECURITY.md",
  "TODO.md",
  "FEATURED.md",
  "docs",
  "lib",
  "scripts/rebrand.config.json",
  "pnpm-lock.yaml",
  ".lst",
  ".vscode/settings.json",
];

const EXCLUDE_IF_MISSING = [
  ".github/workflows/docs.yml",
  "scripts/templates",
  "examples/express",
  "examples/nextjs/src/app/button.tsx",
  "examples/nextjs/src/app/button.module.css",
  "examples/remix",
  "packages/logger",
  "packages/jest-presets",
  "tsconfig.docs.json",
  "typedoc.config.js",
];

const EXCLUDE_IF_TEST_FILE_MISSING: [string, string[]][] = [
  [
    "scripts/templates",
    [
      "component-generator.md",
      "plopfile.js",
      "scripts/rc.ts",
      "scripts/hook.ts",
    ],
  ],
  [
    "docs",
    [
      "scripts/add-frontmatter.mjs",
      "scripts/add-frontmatter.ts",
      "scripts/doc.js",
      "scripts/doc.ts",
    ],
  ],
  ["scripts/lite.js", ["scripts/lite.js", "scripts/lite.ts"]],
];

/**
 * Create and apply patch
 */
const createAndApplyPatch = async (
  baseCommit: string,
  exclusions: string[],
  log: (msg: string) => void,
  remoteName = "template",
  maxRetries = 3,
  patchRecurseCount = 0,
) => {
  if (patchRecurseCount > maxRetries) {
    log(`Max patch recursion reached (${maxRetries}), stopping`);
    return;
  }

  const diffCmd = `git diff ${baseCommit} ${remoteName}/main -- ${exclusions.join(
    " ",
  )} .`;
  log(`Running: ${diffCmd}`);
  const { stdout: patch } = await execFileAsync(
    "git",
    ["diff", baseCommit, `${remoteName}/main`, "--", ...exclusions, "."],
    { encoding: "utf8" },
  );
  await writeFile(".template.patch", patch);
  log(`Patch written to .template.patch (${patch.length} chars)`);

  // 8. Apply patch
  try {
    log("Applying patch with 3-way merge");
    await execAsync(
      "git apply --3way --ignore-space-change --ignore-whitespace .template.patch",
      { encoding: "utf8" },
    );
    log("Patch applied successfully");
    // biome-ignore lint/suspicious/noExplicitAny: Error as any
  } catch (err: any) {
    const errorLines: string[] = err.stderr
      ?.split("\n")
      .filter((line: string) => line.startsWith("error"));
    log(`Patch failed with ${errorLines.length} errors`);
    errorLines.forEach((line: string) => {
      const filePath = line.split(":")[1]?.trim();
      if (filePath) {
        exclusions.push(`:!${filePath}`);
        log(`Added to exclusions: ${sanitizeLogInput(filePath)}`);
      }
    });
    errorLogs.push("Applied patch with errors: ");
    errorLogs.push({ errorLines, exclusions });
    errorLogs.push("^^^---Applied patch with errors");
    if (errorLines.length)
      await createAndApplyPatch(
        baseCommit,
        exclusions,
        log,
        remoteName,
        maxRetries,
        patchRecurseCount + 1,
      );
  }
};

export type { UpgradeConfig as UpgradeOptions } from "./config";

/**
 * Upgrade a repo created from the turborepo template.
 *
 * Features:
 * - Ensures git tree is clean before applying changes.
 * - Auto-adds "template" remote if missing.
 * - Uses `.turborepo-template.lst` to track last applied template commit.
 * - Generates a patch from template diff and applies with a 3-way merge.
 * - Skips docs, lib, and user-removed directories (`scripts/templates`, `examples/express`, `packages/logger`).
 * - Always runs from repo root (where `pnpm-lock.yaml` and `pnpm-workspace.yaml` exist).
 *
 * @param lastTemplateRepoCommit Optional SHA of last applied template commit.
 * @param options Configuration options for the upgrade process.
 */
export const upgradeTemplate = async (
  lastTemplateRepoCommit?: string,
  cliOptions: UpgradeConfig = {},
) => {
  const cwd = await cdToRepoRoot();
  const fileConfig = await loadConfig(cwd, cliOptions.config);
  const options = mergeConfig(fileConfig, cliOptions);

  const {
    debug,
    dryRun,
    templateUrl,
    excludePaths,
    skipInstall,
    remoteName,
    maxPatchRetries,
    skipCleanCheck,
    lastCommitFile,
  } = { ...options, ...DEFAULT_CONFIG };

  const log = (message: string) =>
    debug && console.log(`🔍 [DEBUG] ${message}`);

  log(`Working directory: ${cwd}`);
  if (Object.keys(fileConfig).length > 0) {
    log(`Loaded config from .tt-upgrade.config.json`);
  }

  // Ensure git tree is clean
  if (!skipCleanCheck) {
    try {
      await Promise.all([
        execAsync("git diff --quiet"),
        execAsync("git diff --cached --quiet"),
      ]);
      log("Git tree is clean");
    } catch {
      console.error(
        "❌ Error: Please commit or stash your changes before upgrading.",
      );
      return;
    }
  } else {
    log("Skipping git clean check");
  }

  if (dryRun) {
    console.log("🔍 Dry run mode - no changes will be applied");
  }

  // Sanitize inputs to prevent command injection
  const sanitizedRemoteName = sanitizeRemoteName(remoteName);

  // Ensure template remote exists
  try {
    await execFileAsync("git", [
      "remote",
      "add",
      sanitizedRemoteName,
      templateUrl,
    ]);
    log(
      `Added ${sanitizeLogInput(sanitizedRemoteName)} remote: ${sanitizeLogInput(templateUrl)}`,
    );
  } catch {
    log(`${sanitizeLogInput(sanitizedRemoteName)} remote already exists`);
  }

  // Delete backup dir
  try {
    await execAsync(`rm -rf ${DEFAULT_BACKUP_DIR}`);
  } catch {}

  try {
    await execFileAsync("git", ["fetch", sanitizedRemoteName]);
    log(`Fetched latest changes from ${sanitizeLogInput(sanitizedRemoteName)}`);

    // Determine last template commit
    const baseCommit =
      lastTemplateRepoCommit?.trim() ||
      options.from?.trim() ||
      (await getBaseCommit(lastCommitFile));

    const sanitizedBaseCommit = sanitizeGitRef(baseCommit);

    if (options.from) {
      log(`Using specified reference: ${sanitizeLogInput(options.from)}`);
    }

    // Build exclusion list
    const exclusions = [
      ...DEFAULT_EXCLUSIONS,
      lastCommitFile,
      ...excludePaths,
    ].map((entry) => `:!${entry}`);
    log(`Base exclusions: ${exclusions.length} items`);

    // Check file existence asynchronously
    const checkFileExists = async (path: string) => {
      try {
        await access(resolve(cwd, path));
        return true;
      } catch {
        return false;
      }
    };

    const missingDirs = await Promise.all(
      EXCLUDE_IF_MISSING.map(async (dir) =>
        (await checkFileExists(dir)) ? null : dir,
      ),
    ).then((results) => results.filter(Boolean));

    missingDirs.forEach((dir) => {
      exclusions.push(`:!${dir}`);
      log(`Added missing path to exclusions: ${sanitizeLogInput(dir || "")}`);
    });

    const missingTestFiles = await Promise.all(
      EXCLUDE_IF_TEST_FILE_MISSING.map(async ([fileToTest, toExclude]) =>
        (await checkFileExists(fileToTest)) ? [] : toExclude,
      ),
    ).then((results) => results.flat());

    missingTestFiles.forEach((f) => {
      exclusions.push(`:!${f}`);
    });

    const [rebrandJsExists, rebrandTsExists] = await Promise.all([
      checkFileExists("scripts/rebrand.js"),
      checkFileExists("scripts/rebrand.ts"),
    ]);

    if (!rebrandJsExists && !rebrandTsExists) {
      exclusions.push(
        `:!scripts/rebrander.js`,
        `:!scripts/rebrander.ts`,
        `:!scripts/rebrand.js`,
        `:!scripts/rebrand.ts`,
      );
    }
    // 7. Generate patch
    log(`Generating patch from ${baseCommit} to template/main`);
    log(`Total exclusions: ${exclusions.length}`);

    if (dryRun) {
      const { stdout: patch } = await execFileAsync(
        "git",
        [
          "diff",
          sanitizedBaseCommit,
          `${sanitizedRemoteName}/main`,
          "--",
          ...exclusions,
          ".",
        ],
        { encoding: "utf8" },
      );
      console.log("📋 Patch preview:");
      console.log(patch || "No changes to apply");
      return;
    }

    await createAndApplyPatch(
      baseCommit,
      exclusions,
      log,
      remoteName,
      maxPatchRetries,
    );

    const { stdout: templateLatestCommit } = await execFileAsync(
      "git",
      ["rev-parse", `${sanitizedRemoteName}/main`],
      { encoding: "utf8" },
    );

    await writeFile(lastCommitFile, templateLatestCommit.trim());

    await resolvePackageJSONConflicts(debug);

    console.log("✅ Upgrade applied successfully.");

    if (!dryRun && !skipInstall) {
      console.log("Reinstalling dependencies...");
      try {
        await execAsync("pnpm i", { encoding: "utf8" });
        log("Dependencies reinstalled");
      } catch {
        console.log(
          "Failed to reinstall dependencies, please check the logs and try again.",
        );
      }
    } else if (skipInstall) {
      log("Skipping dependency installation");
    }
    // Ensure template last commit is not being updated in workflows
    try {
      const escapedFile = lastCommitFile.replace(/\./g, "\\.");
      await Promise.all([
        execAsync(`sed -i '/${escapedFile}/d' .github/workflows/upgrade.yml`),
        execAsync(`sed -i '/${escapedFile}/d' .github/workflows/docs.yml`),
      ]);
    } catch {
      // ignore if not found
    }
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
  }

  if (errorLogs.length > 0) {
    await writeFile(".error.log", JSON.stringify(errorLogs, null, 2));
    console.info(`Error log written with ${errorLogs.length} entries`);
  }

  // Prompt user to delete logs and merge-backups
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question("Delete logs and merge-backups? (y/N): ", resolve);
  });
  rl.close();

  if (/y|yes|ok/i.test(answer)) {
    try {
      await Promise.all(
        [".logs", ".logs2", DEFAULT_BACKUP_DIR, ".template.patch"].map((path) =>
          execAsync(`rm -rf ${path}`),
        ),
      );
      console.log("🗑️ Cleaned up logs and merge-backups");
    } catch {
      console.log("⚠️ Failed to clean up some files");
    }
  }
};
