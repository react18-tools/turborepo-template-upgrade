# turborepo-template-upgrade <img src="https://raw.githubusercontent.com/mayank1513/mayank1513/main/popper.png" style="height: 40px"/>

[![test](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml/badge.svg)](https://github.com/react18-tools/turborepo-template-upgrade/actions/workflows/test.yml)
[![Maintainability](https://qlty.sh/badges/d71561ba-73d4-4182-a419-98ccb23e4a0a/maintainability.svg)](https://qlty.sh/gh/react18-tools/projects/turborepo-template-upgrade)
[![codecov](https://codecov.io/gh/react18-tools/turborepo-template-upgrade/graph/badge.svg)](https://codecov.io/gh/react18-tools/turborepo-template-upgrade) [![Version](https://img.shields.io/npm/v/turborepo-template-upgrade.svg?colorB=green)](https://www.npmjs.com/package/turborepo-template-upgrade) [![Downloads](https://img.jsdelivr.com/img.shields.io/npm/d18m/turborepo-template-upgrade.svg)](https://www.npmjs.com/package/turborepo-template-upgrade) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/turborepo-template-upgrade) [![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/from-referrer/)

**Seamlessly keep your repo in sync with [turborepo-template](https://github.com/react18-tools/turborepo-template).**

---

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

This will:

1. Fetch the latest changes from the template repo.
2. Compute a `git diff` since your last upgrade.
3. Apply the patch on top of your repo.
4. Attempt to auto-resolve `package.json` conflicts.
5. Store the last applied commit in `.turborepo-template.lst`.

If there are remaining conflicts, you’ll see them in `.template.patch`.

---

## 🧩 Conflict Resolution

- **`package.json`** merges are handled automatically:
  - Keeps your dependencies.
  - Brings in template upgrades.
  - Deduplicates versions.

- For other files, standard `git apply --3way` conflict markers may appear.

---

## 🔍 Example Workflow

```bash
# 1. Upgrade
npx turborepo-template-upgrade

# 2. Review conflicts (if any)
git status
cat .template.patch

# 3. Commit changes
git add .
git commit -m "chore: upgrade template"
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
