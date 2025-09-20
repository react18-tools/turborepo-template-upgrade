---
"turborepo-template-upgrade": patch
---

fix: wrap pnpm i in try catch to avoid skipping removal of .tuborepo-template.lst update steps in workflows.
