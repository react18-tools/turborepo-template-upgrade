import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";
import { execSync } from "child_process";

describe("upgrade", () => {
  test("smoke", ({ expect }) => {
    upgradeTemplate(lstCommit.trim());
    upgradeTemplate();
    execSync("rm ../.turborepo-template.lst");
    upgradeTemplate();
    expect(true).toBe(true);
  });
});
