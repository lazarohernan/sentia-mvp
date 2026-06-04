import { describe, expect, it } from "vitest";

import { getUserInitials } from "./profile";

describe("getUserInitials", () => {
  it("uses first and last name initials", () => {
    expect(getUserInitials("Ana Lopez")).toBe("AL");
  });

  it("uses the first two letters for a single name", () => {
    expect(getUserInitials("Pedro")).toBe("PE");
  });

  it("falls back to U for empty names", () => {
    expect(getUserInitials("   ")).toBe("U");
  });
});
