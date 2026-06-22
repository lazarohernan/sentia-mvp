import { describe, expect, it } from "vitest";

import {
  buildCollaboratorViewPath,
  normalizeCollaboratorView,
} from "./portal-navigation";

describe("portal-navigation", () => {
  it("normalizes collaborator views from query params", () => {
    expect(normalizeCollaboratorView(undefined)).toBe("inicio");
    expect(normalizeCollaboratorView("evaluacion")).toBe("evaluacion");
    expect(normalizeCollaboratorView("perfil")).toBe("perfil");
    expect(normalizeCollaboratorView("otro")).toBe("inicio");
  });

  it("builds paths for each collaborator view", () => {
    expect(buildCollaboratorViewPath("inicio")).toBe("/colaborador");
    expect(buildCollaboratorViewPath("evaluacion")).toBe(
      "/colaborador?view=evaluacion",
    );
    expect(buildCollaboratorViewPath("perfil")).toBe("/colaborador?view=perfil");
  });
});
