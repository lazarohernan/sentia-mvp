import { describe, expect, it } from "vitest";

import { canRemoveTeamMember } from "./remove-team-member";

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
