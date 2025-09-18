import { access, readFile } from "node:fs/promises";
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
}

/**
 * Load configuration from .tt-upgrade.config.json if it exists
 */
export const loadConfig = async (cwd: string): Promise<UpgradeConfig> => {
  const configPath = resolve(cwd, ".tt-upgrade.config.json");

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
