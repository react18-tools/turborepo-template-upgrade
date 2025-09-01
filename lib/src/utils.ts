import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";
import { InbuiltMergeStrategies, resolveConflicts, StrategyStatus } from "git-json-resolver";
import { DROP } from "git-json-resolver/utils";

export const cdToRepoRoot = () => {
  let cwd = process.cwd();
  while (
    cwd !== "/" &&
    !(existsSync(resolve(cwd, "pnpm-lock.yaml")) && existsSync(resolve(cwd, "pnpm-workspace.yaml")))
  ) {
    cwd = resolve(cwd, "..");
  }
  process.chdir(cwd);
  return cwd;
};

const DEFAULT_LAST_TURBO_COMMIT = "159692443c7a196d86c2612f752ae1d0786b004b";
const LAST_COMMIT_FILE = ".turborepo-template.lst";
export const getBaseCommit = () => {
  // 1. If already tracked, prefer that
  if (existsSync(LAST_COMMIT_FILE)) {
    return readFileSync(LAST_COMMIT_FILE, "utf8").trim();
  }

  // 2. Get first commit date of current repo
  const firstCommitDate = execSync("git log --reverse --format=%ai | head -n 1", {
    encoding: "utf8",
  }).trim();

  const firstDate = new Date(firstCommitDate);

  // 3. Get template commits
  const templateCommits = execSync("git log --format=%H::%ai template/main", { encoding: "utf8" })
    .trim()
    .split("\n")
    .map(line => {
      const [hash, dateStr] = line.split("::");
      return { hash, date: new Date(dateStr.trim()) };
    })
    .reverse();

  // 4. Find latest commit before or equal to firstDate
  const baseCommit = templateCommits.find(c => c.date >= firstDate);

  if (baseCommit) {
    console.info("Applying changes from ", baseCommit.hash, " dated ", baseCommit.date);
    return baseCommit.hash;
  }

  // 5. Fallback — safest merge-base
  return DEFAULT_LAST_TURBO_COMMIT;
};

/* v8 ignore start */
export const resolvePackageJSONConflicts = async () => {
  const rebrandExists = existsSync("scripts/rebrand.js");
  const typeDocExists = existsSync("typedoc.config.js");
  const plopExists = existsSync("scripts/templates");

  console.log({ cwd: process.cwd() });

  await resolveConflicts<InbuiltMergeStrategies | "ignore-removed">({
    include: ["package.json"],
    defaultStrategy: ["merge", "ours"],
    rules: {
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
            status: StrategyStatus.OK,
            value: DROP,
          };
        }

        return {
          status: StrategyStatus.OK,
          value: theirs,
        };
      },
    },
  });

  await resolveConflicts({
    include: ["**/package.json"],
    exclude: ["package.json", "**/dist/**"],
    defaultStrategy: ["merge", "ours"],
    rules: {
      "devDependencies.*": ["merge", "semver-max"],
      "dependencies.*": ["merge", "semver-max"],
    },
    loggerConfig: {
      logDir: ".logs2",
    },
    plugins: ["git-json-resolver-semver"],
    pluginConfig: {
      "git-json-resolver-semver": {
        preferValid: true,
      },
    },
  });
};
/* v8 ignore stop */
