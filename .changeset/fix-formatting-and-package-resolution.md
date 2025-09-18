---
"turborepo-template-upgrade": patch
---

Fix code formatting and improve package.json conflict resolution

- Fix trailing commas and code formatting issues
- Support both .js and .ts rebrand scripts detection
- Change default merge strategy to "theirs" for better template updates
- Add explicit "name" field rule to preserve project name during merges
- Add encoding parameter to pnpm install command
- Adding \n at the end for resolved package.json files (from git-json-resolver)