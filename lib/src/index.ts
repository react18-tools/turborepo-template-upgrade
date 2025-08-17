import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

export const upgradeTemplate = (lastTemplateRepoCommit?: string) => {
  // Check if git tree is clean
  execSync(`git diff --quiet && git diff --cached --quiet || {
  echo "Error: Please commit or stash your changes before upgrading."
  exit 1
}`);
  // Add template remote
  try {
    execSync("git remote add template https://github.com/react18-tools/turborepo-template");
  } catch (err) {
    console.debug("Error setting template", err);
  }

  try {
    if (!lastTemplateRepoCommit) {
      lastTemplateRepoCommit = readFileSync(
        resolve(process.cwd(), ".turborepo-template.lst"),
        "utf8",
      );
    }
    if (!lastTemplateRepoCommit) {
      throw new Error("Last Turborepo commit not found");
    }
    execSync("git fetch template");
    execSync(
      `git diff ${lastTemplateRepoCommit} template/main -- . ':!docs' ':!lib' > .template.patch`,
    );
  } catch (err) {
    console.error(err);
  }
};
