import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { cdToRepoRoot, getBaseCommit, resolvePackageJSONConflicts } from "./utils";
import { DEFAULT_BACKUP_DIR } from "git-json-resolver/utils";
import { loadConfig, mergeConfig, type UpgradeConfig } from "./config";

const errorLogs: unknown[] = [];

let patchRecurseCount = 0;
/**
 * Create and apply patch
 */
const createAndApplyPatch = (
  baseCommit: string,
  exclusions: string[],
  log: (msg: string) => void,
  remoteName = "template",
  maxRetries = 3,
) => {
  if (patchRecurseCount++ > maxRetries) {
    patchRecurseCount = 0;
    log(`Max patch recursion reached (${maxRetries}), stopping`);
    return;
  }

  const diffCmd = `git diff ${baseCommit} ${remoteName}/main -- ${exclusions.join(" ")} .`;
  log(`Running: ${diffCmd}`);
  const patch = execSync(diffCmd, { encoding: "utf8" });
  writeFileSync(".template.patch", patch);
  log(`Patch written to .template.patch (${patch.length} chars)`);

  // 8. Apply patch
  try {
    log("Applying patch with 3-way merge");
    execSync("git apply --3way --ignore-space-change --ignore-whitespace .template.patch", {
      encoding: "utf8",
    });
    log("Patch applied successfully");
  } catch (err: any) {
    const errorLines: string[] = err.stderr
      ?.split?.("\n")
      .filter((line: string) => line.startsWith("error"));
    log(`Patch failed with ${errorLines.length} errors`);
    errorLines.forEach((line: string) => {
      const filePath = line.split(":")[1]?.trim();
      if (filePath) {
        exclusions.push(`:!${filePath}`);
        log(`Added to exclusions: ${filePath}`);
      }
    });
    errorLogs.push("Applied patch with errors: ");
    errorLogs.push({ errorLines, exclusions });
    errorLogs.push("^^^---Applied patch with errors");
    if (errorLines.length) createAndApplyPatch(baseCommit, exclusions, log, remoteName, maxRetries);
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
  const cwd = cdToRepoRoot();
  const fileConfig = loadConfig(cwd);
  const options = mergeConfig(fileConfig, cliOptions);

  const {
    debug = false,
    dryRun = false,
    templateUrl = "https://github.com/react18-tools/turborepo-template",
    excludePaths = [],
    skipInstall = false,
    remoteName = "template",
    maxPatchRetries = 3,
    skipCleanCheck = false,
  } = options;

  const log = (message: string) => debug && console.log(`🔍 [DEBUG] ${message}`);

  log(`Working directory: ${cwd}`);
  if (Object.keys(fileConfig).length > 0) {
    log(`Loaded config from .tt-upgrade.config.json`);
  }

  // Ensure git tree is clean
  if (!skipCleanCheck) {
    try {
      execSync("git diff --quiet");
      execSync("git diff --cached --quiet");
      log("Git tree is clean");
    } catch {
      console.error("❌ Error: Please commit or stash your changes before upgrading.");
      return;
    }
  } else {
    log("Skipping git clean check");
  }

  if (dryRun) {
    console.log("🔍 Dry run mode - no changes will be applied");
  }

  // Ensure template remote exists
  try {
    execSync(`git remote add ${remoteName} ${templateUrl}`);
    log(`Added ${remoteName} remote: ${templateUrl}`);
  } catch {
    log(`${remoteName} remote already exists`);
  }

  // Delete backup dir
  try {
    execSync(`rm -rf ${DEFAULT_BACKUP_DIR}`);
  } catch {}

  try {
    execSync(`git fetch ${remoteName}`);
    log(`Fetched latest changes from ${remoteName}`);

    // Determine last template commit
    const baseCommit = lastTemplateRepoCommit?.trim() || getBaseCommit();

    // Build exclusion list
    const defaultExclusions = [
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
      ".turborepo-template.lst",
      ".vscode/settings.json",
    ];

    const exclusions = [...defaultExclusions, ...excludePaths].map(entry => `:!${entry}`);
    log(`Base exclusions: ${exclusions.length} items`);

    [
      ".github/workflows/docs.yml",
      "scripts/templates",
      "examples/express",
      "examples/nextjs/src/app/button.tsx",
      "examples/nextjs/src/app/button.module.css",
      "examples/remix",
      "packages/logger",
      "packages/jest-presets",
      "scripts/rebrand.js",
      "scripts/rebrander.js",
      "plopfile.js",
      "tsconfig.docs.json",
      "typedoc.config.js",
    ].forEach(dir => {
      if (!existsSync(resolve(cwd, dir))) {
        exclusions.push(`:!${dir}`);
        log(`Added missing path to exclusions: ${dir}`);
      }
    });

    const conditionalExcludes: [string, string[]][] = [
      ["scripts/templates", ["component-generator.md"]],
      ["docs", ["scripts/add-frontmatter.mjs"]],
    ];

    conditionalExcludes.forEach(([fileToTest, toExclude]) => {
      if (!existsSync(fileToTest)) {
        toExclude.forEach(f => exclusions.push(`:!${f}`));
      }
    });

    // 7. Generate patch
    log(`Generating patch from ${baseCommit} to template/main`);
    log(`Total exclusions: ${exclusions.length}`);

    if (dryRun) {
      const diffCmd = `git diff ${baseCommit} ${remoteName}/main -- ${exclusions.join(" ")} .`;
      const patch = execSync(diffCmd, { encoding: "utf8" });
      console.log("📋 Patch preview:");
      console.log(patch || "No changes to apply");
      return;
    }

    createAndApplyPatch(baseCommit, exclusions, log, remoteName, maxPatchRetries);

    const templateLatestCommit = execSync(`git rev-parse ${remoteName}/main`, {
      encoding: "utf8",
    }).trim();

    writeFileSync(".turborepo-template.lst", templateLatestCommit);

    await resolvePackageJSONConflicts(debug);

    console.log("✅ Upgrade applied successfully.");

    if (!dryRun && !skipInstall) {
      console.log("Reinstalling dependencies...");
      execSync("pnpm i", { stdio: debug ? "inherit" : "pipe" });
      log("Dependencies reinstalled");
    } else if (skipInstall) {
      log("Skipping dependency installation");
    }
    // Ensure template last commit is not being updated in workflows
    try {
      execSync("sed -i '/\\.turborepo-template\\.lst/d' .github/workflows/upgrade.yml");
      execSync("sed -i '/\\.turborepo-template\\.lst/d' .github/workflows/docs.yml");
    } catch {
      // ignore if not found
    }
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
  }

  if (errorLogs.length > 0) {
    writeFileSync(".error.log", JSON.stringify(errorLogs, null, 2));
    log(`Error log written with ${errorLogs.length} entries`);
  }
};
