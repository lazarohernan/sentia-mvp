import { describe, expect, it, vi } from "vitest";

import type { NotificationRow } from "@/domain/notifications/schemas";
import type { Database } from "@/lib/supabase/database.types";
import { dispatchPushForNotification } from "./notifications";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

function buildNotificationRow(
  overrides: Partial<NotificationRow> = {},
): NotificationRow {
  return {
    id: "notification-1",
    organization_id: "org-1",
    branch_id: null,
    audience_type: "role",
    audience_role: "manager",
    recipient_user_id: null,
    category: "alert",
    tone: "danger",
    title: "Atencion inmediata",
    detail: "Se detecto una alerta operativa en caja.",
    href: "/dashboard#alertas",
    metadata: {},
    source_table: null,
    source_id: null,
    is_read: false,
    read_at: null,
    created_at: "2026-06-19T12:00:00.000Z",
    ...overrides,
  };
}

describe("dispatchPushForNotification", () => {
  it("resolves role recipients and sends web push payloads to active subscriptions", async () => {
    const send = vi.fn().mockResolvedValue({ ok: true });
    const eqEndpoint = vi.fn().mockResolvedValue({ error: null });
    const updateSubscriptions = vi.fn().mockReturnValue({
      eq: eqEndpoint,
    });
    const inUsers = vi.fn().mockResolvedValue({
      data: [
        {
          id: "sub-1",
          organization_id: "org-1",
          user_id: "user-2",
          endpoint: "https://push.example/1",
          subscription: {
            endpoint: "https://push.example/1",
            keys: {
              p256dh: "key-1",
              auth: "auth-1",
            },
          },
          user_agent: "Safari",
          device_label: "iPhone",
          created_at: "2026-06-19T12:00:00.000Z",
          updated_at: "2026-06-19T12:00:00.000Z",
          last_seen_at: "2026-06-19T12:00:00.000Z",
          last_success_at: null,
          last_error_at: null,
          disabled_at: null,
        } satisfies PushSubscriptionRow,
      ],
      error: null,
    });
    const isDisabled = vi.fn().mockReturnValue({ in: inUsers });
    const eqSubscriptions = vi.fn().mockReturnValue({ is: isDisabled });
    const eqMembersRole = vi.fn().mockResolvedValue({
      data: [{ user_id: "user-2" }, { user_id: "user-3" }],
      error: null,
    });
    const eqMembersOrg = vi.fn().mockReturnValue({
      eq: eqMembersRole,
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: eqMembersOrg,
            }),
          };
        }

        if (table === "push_subscriptions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: eqSubscriptions,
            }),
            update: updateSubscriptions,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as Parameters<typeof dispatchPushForNotification>[0];

    const result = await dispatchPushForNotification(
      client,
      buildNotificationRow(),
      { send },
    );

    expect(result).toEqual({ deliveredCount: 1, staleCount: 0 });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://push.example/1",
      }),
      JSON.stringify({
        title: "Atencion inmediata",
        body: "Se detecto una alerta operativa en caja.",
        url: "/dashboard#alertas",
        tag: "notification-1",
        tone: "danger",
      }),
    );
  });
});
