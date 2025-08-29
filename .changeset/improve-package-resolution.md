---
"turborepo-template-upgrade": minor
---

Improve package resolution logic and update dependencies

- Update git-json-resolver to v1.1.0 for better conflict resolution
- Use DROP utility for cleaner package removal logic
- Fix react18-loaders dependency resolution to use "latest" instead of workspace reference