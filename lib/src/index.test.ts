import { describe, test } from "vitest";
import { upgradeTemplate } from ".";
import lstCommit from "../../.turborepo-template.lst?raw";

describe("upgrade", () => {
  test("smoke", ({ expect }) => {
    upgradeTemplate(lstCommit.trim());
    upgradeTemplate();
    expect(true).toBe(true);
  });
});
