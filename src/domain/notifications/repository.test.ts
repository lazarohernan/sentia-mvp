import { describe, expect, it, vi } from "vitest";

import {
  deleteNotification,
  getNotificationsForOrganization,
  getNotificationsForUser,
  isListeningSurveyNotification,
} from "./repository";
import type { NotificationRow } from "./schemas";

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

describe("getNotificationsForUser", () => {
  it("omits completed listening survey notifications", async () => {
    const limitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "pending-survey",
          title: "Registro de escucha pendiente",
          detail: "Completa tu registro de escucha para este turno.",
          href: "/colaborador?view=evaluacion",
          tone: "warning",
          is_read: false,
          created_at: "2026-06-16T10:00:00.000Z",
          metadata: { dedupe_key: "listening-survey:run-1:user-1" },
        },
        {
          id: "completed-survey",
          title: "Registro de escucha pendiente",
          detail: "Completa tu registro de escucha para este turno.",
          href: "/colaborador?view=evaluacion",
          tone: "warning",
          is_read: true,
          read_at: "2026-06-16T11:00:00.000Z",
          created_at: "2026-06-16T09:00:00.000Z",
          metadata: { dedupe_key: "listening-survey:run-1:user-1" },
        },
        {
          id: "other",
          title: "Otro aviso",
          detail: "Detalle",
          href: "/dashboard",
          tone: "success",
          is_read: true,
          read_at: "2026-06-16T08:00:00.000Z",
          created_at: "2026-06-16T08:00:00.000Z",
          metadata: {},
        },
      ] satisfies Partial<NotificationRow>[],
      error: null,
    });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const recipientEq = vi.fn().mockReturnValue({ order: orderMock });
    const audienceEq = vi.fn().mockReturnValue({ eq: recipientEq });
    const organizationEq = vi.fn().mockReturnValue({ eq: audienceEq });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: organizationEq,
        }),
      }),
    } as unknown as Parameters<typeof getNotificationsForUser>[0];

    const notifications = await getNotificationsForUser(client, {
      organizationId: "org-1",
      userId: "user-1",
    });

    expect(notifications).toHaveLength(2);
    expect(notifications.map((notification) => notification.id)).toEqual([
      "pending-survey",
      "other",
    ]);
    expect(notifications[0]?.isListeningSurvey).toBe(true);
  });
});

describe("isListeningSurveyNotification", () => {
  it("detects listening survey metadata", () => {
    expect(
      isListeningSurveyNotification({
        metadata: { dedupe_key: "listening-survey:run:user" },
      } as unknown as NotificationRow),
    ).toBe(true);
    expect(
      isListeningSurveyNotification({
        metadata: { dedupe_key: "report-ready:month" },
      } as unknown as NotificationRow),
    ).toBe(false);
  });
});

describe("deleteNotification", () => {
  it("deletes a notification by id", async () => {
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "notification-1",
          metadata: { dedupe_key: "report-ready:month" },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "notification-1" },
        error: null,
      });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof deleteNotification>[0];

    await expect(deleteNotification(client, "notification-1")).resolves.toBe(true);
  });

  it("blocks deleting listening survey notifications", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: "survey-1",
        metadata: { dedupe_key: "listening-survey:run:user" },
      },
      error: null,
    });
    const deleteMock = vi.fn();
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
        }),
        delete: deleteMock,
      }),
    } as unknown as Parameters<typeof deleteNotification>[0];

    await expect(deleteNotification(client, "survey-1")).resolves.toBe(false);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns false when the notification cannot be deleted", async () => {
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          id: "notification-1",
          metadata: { dedupe_key: "report-ready:month" },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: null,
      });
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }),
          }),
        }),
      }),
    } as unknown as Parameters<typeof deleteNotification>[0];

    await expect(deleteNotification(client, "notification-1")).resolves.toBe(false);
  });
});
