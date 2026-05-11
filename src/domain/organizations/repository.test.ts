import { describe, expect, it, vi } from "vitest";

import { getOrganizationByUser } from "./repository";

describe("getOrganizationByUser", () => {
  it("returns the first organization for the user", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ organizations: { id: "org-1", name: "Cafe Central", slug: "cafe-central", created_at: "2026-01-01" } }],
            error: null,
          }),
        }),
      }),
    } as unknown as Parameters<typeof getOrganizationByUser>[0];

    const result = await getOrganizationByUser(client, "user-1");
    expect(result).toMatchObject({ id: "org-1", name: "Cafe Central" });
  });

  it("returns null when user has no organization", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as unknown as Parameters<typeof getOrganizationByUser>[0];

    const result = await getOrganizationByUser(client, "user-1");
    expect(result).toBeNull();
  });
});
