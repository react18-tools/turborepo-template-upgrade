import { describe, test } from "vitest";
import { upgradeTemplate } from ".";

describe("upgrade", () => {
  test("smoke", ({ expect }) => {
    upgradeTemplate();
    expect(true).toBe(true);
  });
});
