import { describe, expect, it, vi } from "vitest";

import { getPublicSiteHost } from "./public-site-host";

describe("getPublicSiteHost", () => {
  it("prefers NEXT_PUBLIC_APP_URL host over request host", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://perksay.com");

    expect(getPublicSiteHost("6a3aab9e050b550009668bfa--plataformamvp.netlify.app")).toBe(
      "perksay.com",
    );
  });

  it("falls back to request host when app url is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(getPublicSiteHost("localhost:3000")).toBe("localhost:3000");
  });
});
