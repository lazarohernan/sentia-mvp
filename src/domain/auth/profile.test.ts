import { describe, expect, it } from "vitest";

import { getUserInitials, formatUserShortName } from "./profile";

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

describe("formatUserShortName", () => {
  it("uses first name and last initial", () => {
    expect(formatUserShortName("Hernan Lazaro")).toBe("Hernan L.");
  });

  it("returns a single name unchanged", () => {
    expect(formatUserShortName("Pedro")).toBe("Pedro");
  });

  it("falls back to Usuario for empty names", () => {
    expect(formatUserShortName("   ")).toBe("Usuario");
  });
});
