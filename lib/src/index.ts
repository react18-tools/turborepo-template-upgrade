import { execSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { cdToRepoRoot, getBaseCommit, resolvePackageJSONConflicts } from "./utils";

const errorLogs: unknown[] = [];

let patchRecurseCount = 0;
/**
 * Create and apply patch
 */
const createAndApplyPatch = (baseCommit: string, exclusions: string[]) => {
  if (patchRecurseCount++ > 3) {
    patchRecurseCount = 0;
    return;
  }
  const diffCmd = `git diff ${baseCommit} template/main -- ${exclusions.join(" ")} .`;
  const patch = execSync(diffCmd, { encoding: "utf8" });
  writeFileSync(".template.patch", patch);

  // 8. Apply patch
  try {
    execSync("git apply --3way --ignore-space-change --ignore-whitespace .template.patch", {
      encoding: "utf8",
    });
  } catch (err: any) {
    const errorLines: string[] = err.stderr
      ?.split?.("\n")
      .filter((line: string) => line.startsWith("error"));
    errorLines.forEach((line: string) => {
      exclusions.push(`:!${line.split(":")[1].trim()}`);
    });
    errorLogs.push("Applied patch with errors: ");
    errorLogs.push({ errorLines, exclusions });
    errorLogs.push("^^^---Applied patch with errors");
    if (errorLines.length) createAndApplyPatch(baseCommit, exclusions);
  }
};

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
 */
export const upgradeTemplate = async (lastTemplateRepoCommit?: string) => {
  const cwd = cdToRepoRoot();

  // Ensure git tree is clean
  try {
    execSync("git diff --quiet");
    execSync("git diff --cached --quiet");
  } catch {
    console.error("❌ Error: Please commit or stash your changes before upgrading.");
    return;
  }

  // Ensure template remote exists
  try {
    execSync("git remote add template https://github.com/react18-tools/turborepo-template");
  } catch {
    // ignore if already added
  }

  try {
    execSync("git fetch template");

    // Determine last template commit
    const baseCommit = lastTemplateRepoCommit?.trim() || getBaseCommit();

    // Build exclusion list
    const exclusions = [
      "CHANGELOG.md",
      "**/CHANGELOG.md",
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
    ].map(entry => `:!${entry}`);

    [
      "scripts/templates",
      "examples/express",
      "examples/remix",
      "packages/logger",
      "packages/jest-presets",
      "scripts/rebrand.js",
      "scripts/rebrander.js",
    ].forEach(dir => {
      if (!existsSync(resolve(cwd, dir))) exclusions.push(`:!${dir}`);
    });

    // 7. Generate patch
    createAndApplyPatch(baseCommit, exclusions);

    const templateLatestCommit = execSync("git rev-parse template/main", {
      encoding: "utf8",
    }).trim();

    writeFileSync(".turborepo-template.lst", templateLatestCommit);

    await resolvePackageJSONConflicts();

    console.log("✅ Upgrade applied successfully. Check .template.patch for details.");

    console.log(
      "Please resolve andy merge conflicts and 📦 re-install dependencies by running pnpm i.",
    );
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
  }
  writeFileSync(".error.log", JSON.stringify(errorLogs, null, 2));
};
