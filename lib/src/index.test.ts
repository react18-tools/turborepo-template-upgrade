import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";
import { getBaseCommit } from "./utils";
import { execSync } from "child_process";

describe("upgrade", () => {
  test("smoke", async ({ expect }) => {
    await Promise.all([upgradeTemplate(lstCommit.trim()), upgradeTemplate()]);
    getBaseCommit();
    execSync("git restore .");
    expect(true).toBe(true);
  });
});
