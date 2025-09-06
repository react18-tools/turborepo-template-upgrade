#!/usr/bin/env node
import { upgradeTemplate, type UpgradeOptions } from ".";

interface CliOptions extends UpgradeOptions {
  help?: boolean;
}

const parseArgs = (args: string[]): CliOptions => {
  const options: CliOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--template-url':
        options.templateUrl = args[++i];
        break;
      case '--exclude':
        options.excludePaths = args[++i]?.split(',') || [];
        break;
      case '--skip-install':
        options.skipInstall = true;
        break;
      case '--remote-name':
        options.remoteName = args[++i];
        break;
      case '--max-retries':
        options.maxPatchRetries = parseInt(args[++i]) || 3;
        break;
      case '--skip-clean-check':
        options.skipCleanCheck = true;
        break;
      case '--help':
      case '-h':
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
  -h, --help              Show this help message

Configuration:
  Create .tt-upgrade.config.json in your repo root for persistent settings.

Examples:
  turborepo-template-upgrade --debug
  turborepo-template-upgrade --dry-run
  turborepo-template-upgrade --exclude "docs,examples" --skip-install
  turborepo-template-upgrade --template-url https://github.com/custom/template
`);
};

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  showHelp();
  process.exit(0);
}

const { help, ...upgradeOptions } = options;
upgradeTemplate(undefined, upgradeOptions);
