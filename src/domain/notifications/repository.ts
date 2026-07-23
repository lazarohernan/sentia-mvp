import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardNotification } from "@/domain/dashboard/schemas";
import { formatRelativeDate } from "@/domain/feedback/record-analysis";
import type { Database } from "@/lib/supabase/database.types";
import { dispatchPushForNotificationIfConfigured } from "@/domain/push/notifications";
import type { NotificationDraft, NotificationRow } from "./schemas";

type Client = SupabaseClient<Database>;

function mapRowToDashboardNotification(row: NotificationRow): DashboardNotification {
  const listeningSurvey = isListeningSurveyNotification(row);

  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    time: formatRelativeDate(row.created_at),
    createdAtIso: row.created_at,
    href: row.href ?? "/dashboard",
    unread: !row.is_read,
    tone: row.tone,
    isListeningSurvey: listeningSurvey,
  };
}

export function isListeningSurveyNotification(row: NotificationRow) {
  const metadata = row.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  const dedupeKey = "dedupe_key" in metadata ? metadata.dedupe_key : null;
  return typeof dedupeKey === "string" && dedupeKey.startsWith("listening-survey:");
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
): Promise<"inserted" | "updated"> {
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

    return "updated";
  }

  const { data, error } = await client
    .from("notifications")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to insert notification: ${error.message}`);
  }

  await dispatchPushForNotificationIfConfigured(data as NotificationRow);
  return "inserted";
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

  return (data as NotificationRow[])
    .filter((row) => !isListeningSurveyNotification(row))
    .map(mapRowToDashboardNotification);
}

export async function getNotificationsForUser(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    limit?: number;
  },
): Promise<DashboardNotification[]> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("audience_type", "user")
    .eq("recipient_user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 20);

  if (error || !data) return [];

  return (data as NotificationRow[])
    .filter((row) => !(isListeningSurveyNotification(row) && row.is_read))
    .map(mapRowToDashboardNotification);
}

export async function getNotificationById(
  client: Client,
  notificationId: string,
): Promise<NotificationRow | null> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .maybeSingle();

  if (error || !data) return null;
  return data as NotificationRow;
}

export async function getActiveListeningSurveyNotificationForUser(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
  },
): Promise<NotificationRow | null> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("audience_type", "user")
    .eq("recipient_user_id", params.userId)
    .eq("category", "task")
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !data) return null;

  return (
    (data as NotificationRow[]).find((row) => isListeningSurveyNotification(row)) ??
    null
  );
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

export async function deleteNotification(
  client: Client,
  notificationId: string,
): Promise<boolean> {
  const notification = await getNotificationById(client, notificationId);

  if (!notification) {
    return false;
  }

  if (isListeningSurveyNotification(notification)) {
    return false;
  }

  const { data, error } = await client
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .select("id")
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

export async function getNotificationsPageForOrganization(
  client: Client,
  organizationId: string,
  params: {
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{
  items: DashboardNotification[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await client
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { items: [], page, pageSize, total: 0, hasMore: false };
  }

  const items = (data as NotificationRow[])
    .filter((row) => !isListeningSurveyNotification(row))
    .map(mapRowToDashboardNotification);
  const total = count ?? items.length;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + data.length < total,
  };
}

export async function deleteNotificationsByIds(
  client: Client,
  notificationIds: string[],
): Promise<{ deletedIds: string[]; skippedIds: string[] }> {
  const deletedIds: string[] = [];
  const skippedIds: string[] = [];

  for (const notificationId of notificationIds) {
    const deleted = await deleteNotification(client, notificationId);
    if (deleted) {
      deletedIds.push(notificationId);
    } else {
      skippedIds.push(notificationId);
    }
  }

  return { deletedIds, skippedIds };
}

export async function deleteAllDeletableNotificationsForOrganization(
  client: Client,
  organizationId: string,
): Promise<{ deletedIds: string[]; skippedIds: string[] }> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return { deletedIds: [], skippedIds: [] };
  }

  const deletableIds = (data as NotificationRow[])
    .filter((row) => !isListeningSurveyNotification(row))
    .map((row) => row.id);

  return deleteNotificationsByIds(client, deletableIds);
}
