import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface UpgradeConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Show what would be changed without applying */
  dryRun?: boolean;
  /** Custom template repository URL */
  templateUrl?: string;
  /** Additional paths to exclude from upgrade */
  excludePaths?: string[];
  /** Skip dependency reinstallation */
  skipInstall?: boolean;
  /** Custom remote name for template */
  remoteName?: string;
  /** Maximum patch recursion attempts */
  maxPatchRetries?: number;
  /** Custom backup directory */
  backupDir?: string;
  /** Skip git tree clean check */
  skipCleanCheck?: boolean;
  /** Specific commit hash, tag, or branch to upgrade from */
  from?: string;
  /** Custom file to store/load last commit hash */
  lastCommitFile?: string;
  /** Custom config file path */
  config?: string;
}

/**
 * Load configuration from specified config file or .tt-upgrade.config.json if it exists
 */
export const loadConfig = async (
  cwd: string,
  configFile?: string,
): Promise<UpgradeConfig> => {
  const configPath = resolve(cwd, configFile || ".tt-upgrade.config.json");

  try {
    await access(configPath);
    const configContent = await readFile(configPath, "utf8");
    return JSON.parse(configContent);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code !== "ENOENT"
    ) {
      console.warn(`⚠️  Failed to parse config file: ${configPath}`, error);
    }
    return {};
  }
};

export const DEFAULT_CONFIG: Required<UpgradeConfig> = {
  debug: false,
  dryRun: false,
  skipInstall: false,
  excludePaths: [],
  templateUrl: "https://github.com/react18-tools/turborepo-template",
  remoteName: "template",
  maxPatchRetries: 3,
  skipCleanCheck: false,
  lastCommitFile: ".turborepo-template.lst",
  backupDir: ".merge-backups",
  from: "",
  config: ".tt-upgrade.config.json",
};

/**
 * Create default config file
 */
export const createDefaultConfig = async (
  cwd: string,
  configFile?: string,
): Promise<void> => {
  const configPath = resolve(cwd, configFile || ".tt-upgrade.config.json");
  await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  console.log(`✅ Created config file: ${configPath}`);
};

/**
 * Merge CLI options with config file options (CLI takes precedence)
 */
export const mergeConfig = (
  fileConfig: UpgradeConfig,
  cliOptions: UpgradeConfig,
): UpgradeConfig => {
  return {
    ...fileConfig,
    ...cliOptions,
    excludePaths: [
      ...(fileConfig.excludePaths || []),
      ...(cliOptions.excludePaths || []),
    ],
  };
};
