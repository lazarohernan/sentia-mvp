import { describe, expect, it, afterEach } from "vitest";

import { buildSignedBranchQrLink } from "./qr-link";

const branch = {
  id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
  organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
  name: "Mall Norte",
  slug: "mall-norte",
  address: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("buildSignedBranchQrLink", () => {
  afterEach(() => {
    delete process.env.QR_SIGNING_SECRET;
  });

  it("builds a signed qr url for a branch", () => {
    process.env.QR_SIGNING_SECRET = "test-secret";

    const link = buildSignedBranchQrLink(branch, "https://perks.app");

    expect(link.path.startsWith("/q/")).toBe(true);
    expect(link.url.startsWith("https://perks.app/q/")).toBe(true);
  });
});
