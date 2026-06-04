import { describe, expect, it, vi } from "vitest";

import { getNotificationsForOrganization } from "./repository";

describe("getNotificationsForOrganization", () => {
  it("keeps organization-wide notifications and limits branch-specific ones", async () => {
    const orMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const lteMock = vi.fn().mockReturnValue({ or: orMock });
    const gteMock = vi.fn().mockReturnValue({ lte: lteMock });
    const limitMock = vi.fn().mockReturnValue({ gte: gteMock });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ order: orderMock });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      }),
    } as unknown as Parameters<typeof getNotificationsForOrganization>[0];

    await getNotificationsForOrganization(client, "org-1", {
      startIso: "2026-06-01T00:00:00.000Z",
      endIso: "2026-06-02T23:59:59.999Z",
      branchIds: ["branch-1"],
    });

    expect(orMock).toHaveBeenCalledWith(
      "branch_id.is.null,branch_id.in.(branch-1)",
    );
  });
});
