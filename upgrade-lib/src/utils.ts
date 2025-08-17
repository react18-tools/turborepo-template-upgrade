import fs from "fs";

const conflictFile = "package.json";

export const resolvePackageJSONConflicts = () => {
  const pkg = fs.readFileSync(conflictFile, "utf8");

  if (pkg.includes("<<<<<<<")) {
    console.log("⚠️ Resolving package.json conflicts...");

    // crude parse: keep 'ours' block as base
    const ours = pkg.split("<<<<<<< ours")[1].split("=======")[0].trim();
    const theirs = pkg.split("=======")[1].split(">>>>>>> theirs")[0].trim();

    // Rebuild JSON from "ours" (your repo)
    const oursJson = JSON.parse(
      "{" + ours.replace(/,$/, "") + "}", // wrap to make valid JSON fragment
    );
    const finalDeps = { ...oursJson };

    // Optionally merge safe upgrades from theirs
    const theirsJson = JSON.parse("{" + theirs.replace(/,$/, "") + "}");

    const blacklist = ["typedoc", "plop", "enquirer"];
    const blacklistPrefix = "typedoc-plugin-";

    for (const [k, v] of Object.entries(theirsJson)) {
      if (blacklist.includes(k) || k.startsWith(blacklistPrefix)) {
        continue; // drop
      }
      // if ours already has the dep, prefer ours
      if (!(k in finalDeps)) {
        finalDeps[k] = v;
      }
    }

    // Build final package.json
    const originalJson = JSON.parse(
      fs.readFileSync(conflictFile, "utf8").replace(/<<<<<<<[\s\S]*>>>>>>> theirs/, ""),
    );
    originalJson.dependencies = {
      ...(originalJson.dependencies || {}),
      ...finalDeps,
    };

    fs.writeFileSync(conflictFile, JSON.stringify(originalJson, null, 2));
    console.log("✅ package.json conflicts resolved.");
  }
};
