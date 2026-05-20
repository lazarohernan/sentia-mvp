import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { CreateListeningEventInput, ListeningEventRow } from "./schemas";
import { listeningLevelLabels } from "./schemas";

type Client = SupabaseClient<Database>;

type RawListeningEvent = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string;
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
): Promise<ListeningEventRow[]> {
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
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

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
    userName: row.profiles?.full_name ?? "Usuario",
    level: row.level,
    levelLabel: listeningLevelLabels[row.level],
    note: row.note,
    createdAt: row.created_at,
  };
}
