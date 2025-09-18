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
    execSync("cd lib && pnpm publish --provenance --access public");
  } catch (err) {
    console.error(`Error publishing ${pkg}: `, err);
  }
});
