import { describe, expect, it, vi } from "vitest";

import { triggerListeningSurveyForOrganization } from "./reminder-trigger";

describe("triggerListeningSurveyForOrganization", () => {
  it("creates user notifications for listening participants except the actor", async () => {
    const insert = vi.fn((_payload: unknown) => ({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: "notification-1",
            recipient_user_id: "user-2",
          },
        ],
        error: null,
      }),
    }));
    const existingRunIdEq = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const existingOrgEq = vi.fn().mockReturnValue({ eq: existingRunIdEq });
    const selectExistingNotifications = vi.fn().mockReturnValue({
      eq: existingOrgEq,
    });
    const managerNeq = vi.fn().mockResolvedValue({
      data: [
        {
          user_id: "actor-1",
          branch_id: "branch-1",
          role: "collaborator",
          participates_in_listening: true,
        },
        {
          user_id: "user-2",
          branch_id: "branch-1",
          role: "collaborator",
          participates_in_listening: true,
        },
      ],
      error: null,
    });
    const ownerNeq = vi.fn().mockReturnValue({ neq: managerNeq });
    const listeningEq = vi.fn().mockReturnValue({ neq: ownerNeq });
    const organizationEq = vi.fn().mockReturnValue({ eq: listeningEq });
    const client = {
      from: vi.fn((table: string) => {
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnValue({ eq: organizationEq }),
          };
        }

        return {
          insert,
          select: selectExistingNotifications,
        };
      }),
    } as unknown as Parameters<typeof triggerListeningSurveyForOrganization>[0];

    const result = await triggerListeningSurveyForOrganization(client, {
      organizationId: "org-1",
      actorUserId: "actor-1",
    });

    expect(result).toEqual({ createdCount: 1 });
    expect(insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          audience_type: "user",
          recipient_user_id: "user-2",
          href: "/colaborador?view=evaluacion",
          title: "Registro de escucha pendiente",
        }),
      ]),
    );
  });
});
