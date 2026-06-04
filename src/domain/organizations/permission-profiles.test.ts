import { describe, expect, it } from "vitest";

import {
  createPermissionProfileInputSchema,
  inferMemberRoleFromPermissionProfile,
} from "./permission-profiles";

describe("inferMemberRoleFromPermissionProfile", () => {
  it("maps operational roles to collaborator", () => {
    expect(
      inferMemberRoleFromPermissionProfile({
        id: "role-1",
        name: "Colaborador",
        permissions: ["listening"],
      }),
    ).toBe("collaborator");
  });

  it("maps platform management roles to manager", () => {
    expect(
      inferMemberRoleFromPermissionProfile({
        id: "role-2",
        name: "Gerente de tienda",
        permissions: ["summary", "team"],
      }),
    ).toBe("manager");
  });
});

describe("createPermissionProfileInputSchema", () => {
  it("normalizes duplicated permissions", () => {
    expect(
      createPermissionProfileInputSchema.parse({
        name: "Gerente de tienda",
        permissions: ["summary", "summary", "team"],
      }).permissions,
    ).toEqual(["summary", "team"]);
  });

  it("rejects unknown permissions", () => {
    expect(() =>
      createPermissionProfileInputSchema.parse({
        name: "Rol incorrecto",
        permissions: ["billing"],
      }),
    ).toThrow();
  });
});
