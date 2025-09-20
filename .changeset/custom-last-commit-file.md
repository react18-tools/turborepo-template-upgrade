---
"turborepo-template-upgrade": minor
---

Add support for custom last commit file and improved CLI options

- Add `--last-commit-file` / `-l` option to specify custom file for storing and loading last commit hash
- Add `--init [filename]` / `-i [filename]` option to create config file with optional custom name
- Add `--config` / `-c` option to specify custom config file path
- Extract DEFAULT_CONFIG constant for consistent defaults
- Clean up code structure and improve CLI UX
