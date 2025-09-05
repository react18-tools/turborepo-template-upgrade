# turborepo-template-upgrade

## 0.5.5

### Patch Changes

- 6176009: Improve template upgrade exclusions and workflow handling
  - Add more comprehensive file exclusions (.tkb, FUNDING.md, docs workflow)
  - Exclude optional template files when not present (button components, docs config)
  - Clean up workflow files to prevent template commit tracking
  - Improve upgrade success messaging

## 0.5.4

### Patch Changes

- 5bca065: Fix: handle path separator in windows

## 0.5.3

### Patch Changes

- 38fcd5e: Enable debugging

## 0.5.2

### Patch Changes

- d7fd6aa: Handle Non conflicted to ensure proper package.json

## 0.5.1

### Patch Changes

- 9fc986f: Add semever aware strategies.

## 0.5.0

### Minor Changes

- 1ef0bc3: Improve package resolution logic and update dependencies
  - Update git-json-resolver to v1.1.0 for better conflict resolution
  - Use DROP utility for cleaner package removal logic
  - Fix react18-loaders dependency resolution to use "latest" instead of workspace reference

## 0.4.0

### Minor Changes

- d6cd0cf: Reduce logging and auto re-install dependencies after upgradng and resolving packages.

### Patch Changes

- 2aaba57: Ignore removed react18-loaders@workspace:\* packages
- 9febdb8: Exclude Readme as those updates will only be related to the template itself and not the libray that is created.

## 0.3.12

### Patch Changes

- f38bd7e: Update README

## 0.3.11

### Patch Changes

- bc1a5d1: Fix: ensure git fetch before attempting to get baseCommit

## 0.3.10

### Patch Changes

- 5693940: fix: handle file separator issues in matcher

## 0.3.9

### Patch Changes

- 680203e: Isolate logs per run

## 0.3.8

### Patch Changes

- 3948528: fix typo

## 0.3.7

### Patch Changes

- 2babba4: Separate logs and handle plop dep

## 0.3.6

### Patch Changes

- 1285f9a: fix: Ensure relative path in matcher to ensure proper pattern matching

## 0.3.5

### Patch Changes

- a09cf07: fix logs

## 0.3.4

### Patch Changes

- d423527: fix: avoid walking through node_modules

## 0.3.3

### Patch Changes

- 89fbef5: Improve logging

## 0.3.2

### Patch Changes

- 3ebf5f5: Add logs - use debug mode

## 0.3.1

### Patch Changes

- faa6320: Fix: exclude node modules

## 0.3.0

### Minor Changes

- c62743f: Use git-json-resolver

## 0.2.2

### Patch Changes

- 830195e: Add changelog and vscode settings to exclusions and post info message for the last date and commit used.

## 0.2.1

### Patch Changes

- b2952e7: Fix git log format in getBaseCommit function

## 0.2.0

### Minor Changes

- 7023f8f: Select base-commit based on git history for older repos

## 0.1.0

### Minor Changes

- c8f66e8: feat: Add additional files to exclusion list in upgradeTemplate

## 0.0.8

### Patch Changes

- a1dc86b: :! <- fix exclusion syntax

## 0.0.7

### Patch Changes

- b313804: fix: Enhance error handling in patch application by adding encoding option to execSync

## 0.0.6

### Patch Changes

- 5f04a67: fix: Improve error handling in patch application by refining error logging and exclusion updates

## 0.0.5

### Patch Changes

- eeb85c4: fix: Simplify CLI template upgrade invocation by removing argument check - ensure default commit id is used

## 0.0.4

### Patch Changes

- 4f4e37f: fix: Improve error logging and handle default last template commit assignment

## 0.0.3

### Patch Changes

- de35504: fix: Improve error handling in patch application and default last template commit assignment

## 0.0.2

### Patch Changes

- a988c88: fix: Improve error handling and logging in patch application process

## 0.0.1

### Patch Changes

- b6bed99: Refactor upgradeTemplate to improve patch application and error handling
