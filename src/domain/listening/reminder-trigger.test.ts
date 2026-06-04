import { describe, expect, it, vi } from "vitest";

import { triggerListeningSurveyForOrganization } from "./reminder-trigger";

describe("triggerListeningSurveyForOrganization", () => {
  it("creates user notifications for non-owner team members except the actor", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const neq = vi.fn().mockResolvedValue({
      data: [
        { user_id: "actor-1", branch_id: "branch-1", role: "manager" },
        { user_id: "user-2", branch_id: "branch-1", role: "collaborator" },
        { user_id: "user-3", branch_id: null, role: "manager" },
      ],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ neq });
    const client = {
      from: vi.fn((table: string) => {
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnValue({ eq }),
          };
        }

        return { insert };
      }),
    } as unknown as Parameters<typeof triggerListeningSurveyForOrganization>[0];

    const result = await triggerListeningSurveyForOrganization(client, {
      organizationId: "org-1",
      actorUserId: "actor-1",
    });

    expect(result).toEqual({ createdCount: 2 });
    expect(insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          audience_type: "user",
          recipient_user_id: "user-2",
          href: "/escucha",
          title: "Registro de escucha pendiente",
        }),
        expect.objectContaining({
          recipient_user_id: "user-3",
        }),
      ]),
    );
  });
});
