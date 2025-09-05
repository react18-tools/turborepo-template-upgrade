---
"turborepo-template-upgrade": patch
---

Improve template upgrade exclusions and workflow handling

- Add more comprehensive file exclusions (.tkb, FUNDING.md, docs workflow)
- Exclude optional template files when not present (button components, docs config)
- Clean up workflow files to prevent template commit tracking
- Improve upgrade success messaging