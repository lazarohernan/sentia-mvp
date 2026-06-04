import { describe, expect, it } from "vitest";

import {
  canManageTeamMemberInBranchScope,
  canRemoveTeamMember,
} from "./remove-team-member";

describe("canRemoveTeamMember", () => {
  it("allows owners to remove managers and collaborators", () => {
    expect(canRemoveTeamMember("owner", "manager")).toBe(true);
    expect(canRemoveTeamMember("owner", "collaborator")).toBe(true);
  });

  it("blocks removing owners", () => {
    expect(canRemoveTeamMember("owner", "owner")).toBe(false);
    expect(canRemoveTeamMember("manager", "owner")).toBe(false);
  });

  it("allows managers to remove collaborators only", () => {
    expect(canRemoveTeamMember("manager", "collaborator")).toBe(true);
    expect(canRemoveTeamMember("manager", "manager")).toBe(false);
  });
});

describe("canManageTeamMemberInBranchScope", () => {
  it("allows organization-wide actors to manage any branch scope", () => {
    expect(canManageTeamMemberInBranchScope(null, "branch-1")).toBe(true);
    expect(canManageTeamMemberInBranchScope(null, null)).toBe(true);
  });

  it("requires branch-scoped actors to target their own branch", () => {
    expect(canManageTeamMemberInBranchScope("branch-1", "branch-1")).toBe(true);
    expect(canManageTeamMemberInBranchScope("branch-1", "branch-2")).toBe(false);
    expect(canManageTeamMemberInBranchScope("branch-1", null)).toBe(false);
  });
});
