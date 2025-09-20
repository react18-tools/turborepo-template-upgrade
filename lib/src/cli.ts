#!/usr/bin/env node
import { type UpgradeOptions, upgradeTemplate } from ".";
import { createDefaultConfig } from "./config";
import { cdToRepoRoot } from "./utils";

interface CliOptions extends UpgradeOptions {
  help?: boolean;
  init?: boolean;
}

const parseArgs = (args: string[]): CliOptions => {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--debug":
      case "-d":
        options.debug = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--template-url":
        options.templateUrl = args[++i];
        break;
      case "--exclude":
        options.excludePaths = args[++i]?.split(",") || [];
        break;
      case "--skip-install":
        options.skipInstall = true;
        break;
      case "--remote-name":
        options.remoteName = args[++i];
        break;
      case "--max-retries":
        options.maxPatchRetries = parseInt(args[++i], 10) || 3;
        break;
      case "--skip-clean-check":
        options.skipCleanCheck = true;
        break;
      case "--from":
        options.from = args[++i];
        break;
      case "--last-commit-file":
      case "-l":
        options.lastCommitFile = args[++i];
        break;
      case "--init":
      case "-i":
        options.init = true;
        // Check if next arg is a filename (not starting with --)
        if (args[i + 1] && !args[i + 1].startsWith("--")) {
          options.config = args[++i];
        }
        break;
      case "--config":
      case "-c":
        options.config = args[++i];
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
};

const showHelp = () => {
  console.log(`
Usage: turborepo-template-upgrade [options]

Options:
  -d, --debug              Enable debug logging
  --dry-run               Show what would be changed without applying
  --template-url <url>    Custom template repository URL
  --exclude <paths>       Comma-separated paths to exclude from upgrade
  --skip-install          Skip dependency reinstallation after upgrade
  --remote-name <name>    Custom remote name for template (default: template)
  --max-retries <num>     Maximum patch retry attempts (default: 3)
  --skip-clean-check      Skip git tree clean check
  --from <ref>            Specific commit hash, tag, or branch to upgrade from
  -l, --last-commit-file <file> Custom file to store last commit hash
  -i, --init [file]       Create default config file (optionally specify filename)
  -c, --config <file>     Use custom config file
  -h, --help              Show this help message

Configuration:
  Create .tt-upgrade.config.json in your repo root for persistent settings.

Examples:
  turborepo-template-upgrade --debug
  turborepo-template-upgrade --dry-run
  turborepo-template-upgrade --exclude "docs,examples" --skip-install
  turborepo-template-upgrade --template-url https://github.com/custom/template
  turborepo-template-upgrade --init
  turborepo-template-upgrade --init my-config.json
  turborepo-template-upgrade --config my-config.json
`);
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.init) {
    const cwd = await cdToRepoRoot();
    await createDefaultConfig(cwd, options.config);
    process.exit(0);
  }

  upgradeTemplate(options.from, options);
};

main().catch(console.error);
