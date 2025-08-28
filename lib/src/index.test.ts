import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";
import { getBaseCommit } from "./utils";
import { execSync } from "child_process";

describe("upgrade", () => {
  test(
    "smoke",
    async ({ expect }) => {
      await upgradeTemplate(lstCommit.trim());
      getBaseCommit();
      execSync("git reset --hard HEAD");
      await upgradeTemplate();
      execSync("git reset --hard HEAD");
      expect(true).toBe(true);
    },
    { timeout: 10000 },
  );
});
