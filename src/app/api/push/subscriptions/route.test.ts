import { afterEach, describe, expect, it, vi } from "vitest";

const {
  getUser,
  upsertPushSubscription,
  disablePushSubscription,
  getOrganizationMembershipByUser,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  upsertPushSubscription: vi.fn(),
  disablePushSubscription: vi.fn(),
  getOrganizationMembershipByUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser,
    },
  })),
}));

vi.mock("@/domain/organizations/repository", () => ({
  getOrganizationMembershipByUser,
}));

vi.mock("@/domain/push/repository", () => ({
  upsertPushSubscription,
  disablePushSubscription,
  getUserPushSubscriptionEndpoints: vi.fn(),
}));

import { DELETE, POST } from "./route";

describe("push subscriptions route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    getUser.mockReset();
    upsertPushSubscription.mockReset();
    getOrganizationMembershipByUser.mockReset();
  });

  it("stores the authenticated user push subscription in the current organization", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    getOrganizationMembershipByUser.mockResolvedValue({
      organizationId: "org-1",
    });
    upsertPushSubscription.mockResolvedValue(undefined);

    const response = (await POST(
      new Request("http://localhost/api/push/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: "https://push.example/device-1",
            keys: {
              p256dh: "key-1",
              auth: "auth-1",
            },
          },
          deviceLabel: "iPhone de gerencia",
        }),
      }),
    )) as Response;

    expect(response.status).toBe(200);
    expect(upsertPushSubscription).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        endpoint: "https://push.example/device-1",
        deviceLabel: "iPhone de gerencia",
      }),
    );
  });

  it("disables the authenticated user push subscription by endpoint", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    getOrganizationMembershipByUser.mockResolvedValue({
      organizationId: "org-1",
    });

    const response = (await DELETE(
      new Request("http://localhost/api/push/subscriptions", {
        method: "DELETE",
        body: JSON.stringify({
          endpoint: "https://push.example/device-1",
        }),
      }),
    )) as Response;

    expect(response.status).toBe(200);
    expect(disablePushSubscription).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        endpoint: "https://push.example/device-1",
      }),
    );
  });
});
