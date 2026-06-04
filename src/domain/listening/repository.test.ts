import { describe, expect, it, vi } from "vitest";

import { getListeningEventsByOrganization } from "./repository";

describe("getListeningEventsByOrganization", () => {
  it("limits events to allowed branches when provided", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockReturnValue(query);
    const client = {
      from: vi.fn().mockReturnValue(query),
    } as unknown as Parameters<typeof getListeningEventsByOrganization>[0];

    await getListeningEventsByOrganization(client, "org-1", 20, ["branch-1"]);

    expect(query.in).toHaveBeenCalledWith("branch_id", ["branch-1"]);
  });

  it("limits events to the selected date range", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    query.lte.mockReturnValue(query);
    query.order.mockReturnValue(query);
    const client = {
      from: vi.fn().mockReturnValue(query),
    } as unknown as Parameters<typeof getListeningEventsByOrganization>[0];

    await getListeningEventsByOrganization(client, "org-1", 20, undefined, {
      period: "7d",
      label: "Últimos 7 días",
      startDate: "2026-06-01",
      endDate: "2026-06-07",
      startIso: "2026-06-01T06:00:00.000Z",
      endIso: "2026-06-08T05:59:59.999Z",
    });

    expect(query.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-06-01T06:00:00.000Z",
    );
    expect(query.lte).toHaveBeenCalledWith(
      "created_at",
      "2026-06-08T05:59:59.999Z",
    );
  });
});
