import fs from "fs";

const conflictFile = "package.json";

export const resolvePackageJSONConflicts = () => {
  const pkg = fs.readFileSync(conflictFile, "utf8");

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
    const cleaned = fs
      .readFileSync(conflictFile, "utf8")
      .replace(/<<<<<<<[\s\S]*?=======([\s\S]*?)>>>>>>> theirs/g, (_, theirs) => theirs.trim());

    const originalJson = JSON.parse(cleaned);

    // Merge everything into devDependencies only
    originalJson.devDependencies = {
      ...(originalJson.devDependencies || {}),
      ...(originalJson.dependencies || {}),
      ...finalDeps,
    };
    delete originalJson.dependencies; // kill dependencies

    fs.writeFileSync(conflictFile, JSON.stringify(originalJson, null, 2));
    console.log("✅ package.json conflicts resolved (all in devDependencies).");
  }
};
