import type { SupabaseClient } from "@supabase/supabase-js";

import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { Database } from "@/lib/supabase/database.types";
import type { CreateListeningEventInput, ListeningEventRow } from "./schemas";
import { listeningLevelLabels } from "./schemas";

type Client = SupabaseClient<Database>;

type RawListeningEvent = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  level: ListeningEventRow["level"];
  note: string | null;
  created_at: string;
  branches: { name: string } | null;
  profiles: { full_name: string } | null;
};

export async function createListeningEvent(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    input: CreateListeningEventInput;
  },
): Promise<ListeningEventRow> {
  const { data, error } = await client
    .from("listening_events")
    .insert({
      organization_id: params.organizationId,
      branch_id: params.input.branchId,
      user_id: params.userId,
      level: params.input.level,
      note: params.input.note ?? null,
    } as never)
    .select(
      `
        id,
        organization_id,
        branch_id,
        user_id,
        level,
        note,
        created_at,
        branches(name),
        profiles(full_name)
      `,
    )
    .single();

  if (error || !data) {
    throw new Error(`Failed to create listening event: ${error?.message}`);
  }

  return mapListeningEvent(data as RawListeningEvent);
}

export async function getListeningEventsByOrganization(
  client: Client,
  organizationId: string,
  limit = 20,
  branchIds?: string[],
  dateRange?: DashboardDateRange,
): Promise<ListeningEventRow[]> {
  let query = client
    .from("listening_events")
    .select(
      `
        id,
        organization_id,
        branch_id,
        user_id,
        level,
        note,
        created_at,
        branches(name),
        profiles(full_name)
      `,
    )
    .eq("organization_id", organizationId);

  if (branchIds && branchIds.length > 0) {
    query = query.in("branch_id", branchIds);
  }

  if (dateRange) {
    query = query
      .gte("created_at", dateRange.startIso)
      .lte("created_at", dateRange.endIso);
  }

  query = query.order("created_at", { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as RawListeningEvent[]).map(mapListeningEvent);
}

export async function getListeningEventsByUser(
  client: Client,
  params: {
    organizationId: string;
    userId: string;
    limit?: number;
    offset?: number;
  },
): Promise<ListeningEventRow[]> {
  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;

  const { data, error } = await client
    .from("listening_events")
    .select(
      `
        id,
        organization_id,
        branch_id,
        user_id,
        level,
        note,
        created_at,
        branches(name),
        profiles(full_name)
      `,
    )
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];

  return (data as RawListeningEvent[]).map(mapListeningEvent);
}

function mapListeningEvent(row: RawListeningEvent): ListeningEventRow {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    branchName: row.branches?.name ?? null,
    userId: row.user_id,
    userName: row.profiles?.full_name ?? "Usuario eliminado",
    level: row.level,
    levelLabel: listeningLevelLabels[row.level],
    note: row.note,
    createdAt: row.created_at,
  };
}
