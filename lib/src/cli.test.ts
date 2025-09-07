import { describe, test, vi, beforeEach } from "vitest";

// Mock the upgradeTemplate function
const mockUpgradeTemplate = vi.fn();
vi.mock(".", () => ({
  upgradeTemplate: mockUpgradeTemplate
}));

interface ParsedOptions {
  debug?: boolean;
  dryRun?: boolean;
  templateUrl?: string;
  excludePaths?: string[];
  skipInstall?: boolean;
  remoteName?: string;
  maxPatchRetries?: number;
  skipCleanCheck?: boolean;
  help?: boolean;
}

// Helper function to parse CLI arguments
const parseArgs = (args: string[]): ParsedOptions => {
  const options: ParsedOptions = {};
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
        if (i + 1 < args.length) options.templateUrl = args[++i];
        break;
      case '--exclude':
        if (i + 1 < args.length) options.excludePaths = args[++i]?.split(',') || [];
        break;
      case '--skip-install':
        options.skipInstall = true;
        break;
      case '--remote-name':
        if (i + 1 < args.length) options.remoteName = args[++i];
        break;
      case '--max-retries':
        if (i + 1 < args.length) {
          const value = parseInt(args[++i]);
          if (!isNaN(value) && value > 0) options.maxPatchRetries = value;
        }
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

describe("CLI argument parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpgradeTemplate.mockClear();
  });

  test("should parse debug flag", ({ expect }) => {
    expect(parseArgs(["--debug"])).toEqual({ debug: true });
  });

  test("should parse dry-run flag", ({ expect }) => {
    expect(parseArgs(["--dry-run"])).toEqual({ dryRun: true });
  });

  test("should parse template-url option", ({ expect }) => {
    const customUrl = "https://github.com/custom/template";
    expect(parseArgs(["--template-url", customUrl])).toEqual({ templateUrl: customUrl });
  });

  test("should parse exclude option", ({ expect }) => {
    expect(parseArgs(["--exclude", "docs,examples"])).toEqual({ excludePaths: ["docs", "examples"] });
  });

  test("should parse skip-install flag", ({ expect }) => {
    expect(parseArgs(["--skip-install"])).toEqual({ skipInstall: true });
  });

  test("should parse remote-name option", ({ expect }) => {
    expect(parseArgs(["--remote-name", "upstream"])).toEqual({ remoteName: "upstream" });
  });

  test("should parse max-retries option", ({ expect }) => {
    expect(parseArgs(["--max-retries", "5"])).toEqual({ maxPatchRetries: 5 });
  });

  test("should parse skip-clean-check flag", ({ expect }) => {
    expect(parseArgs(["--skip-clean-check"])).toEqual({ skipCleanCheck: true });
  });

  test("should parse multiple options", ({ expect }) => {
    const args = ["--debug", "--dry-run", "--exclude", "docs,examples", "--skip-install"];
    expect(parseArgs(args)).toEqual({
      debug: true,
      dryRun: true,
      excludePaths: ["docs", "examples"],
      skipInstall: true
    });
  });

  test("should detect help flag", ({ expect }) => {
    expect(parseArgs(["--help"])).toEqual({ help: true });
  });

  test("should handle missing values gracefully", ({ expect }) => {
    expect(parseArgs(["--template-url"])).toEqual({});
    expect(parseArgs(["--exclude"])).toEqual({});
    expect(parseArgs(["--remote-name"])).toEqual({});
    expect(parseArgs(["--max-retries"])).toEqual({});
  });

  test("should handle invalid max-retries values", ({ expect }) => {
    expect(parseArgs(["--max-retries", "invalid"])).toEqual({});
    expect(parseArgs(["--max-retries", "0"])).toEqual({});
    expect(parseArgs(["--max-retries", "-1"])).toEqual({});
  });
});