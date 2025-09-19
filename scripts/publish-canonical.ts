import { execSync } from "node:child_process";

// Publish canonical packages
const canonicals: string[] = [
  "@r18/upgrade",
  "turborepo-template-sync",
  "tt-upgrade",
];

canonicals.forEach((pkg) => {
  try {
    execSync(
      `sed -i -e "s/name.*/name\\": \\"${pkg.replace(/\//g, "\\\\/")}\\",/" lib/package.json`,
    );
    execSync("cd lib && npm publish --provenance --access public", {
      encoding: "utf8",
      stdio: "inherit",
    });
  } catch (err) {
    console.error(`Error publishing ${pkg}: `, err);
  }
});
