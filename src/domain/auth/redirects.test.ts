import { describe, expect, it } from "vitest";

import { getHomePathForRole, getSafeRedirectPath, buildInviteCallbackUrl } from "./redirects";

describe("auth redirects", () => {
  it("sends collaborators to their portal by default", () => {
    expect(getHomePathForRole("collaborator")).toBe("/colaborador");
    expect(getHomePathForRole("manager")).toBe("/dashboard");
    expect(getHomePathForRole("owner")).toBe("/dashboard");
  });

  it("keeps internal redirect paths safe", () => {
    expect(getSafeRedirectPath("/escucha")).toBe("/escucha");
    expect(getSafeRedirectPath("https://evil.test")).toBe("/dashboard");
  });

  it("builds invite callback links with token hash", () => {
    expect(
      buildInviteCallbackUrl("http://localhost:3001", "abc123", "/auth/activar-cuenta"),
    ).toBe(
      "http://localhost:3001/auth/callback?token_hash=abc123&type=invite&next=%2Fauth%2Factivar-cuenta",
    );
  });
});
