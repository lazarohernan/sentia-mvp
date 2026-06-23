import type { SupabaseClient } from "@supabase/supabase-js";

import { sanitizeOptionalTextInput } from "@/lib/security/input";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type PushSubscriptionInsert = Database["public"]["Tables"]["push_subscriptions"]["Insert"];
export type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

type WebPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function upsertPushSubscription(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    endpoint: string;
    subscription: WebPushSubscription;
    userAgent?: string | null;
    deviceLabel?: string | null;
  },
): Promise<void> {
  const deviceLabel = sanitizeOptionalTextInput(params.deviceLabel)?.slice(0, 120) ?? null;
  const userAgent = sanitizeOptionalTextInput(params.userAgent)?.slice(0, 300) ?? null;

  const payload: PushSubscriptionInsert = {
    organization_id: params.organizationId,
    user_id: params.userId,
    endpoint: params.endpoint,
    subscription: params.subscription,
    user_agent: userAgent,
    device_label: deviceLabel,
    last_seen_at: new Date().toISOString(),
    disabled_at: null,
    last_error_at: null,
  };

  const { error } = await client
    .from("push_subscriptions")
    .upsert(payload as never, { onConflict: "endpoint" });

  if (error) {
    throw new Error(`Failed to store push subscription: ${error.message}`);
  }
}

export async function disablePushSubscription(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    endpoint: string;
  },
): Promise<void> {
  const { error } = await client
    .from("push_subscriptions")
    .update({
      disabled_at: new Date().toISOString(),
    } as never)
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .eq("endpoint", params.endpoint);

  if (error) {
    throw new Error(`Failed to disable push subscription: ${error.message}`);
  }
}

export async function disablePushSubscriptionByEndpoint(
  client: Client,
  endpoint: string,
): Promise<void> {
  const { error } = await client
    .from("push_subscriptions")
    .update({
      disabled_at: new Date().toISOString(),
    } as never)
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`Failed to disable stale push subscription: ${error.message}`);
  }
}

export async function getUserPushSubscriptionEndpoints(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
  },
): Promise<string[]> {
  const { data, error } = await client
    .from("push_subscriptions")
    .select("endpoint")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .is("disabled_at", null);

  if (error || !data) {
    return [];
  }

  return (data as Array<{ endpoint: string }>).map((row) => row.endpoint);
}

export async function getActivePushSubscriptionsForUsers(
  client: Client,
  params: {
    organizationId: string;
    userIds: string[];
  },
): Promise<PushSubscriptionRow[]> {
  if (params.userIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("push_subscriptions")
    .select("*")
    .eq("organization_id", params.organizationId)
    .is("disabled_at", null)
    .in("user_id", params.userIds);

  if (error || !data) {
    return [];
  }

  return data as PushSubscriptionRow[];
}

export async function markPushSubscriptionDelivered(
  client: Client,
  endpoint: string,
): Promise<void> {
  const { error } = await client
    .from("push_subscriptions")
    .update({
      last_success_at: new Date().toISOString(),
      last_error_at: null,
      last_seen_at: new Date().toISOString(),
    } as never)
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`Failed to mark push delivery success: ${error.message}`);
  }
}

export async function markPushSubscriptionFailed(
  client: Client,
  endpoint: string,
): Promise<void> {
  const { error } = await client
    .from("push_subscriptions")
    .update({
      last_error_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    } as never)
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`Failed to mark push delivery failure: ${error.message}`);
  }
}
