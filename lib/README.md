# turborepo-template-upgrade <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

[![test](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml/badge.svg)](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml)
[![Maintainability](https://qlty.sh/badges/d71561ba-73d4-4182-a419-98ccb23e4a0a/maintainability.svg)](https://qlty.sh/gh/react18-tools/projects/turborepo-template-upgrade)
[![codecov](https://codecov.io/gh/react18-tools/turborepo-template-upgrade/graph/badge.svg)](https://codecov.io/gh/react18-tools/turborepo-template-upgrade) [![Version](https://img.shields.io/npm/v/turborepo-template-upgrade.svg?colorB=green)](https://www.npmjs.com/package/turborepo-template-upgrade) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/turborepo-template-upgrade.svg)](https://www.npmjs.com/package/turborepo-template-upgrade) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/turborepo-template-upgrade) [![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/from-referrer/)

**Seamlessly keep your repo in sync with [turborepo-template](https://github.com/react18-tools/turborepo-template).**

## 🚀 Purpose

`turborepo-template-upgrade` is a small utility built for repositories that were bootstrapped using [react18-tools/turborepo-template](https://github.com/react18-tools/turborepo-template).

Instead of manually copy-pasting template updates (bug fixes, CI improvements, tooling upgrades), this package provides:

- **One command upgrade** – pull changes from the template into your repo.
- **Safe patching** – applies diffs instead of overwriting.
- **Smart conflict resolution** – especially for root `package.json` file.

---

## 📦 Installation

You don’t need to add this as a runtime dependency. Use it as a dev tool:

```bash
npm install -D turborepo-template-upgrade
# or
yarn add -D turborepo-template-upgrade
```

---

## ⚡ Usage

Inside a repo created with [turborepo-template](https://github.com/react18-tools/turborepo-template):

```bash
npx turborepo-template-upgrade
```

> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/> We just released a shorthand -- pnpx tt-upgrade

### CLI Options

```bash
# Basic usage with debug logging
npx turborepo-template-upgrade --debug

# Preview changes without applying
npx turborepo-template-upgrade --dry-run

# Skip dependency installation
npx turborepo-template-upgrade --skip-install

# Exclude specific paths
npx turborepo-template-upgrade --exclude "docs,examples"

# Upgrade from specific commit, tag, or branch
npx turborepo-template-upgrade --from v1.2.3
npx turborepo-template-upgrade --from abc123def
npx turborepo-template-upgrade --from feature-branch
```

**Available Options:**

- `--debug` / `-d` - Enable detailed logging
- `--dry-run` - Preview changes without applying
- `--template-url <url>` - Custom template repository URL
- `--exclude <paths>` - Comma-separated paths to exclude
- `--skip-install` - Skip dependency reinstallation
- `--remote-name <name>` - Custom git remote name
- `--max-retries <num>` - Maximum patch retry attempts
- `--skip-clean-check` - Skip git tree clean validation
- `--from <ref>` - Specific commit hash, tag, or branch to upgrade from
- `--help` / `-h` - Show help message

This will:

1. Fetch the latest changes from the template repo.
2. Compute a `git diff` since your last upgrade.
3. Apply the patch on top of your repo.
4. Attempt to auto-resolve `package.json` conflicts.
5. Store the last applied commit in `.turborepo-template.lst`.

If there are remaining conflicts, you’ll see them in `.template.patch`.

---

## ⚠️ Important Migration Notice

**Biome Migration**: The turborepo-template has migrated from ESLint + Prettier to Biome for linting and formatting. If you prefer to continue using ESLint + Prettier, configure your upgrade to use the legacy branch:

> See discussion here: https://github.com/react18-tools/turborepo-template/discussions/69

```bash
npx turborepo-template-upgrade --template-url https://github.com/react18-tools/turborepo-template --from legacy/eslint-prettier
```

Or add to your `.tt-upgrade.config.json`:

```json
{
  "templateUrl": "https://github.com/react18-tools/turborepo-template",
  "from": "legacy/eslint-prettier"
}
```

---

## 🔧 Configuration

Create `.tt-upgrade.config.json` in your repo root for persistent settings:

```json
{
  "debug": false,
  "skipInstall": true,
  "excludePaths": ["docs", "examples"],
  "templateUrl": "https://github.com/custom/template",
  "remoteName": "upstream",
  "maxPatchRetries": 5,
  "from": "v1.2.3"
}
```

CLI options override config file settings.

---

## 🧩 Conflict Resolution

- **`package.json`** merges are handled automatically:
  - Keeps your dependencies.
  - Brings in template upgrades.
  - Deduplicates versions.
- For other files, standard `git apply --3way` conflict markers may appear.

---

## 🔍 Example Workflows

### Basic Upgrade

```bash
# 1. Upgrade with debug logging
npx turborepo-template-upgrade --debug

# 2. Review conflicts (if any)
git status
cat .template.patch

# 3. Commit changes
git add .
git commit -m "chore: upgrade template"
```

### Preview Mode

```bash
# Preview what would change
npx turborepo-template-upgrade --dry-run

# Apply if satisfied
npx turborepo-template-upgrade
```

### Custom Configuration

```bash
# Skip installation and exclude docs
npx turborepo-template-upgrade --skip-install --exclude "docs,examples"

# Upgrade from specific version
npx turborepo-template-upgrade --from v2.1.0

# Use legacy ESLint + Prettier setup
npx turborepo-template-upgrade --from legacy/eslint-prettier
```

---

## 🛠 How It Works

- Template repo is added as a Git remote (`template`).
- Last applied commit hash is tracked in `.turborepo-template.lst`.
- `git diff` between last applied commit → `template/main`.
- Patch applied locally with `git apply --3way`.

---

## 🙏 Acknowledgments

Thanks to the [react18-tools](https://github.com/react18-tools) community for shaping the turborepo ecosystem.

## License

This library is licensed under the MPL-2.0 open-source license.

> <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 20px"/> Please enroll in [our courses](https://mayank-chaudhari.vercel.app/courses) or [sponsor](https://github.com/sponsors/mayank1513) our work.

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
