import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardNotification } from "@/domain/dashboard/schemas";
import { formatRelativeDate } from "@/domain/feedback/record-analysis";
import type { Database } from "@/lib/supabase/database.types";
import type { NotificationDraft, NotificationRow } from "./schemas";

type Client = SupabaseClient<Database>;

function mapRowToDashboardNotification(row: NotificationRow): DashboardNotification {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    time: formatRelativeDate(row.created_at),
    href: row.href ?? "/dashboard",
    unread: !row.is_read,
    tone: row.tone,
  };
}

function draftToInsert(draft: NotificationDraft): Database["public"]["Tables"]["notifications"]["Insert"] {
  return {
    organization_id: draft.organizationId,
    branch_id: draft.branchId ?? null,
    audience_type: draft.audienceType,
    audience_role: draft.audienceRole ?? null,
    category: draft.category,
    tone: draft.tone,
    title: draft.title,
    detail: draft.detail,
    href: draft.href,
    source_table: draft.sourceTable ?? null,
    source_id: draft.sourceId ?? null,
    metadata: {
      dedupe_key: draft.dedupeKey,
      ...draft.metadata,
    },
  };
}

export async function findNotificationByDedupeKey(
  client: Client,
  organizationId: string,
  dedupeKey: string,
): Promise<NotificationRow | null> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("metadata->>dedupe_key", dedupeKey)
    .maybeSingle();

  if (error || !data) return null;
  return data as NotificationRow;
}

export async function upsertNotificationDraft(
  client: Client,
  draft: NotificationDraft,
): Promise<void> {
  const existing = await findNotificationByDedupeKey(
    client,
    draft.organizationId,
    draft.dedupeKey,
  );

  const payload = draftToInsert(draft);

  if (existing) {
    const { error } = await client
      .from("notifications")
      .update({
        branch_id: payload.branch_id,
        category: payload.category,
        tone: payload.tone,
        title: payload.title,
        detail: payload.detail,
        href: payload.href,
        source_table: payload.source_table,
        source_id: payload.source_id,
        metadata: payload.metadata,
      } as never)
      .eq("id", existing.id);

    if (error) {
      throw new Error(`Failed to update notification: ${error.message}`);
    }

    return;
  }

  const { error } = await client.from("notifications").insert(payload as never);

  if (error) {
    throw new Error(`Failed to insert notification: ${error.message}`);
  }
}

export async function syncNotificationDrafts(
  client: Client,
  drafts: NotificationDraft[],
): Promise<void> {
  for (const draft of drafts) {
    await upsertNotificationDraft(client, draft);
  }
}

export async function getNotificationsForOrganization(
  client: Client,
  organizationId: string,
  params: {
    startIso?: string;
    endIso?: string;
    branchIds?: string[];
    limit?: number;
  } = {},
): Promise<DashboardNotification[]> {
  const limit = params.limit ?? 20;

  let query = client
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.startIso) {
    query = query.gte("created_at", params.startIso);
  }

  if (params.endIso) {
    query = query.lte("created_at", params.endIso);
  }

  if (params.branchIds && params.branchIds.length > 0) {
    query = query.or(
      `branch_id.is.null,branch_id.in.(${params.branchIds.join(",")})`,
    );
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as NotificationRow[]).map(mapRowToDashboardNotification);
}

export async function markNotificationAsRead(
  client: Client,
  notificationId: string,
): Promise<boolean> {
  const readAt = new Date().toISOString();
  const { data, error } = await client
    .from("notifications")
    .update({
      is_read: true,
      read_at: readAt,
    } as never)
    .eq("id", notificationId)
    .select("id")
    .maybeSingle();

  if (error || !data) return false;
  return true;
}
