import type { PushSubscription } from "web-push";

import type { NotificationRow } from "@/domain/notifications/schemas";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";
import { hasWebPushEnv, getWebPushEnv } from "@/lib/push/env";
import {
  disablePushSubscriptionByEndpoint,
  getActivePushSubscriptionsForUsers,
  markPushSubscriptionDelivered,
  markPushSubscriptionFailed,
  type PushSubscriptionRow,
} from "./repository";

type SendResult = Awaited<ReturnType<typeof defaultSendWebPush>>;
type ServiceClient = ReturnType<typeof createServiceClient>;

function buildPushPayload(notification: NotificationRow) {
  return JSON.stringify({
    title: notification.title,
    body: notification.detail,
    url: notification.href ?? "/dashboard",
    tag: notification.id,
    tone: notification.tone,
  });
}

async function resolveRecipientUserIds(
  client: ServiceClient,
  notification: NotificationRow,
): Promise<string[]> {
  if (notification.audience_type === "user" && notification.recipient_user_id) {
    return [notification.recipient_user_id];
  }

  const baseQuery = client
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", notification.organization_id);

  const query =
    notification.audience_type === "role" && notification.audience_role
      ? baseQuery.eq("role", notification.audience_role)
      : baseQuery;

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return Array.from(
    new Set(
      (data as Array<{ user_id: string | null }>)
        .map((row) => row.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );
}

function isStaleEndpointError(error: unknown) {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode)
      : null;

  return statusCode === 404 || statusCode === 410;
}

let webPushConfigured = false;

async function defaultSendWebPush(subscription: PushSubscription, payload: string) {
  if (!webPushConfigured) {
    const webPush = await import("web-push");
    const { publicKey, privateKey, subject } = getWebPushEnv();
    webPush.setVapidDetails(subject, publicKey, privateKey);
    webPushConfigured = true;
  }

  const webPush = await import("web-push");
  return webPush.sendNotification(subscription, payload);
}

export async function dispatchPushForNotification(
  client: ServiceClient,
  notification: NotificationRow,
  deps: {
    send?: (subscription: PushSubscription, payload: string) => Promise<SendResult>;
  } = {},
): Promise<{ deliveredCount: number; staleCount: number }> {
  const recipientUserIds = await resolveRecipientUserIds(client, notification);
  const subscriptions = await getActivePushSubscriptionsForUsers(client, {
    organizationId: notification.organization_id,
    userIds: recipientUserIds,
  });

  if (subscriptions.length === 0) {
    return { deliveredCount: 0, staleCount: 0 };
  }

  const payload = buildPushPayload(notification);
  const send = deps.send ?? defaultSendWebPush;

  let deliveredCount = 0;
  let staleCount = 0;

  for (const row of subscriptions) {
    try {
      await send(row.subscription as unknown as PushSubscription, payload);
      deliveredCount += 1;
      await markPushSubscriptionDelivered(client, row.endpoint);
    } catch (error) {
      if (isStaleEndpointError(error)) {
        staleCount += 1;
        await disablePushSubscriptionByEndpoint(client, row.endpoint);
        continue;
      }

      await markPushSubscriptionFailed(client, row.endpoint);
    }
  }

  return { deliveredCount, staleCount };
}

export async function dispatchPushForNotificationIfConfigured(
  notification: NotificationRow,
): Promise<void> {
  if (!hasSupabaseServiceEnv() || !hasWebPushEnv()) {
    return;
  }

  const client = createServiceClient();
  await dispatchPushForNotification(client, notification);
}

export async function dispatchPushForNotificationsIfConfigured(
  notifications: NotificationRow[],
): Promise<void> {
  if (!hasSupabaseServiceEnv() || !hasWebPushEnv()) {
    return;
  }

  const client = createServiceClient();

  for (const notification of notifications) {
    await dispatchPushForNotification(client, notification);
  }
}
