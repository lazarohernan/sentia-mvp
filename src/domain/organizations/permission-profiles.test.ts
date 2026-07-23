import { describe, expect, it } from "vitest";

import {
  createPermissionProfileInputSchema,
  inferMemberRoleFromPermissionProfile,
  memberHasBusinessAccess,
  resolveMemberPermissions,
  updatePermissionProfileInputSchema,
} from "./permission-profiles";

describe("inferMemberRoleFromPermissionProfile", () => {
  it("maps operational roles to collaborator", () => {
    expect(
      inferMemberRoleFromPermissionProfile({
        id: "role-1",
        name: "Colaborador",
        permissions: ["summary", "comments"],
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

describe("updatePermissionProfileInputSchema", () => {
  it("accepts the same shape as create", () => {
    expect(
      updatePermissionProfileInputSchema.parse({
        name: "Encargado de turno",
        permissions: ["summary", "alerts"],
      }).name,
    ).toBe("Encargado de turno");
  });
});

describe("resolveMemberPermissions", () => {
  it("gives owners full access", () => {
    expect(
      resolveMemberPermissions({
        role: "owner",
        profile: null,
      }),
    ).toContain("alerts");
  });

  it("uses the assigned profile for collaborators", () => {
    expect(
      resolveMemberPermissions({
        role: "collaborator",
        profile: {
          id: "role-1",
          name: "Operaciones",
          permissions: ["summary", "comments"],
        },
      }),
    ).toEqual(["summary", "comments"]);
  });

  it("gives business access with any dashboard permission", () => {
    expect(
      memberHasBusinessAccess({
        role: "collaborator",
        profile: {
          id: "role-1",
          name: "Operaciones",
          permissions: ["summary"],
        },
      }),
    ).toBe(true);

    expect(
      memberHasBusinessAccess({
        role: "collaborator",
        profile: {
          id: "role-2",
          name: "Sin permisos",
          permissions: [],
        },
      }),
    ).toBe(false);
  });
});
