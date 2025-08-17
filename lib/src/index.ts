import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

export const upgradeTemplate = (lastTemplateRepoCommit?: string) => {
  // Check if git tree is clean
  try {
    execSync("git diff --quiet", { encoding: "utf8" });
    execSync("git diff --cached --quiet", { encoding: "utf8" });
  } catch {
    console.error("Error: Please commit or stash your changes before upgrading.");
    process.exit(1);
  }
  // Add template remote
  try {
    execSync("git remote add template https://github.com/react18-tools/turborepo-template", {
      encoding: "utf8",
    });
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
    execSync("git fetch template", { encoding: "utf8" });
    execSync(
      `git diff ${lastTemplateRepoCommit} template/main -- . ':!docs' ':!lib' > .template.patch`,
      { encoding: "utf8" },
    );
  } catch (err) {
    console.error(err);
  }
};
