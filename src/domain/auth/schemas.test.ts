import { describe, expect, it } from "vitest";

import {
  getSafeRedirectPath,
  signInSchema,
  signUpSchema,
} from "./schemas";

describe("signInSchema", () => {
  it("accepts email and password credentials", () => {
    const credentials = signInSchema.parse({
      email: "  Gerente@Empresa.com  ",
      password: "super-secreto",
    });

    expect(credentials.email).toBe("gerente@empresa.com");
  });

  it("rejects invalid email and short password", () => {
    const result = signInSchema.safeParse({
      email: "gerente",
      password: "123",
    });

    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("requires a person and company name for onboarding", () => {
    const account = signUpSchema.parse({
      fullName: "  Dennis   Romero ",
      companyName: " Cafe   Piloto ",
      email: "dennis@empresa.com",
      password: "super-secreto",
    });

    expect(account.companyName).toBe("Cafe Piloto");
    expect(account.fullName).toBe("Dennis Romero");
  });
});

describe("getSafeRedirectPath", () => {
  it("allows internal dashboard redirects", () => {
    expect(getSafeRedirectPath("/dashboard/comments")).toBe(
      "/dashboard/comments",
    );
  });

  it("falls back when redirect is external or empty", () => {
    expect(getSafeRedirectPath("https://malicioso.com")).toBe("/dashboard");
    expect(getSafeRedirectPath("")).toBe("/dashboard");
  });
});
