import { describe, expect, it, vi } from "vitest";

import { getBranchQrScanCounts } from "./qr-scans";

describe("getBranchQrScanCounts", () => {
  it("limits scan counts to allowed branches when provided", async () => {
    const inMock = vi.fn().mockResolvedValue({
      data: [{ branch_id: "branch-1" }, { branch_id: "branch-1" }],
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ in: inMock });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      }),
    } as unknown as Parameters<typeof getBranchQrScanCounts>[0];

    const result = await getBranchQrScanCounts(client, "org-1", ["branch-1"]);

    expect(inMock).toHaveBeenCalledWith("branch_id", ["branch-1"]);
    expect(result).toEqual({ "branch-1": 2 });
  });
});
