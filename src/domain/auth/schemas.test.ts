import { describe, expect, it } from "vitest";

import {
  activateAccountSchema,
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

describe("activateAccountSchema", () => {
  it("requires matching passwords", () => {
    const result = activateAccountSchema.safeParse({
      fullName: "Ana Lopez",
      password: "super-secreto",
      confirmPassword: "otra-clave",
    });

    expect(result.success).toBe(false);
  });
});
