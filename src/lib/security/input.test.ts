import { describe, expect, it } from "vitest";

import {
  sanitizeEmailInput,
  sanitizeOptionalTextInput,
  sanitizeTextInput,
} from "./input";

describe("sanitizeTextInput", () => {
  it("trims, normalizes and collapses whitespace", () => {
    expect(sanitizeTextInput("  Cafe\u0007   Norte  ")).toBe("Cafe Norte");
  });
});

describe("sanitizeEmailInput", () => {
  it("normalizes casing and whitespace", () => {
    expect(sanitizeEmailInput("  Gerente@Empresa.COM ")).toBe(
      "gerente@empresa.com",
    );
  });
});

describe("sanitizeOptionalTextInput", () => {
  it("returns undefined for empty normalized values", () => {
    expect(sanitizeOptionalTextInput("   ")).toBeUndefined();
  });
});
