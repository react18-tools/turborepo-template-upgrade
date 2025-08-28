import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";
import { getBaseCommit } from "./utils";
import { execSync } from "child_process";

describe("upgrade", () => {
  test("smoke", async ({ expect }) => {
    await upgradeTemplate(lstCommit.trim());
    getBaseCommit();
    execSync("git restore --stage .");
    execSync("git restore .");
    await upgradeTemplate();
    execSync("git restore --stage .");
    execSync("git restore .");
    expect(true).toBe(true);
  });
});
