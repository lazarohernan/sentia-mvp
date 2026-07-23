import { describe, expect, it } from "vitest";

import {
  getHomePathForMemberAccess,
  resolveMemberAccess,
} from "./member-access";

describe("resolveMemberAccess", () => {
  it("allows listening-only collaborators into the portal", () => {
    const access = resolveMemberAccess({
      role: "collaborator",
      profile: null,
      participatesInListening: true,
    });

    expect(access.canAccessCollaboratorPortal).toBe(true);
    expect(access.canAccessDashboard).toBe(false);
    expect(getHomePathForMemberAccess({
      role: "collaborator",
      profile: null,
      participatesInListening: true,
    })).toBe("/colaborador");
  });

  it("allows platform collaborators with listening into both spaces", () => {
    const access = resolveMemberAccess({
      role: "collaborator",
      profile: {
        id: "role-1",
        name: "Operaciones",
        permissions: ["summary", "alerts"],
      },
      participatesInListening: true,
    });

    expect(access.canAccessDashboard).toBe(true);
    expect(access.canAccessCollaboratorPortal).toBe(true);
    expect(
      getHomePathForMemberAccess({
        role: "collaborator",
        profile: {
          id: "role-1",
          name: "Operaciones",
          permissions: ["summary", "alerts"],
        },
        participatesInListening: true,
      }),
    ).toBe("/dashboard");
  });

  it("blocks owners and managers from listening participation", () => {
    const access = resolveMemberAccess({
      role: "owner",
      profile: null,
      participatesInListening: true,
    });

    expect(access.canAccessCollaboratorPortal).toBe(false);
    expect(access.canAccessDashboard).toBe(true);
  });
});
