import { afterEach, describe, expect, it } from "vitest";

import {
  createBranchQrToken,
  getBranchIdFromQrToken,
  verifyBranchQrTokenSignature,
} from "./qr-token";

const sampleBranch = {
  branchId: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
  branchSlug: "mall-norte",
  organizationId: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
};

describe("branch qr token", () => {
  afterEach(() => {
    delete process.env.QR_SIGNING_SECRET;
  });

  it("creates and verifies a signed token", () => {
    process.env.QR_SIGNING_SECRET = "test-secret";

    const token = createBranchQrToken(sampleBranch);

    expect(getBranchIdFromQrToken(token)).toBe(sampleBranch.branchId);
    expect(verifyBranchQrTokenSignature(token, sampleBranch)).toBe(true);
    expect(
      verifyBranchQrTokenSignature(token, {
        ...sampleBranch,
        branchSlug: "otra-sucursal",
      }),
    ).toBe(false);
  });

  it("rejects tampered tokens", () => {
    process.env.QR_SIGNING_SECRET = "test-secret";

    const token = createBranchQrToken(sampleBranch);
    const tamperedToken = `${token.slice(0, -1)}x`;

    expect(verifyBranchQrTokenSignature(tamperedToken, sampleBranch)).toBe(false);
  });
});
