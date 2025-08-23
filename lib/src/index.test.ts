import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";
import { rmSync } from "fs";
import { resolve } from "path";

describe("upgrade", () => {
  test("smoke", async ({ expect }) => {
    await Promise.all([upgradeTemplate(lstCommit.trim()), upgradeTemplate()]);
    rmSync(resolve(process.cwd(), "./.turborepo-template.lst"));
    upgradeTemplate();
    expect(true).toBe(true);
  });
});
