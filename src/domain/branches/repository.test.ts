import { describe, expect, it, vi } from "vitest";

import {
  getBranchesByOrganization,
  getBranchBySlug,
  updateBranch,
} from "./repository";

describe("getBranchesByOrganization", () => {
  it("returns branches for the organization", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: "b-1", organization_id: "org-1", name: "Mall Norte", slug: "mall-norte", address: null, is_active: true, created_at: "2026-01-01" },
            ],
            error: null,
          }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchesByOrganization>[0];

    const result = await getBranchesByOrganization(client, "org-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "b-1", name: "Mall Norte" });
  });

  it("returns empty array when org has no branches", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchesByOrganization>[0];

    const result = await getBranchesByOrganization(client, "org-1");
    expect(result).toEqual([]);
  });
});

describe("getBranchBySlug", () => {
  it("returns the branch matching slug within an org", async () => {
    const branchData = { id: "b-1", organization_id: "org-1", name: "Mall Norte", slug: "mall-norte", address: null, is_active: true, created_at: "2026-01-01" };
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: branchData, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchBySlug>[0];

    const result = await getBranchBySlug(client, "org-1", "mall-norte");
    expect(result).toMatchObject({ id: "b-1", slug: "mall-norte" });
  });

  it("returns null when slug is not found", async () => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof getBranchBySlug>[0];

    const result = await getBranchBySlug(client, "org-1", "nonexistent");
    expect(result).toBeNull();
  });
});

describe("updateBranch", () => {
  it("updates branch fields and regenerates slug from name", async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "b-1",
                organization_id: "org-1",
                name: "Mall Norte Renovado",
                slug: "mall-norte-renovado",
                address: "Plaza central",
                is_active: false,
                created_at: "2026-01-01",
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const client = {
      from: vi.fn().mockReturnValue({
        update,
      }),
    } as unknown as Parameters<typeof updateBranch>[0];

    const result = await updateBranch(client, "org-1", {
      id: "b-1",
      name: "Mall Norte Renovado",
      address: "Plaza central",
      is_active: false,
    });

    expect(update).toHaveBeenCalledWith({
      name: "Mall Norte Renovado",
      slug: "mall-norte-renovado",
      address: "Plaza central",
      is_active: false,
    });
    expect(result).toMatchObject({
      id: "b-1",
      slug: "mall-norte-renovado",
      is_active: false,
    });
  });
});
