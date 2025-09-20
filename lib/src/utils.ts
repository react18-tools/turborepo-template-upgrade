import { exec } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

import {
  type InbuiltMergeStrategies,
  resolveConflicts,
} from "git-json-resolver";
import { DROP, StrategyStatus_OK } from "git-json-resolver/utils";

export const cdToRepoRoot = async () => {
  let cwd = process.cwd();

  const checkFiles = async (dir: string) => {
    try {
      await Promise.all([
        access(resolve(dir, "pnpm-lock.yaml")),
        access(resolve(dir, "pnpm-workspace.yaml")),
      ]);
      return true;
    } catch {
      return false;
    }
  };

  while (cwd !== "/" && !(await checkFiles(cwd))) {
    cwd = resolve(cwd, "..");
  }
  process.chdir(cwd);
  return cwd;
};

const DEFAULT_LAST_TURBO_COMMIT = "159692443c7a196d86c2612f752ae1d0786b004b";
export const getBaseCommit = async (lastCommitFile: string) => {
  // 1. If already tracked, prefer that
  try {
    const content = await readFile(lastCommitFile, "utf8");
    return content.trim();
  } catch {}

  // 2. Get first commit date and template commits in parallel
  const [{ stdout: firstCommitDate }, { stdout: templateLog }] =
    await Promise.all([
      execAsync("git log --reverse --format=%ai | head -n 1", {
        encoding: "utf8",
      }),
      execAsync("git log --format=%H::%ai template/main", { encoding: "utf8" }),
    ]);

  const firstDate = new Date(firstCommitDate.trim());

  // 3. Parse template commits
  const templateCommits = templateLog
    .trim()
    .split("\n")
    .map((line) => {
      const [hash, dateStr] = line.split("::");
      return { hash, date: new Date(dateStr?.trim()) };
    })
    .reverse();

  // 4. Find latest commit before or equal to firstDate
  const baseCommit = templateCommits.find((c) => c.date >= firstDate);

  if (baseCommit) {
    console.info(
      "Applying changes from ",
      baseCommit.hash,
      " dated ",
      baseCommit.date,
    );
    return baseCommit.hash;
  }

  // 5. Fallback — safest merge-base
  return DEFAULT_LAST_TURBO_COMMIT;
};

/* v8 ignore start */
export const resolvePackageJSONConflicts = async (debug: boolean) => {
  const checkFileExists = async (path: string) => {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  };

  const [rebrandJsExists, rebrandTsExists, typeDocExists, plopExists] =
    await Promise.all([
      checkFileExists("scripts/rebrand.js"),
      checkFileExists("scripts/rebrand.ts"),
      checkFileExists("typedoc.config.js"),
      checkFileExists("scripts/templates"),
    ]);

  const rebrandExists = rebrandJsExists || rebrandTsExists;

  await resolveConflicts<InbuiltMergeStrategies | "ignore-removed">({
    include: ["package.json"],
    defaultStrategy: ["merge", "theirs"],
    rules: {
      name: ["ours"],
      "devDependencies.*": ["ignore-removed", "theirs"],
      "dependencies.*": ["ignore-removed", "theirs"],
    },
    customStrategies: {
      "ignore-removed": ({ theirs, path }) => {
        if (
          (!rebrandExists && /enquirer$/.test(path)) ||
          (!typeDocExists && /typedoc/.test(path)) ||
          (!plopExists && /plop/.test(path))
        ) {
          return {
            status: StrategyStatus_OK,
            value: DROP,
          };
        }

        return {
          status: StrategyStatus_OK,
          value: theirs,
        };
      },
    },
    debug,
  });

  await resolveConflicts({
    include: ["**/package.json"],
    exclude: ["package.json", "**/dist/**", "**/.next/**"],
    defaultStrategy: ["merge", "non-empty", "ours"],
    rules: {
      "devDependencies.*": ["semver-max"],
      "dependencies.*": ["semver-max"],
    },
    loggerConfig: {
      logDir: ".logs2",
      levels: { stdout: [] },
    },
    plugins: ["git-json-resolver-semver"],
    pluginConfig: {
      "git-json-resolver-semver": {
        preferValid: true,
      },
    },
    includeNonConflicted: true,
    debug,
  });
};
/* v8 ignore stop */
