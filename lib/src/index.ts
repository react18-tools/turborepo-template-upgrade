import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { resolvePackageJSONConflicts } from "./utils";

const DEFAULT_LAST_TURBO_COMMIT = "159692443c7a196d86c2612f752ae1d0786b004b";
const errorLogs: unknown[] = [];

let patchRecurseCount = 0;
const createAndApplyPatch = (lastTemplateRepoCommit: string, exclusions: string[]) => {
  if (patchRecurseCount++ > 3) {
    patchRecurseCount = 0;
    return;
  }
  const diffCmd = `git diff ${lastTemplateRepoCommit} template/main -- ${exclusions.join(" ")} .`;
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
      exclusions.push(line.split(":")[1].trim());
    });
    errorLogs.push("Applied patch with errors: ");
    errorLogs.push({ errorLines, exclusions });
    errorLogs.push("^^^---Applied patch with errors");
    if (errorLines.length) createAndApplyPatch(lastTemplateRepoCommit, exclusions);
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
export const upgradeTemplate = (lastTemplateRepoCommit?: string) => {
  // 1. Move to repo root
  let cwd = process.cwd();
  while (
    cwd !== "/" &&
    !(existsSync(resolve(cwd, "pnpm-lock.yaml")) && existsSync(resolve(cwd, "pnpm-workspace.yaml")))
  ) {
    cwd = resolve(cwd, "..");
  }
  process.chdir(cwd);

  // 2. Ensure git tree is clean
  try {
    execSync("git diff --quiet");
    execSync("git diff --cached --quiet");
  } catch {
    console.error("❌ Error: Please commit or stash your changes before upgrading.");
    return;
  }

  // 3. Ensure template remote exists
  try {
    execSync("git remote add template https://github.com/react18-tools/turborepo-template");
  } catch {
    // ignore if already added
  }

  try {
    // 4. Determine last template commit
    if (!lastTemplateRepoCommit) {
      const filePath = resolve(cwd, ".turborepo-template.lst");
      if (existsSync(filePath)) {
        lastTemplateRepoCommit = readFileSync(filePath, "utf8").trim();
      }
    } else {
      lastTemplateRepoCommit = lastTemplateRepoCommit.trim();
    }

    if (!lastTemplateRepoCommit?.trim()) {
      lastTemplateRepoCommit = DEFAULT_LAST_TURBO_COMMIT;
      console.log("using default base commit: ", lastTemplateRepoCommit);
    }

    // 5. Fetch latest template
    execSync("git fetch template");

    // 6. Build exclusion list
    const exclusions = [
      "docs",
      "lib",
      "scripts/rebrand.config.json",
      "pnpm-lock.yaml",
      ".lst",
      ".turborepo-template.lst",
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
    createAndApplyPatch(lastTemplateRepoCommit, exclusions);

    const templateLatestCommit = execSync("git rev-parse template/main", {
      encoding: "utf8",
    }).trim();

    writeFileSync(".turborepo-template.lst", templateLatestCommit);

    resolvePackageJSONConflicts();

    execSync("git add ./package.json");

    console.log("✅ Upgrade applied successfully. Check .template.patch for details.");
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
  }
  writeFileSync(".error.log", JSON.stringify(errorLogs, null, 2));
};
