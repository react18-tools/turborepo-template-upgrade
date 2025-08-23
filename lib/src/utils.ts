import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

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
      const [hash, ...rest] = line.split(" ");
      return { hash, date: new Date(rest.join(" ")) };
    })
    .reverse();

  // 4. Find latest commit before or equal to firstDate
  let baseCommit = templateCommits.find(c => c.date <= firstDate);

  if (baseCommit) {
    return baseCommit.hash;
  }

  // 5. Fallback — safest merge-base
  return DEFAULT_LAST_TURBO_COMMIT;
};

const conflictFile = "package.json";

/* v8 ignore start */
export const resolvePackageJSONConflicts = () => {
  const pkg = readFileSync(conflictFile, "utf8");

  if (pkg.includes("<<<<<<<")) {
    console.log("⚠️ Resolving package.json conflicts...");

    // crude parse: keep 'ours' block as base
    const ours = pkg.split("<<<<<<< ours")[1].split("=======")[0].trim();
    const theirs = pkg.split("=======")[1].split(">>>>>>> theirs")[0].trim();

    const oursJson = JSON.parse("{" + ours.replace(/,$/, "") + "}");
    const theirsJson = JSON.parse("{" + theirs.replace(/,$/, "") + "}");

    const finalDeps = { ...oursJson };
    const blacklist = ["typedoc", "plop", "enquirer"];
    const blacklistPrefix = "typedoc-plugin-";

    for (const [k, v] of Object.entries(theirsJson)) {
      if (blacklist.includes(k) || k.startsWith(blacklistPrefix)) {
        continue; // drop
      }
      if (!(k in finalDeps)) {
        finalDeps[k] = v;
      }
    }

    // Remove conflict markers and parse whole JSON
    const cleaned = readFileSync(conflictFile, "utf8").replace(
      /<<<<<<<[\s\S]*?=======([\s\S]*?)>>>>>>> theirs/g,
      (_, theirs) => theirs.trim(),
    );

    const originalJson = JSON.parse(cleaned);

    // Merge everything into devDependencies only
    originalJson.devDependencies = {
      ...(originalJson.devDependencies || {}),
      ...(originalJson.dependencies || {}),
      ...finalDeps,
    };
    delete originalJson.dependencies; // kill dependencies

    writeFileSync(conflictFile, JSON.stringify(originalJson, null, 2));
    console.log("✅ package.json conflicts resolved (all in devDependencies).");
  }
};
/* v8 ignore stop */
