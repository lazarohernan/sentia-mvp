import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type ListeningCoachingAction = {
  organizationId: string;
  subjectUserId: string;
  authorUserId: string;
  actionText: string;
  updatedAt: string;
};

type CoachingActionRow = {
  organization_id: string;
  subject_user_id: string;
  author_user_id: string;
  action_text: string;
  updated_at: string;
};

function mapRow(row: CoachingActionRow): ListeningCoachingAction {
  return {
    organizationId: row.organization_id,
    subjectUserId: row.subject_user_id,
    authorUserId: row.author_user_id,
    actionText: row.action_text,
    updatedAt: row.updated_at,
  };
}

export async function getListeningCoachingAction(
  client: Client,
  params: {
    organizationId: string;
    subjectUserId: string;
  },
): Promise<ListeningCoachingAction | null> {
  const { data, error } = await client
    .from("listening_coaching_actions")
    .select("organization_id, subject_user_id, author_user_id, action_text, updated_at")
    .eq("organization_id", params.organizationId)
    .eq("subject_user_id", params.subjectUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as CoachingActionRow);
}

export async function upsertListeningCoachingAction(
  client: Client,
  params: {
    organizationId: string;
    subjectUserId: string;
    authorUserId: string;
    actionText: string;
  },
): Promise<ListeningCoachingAction> {
  const now = new Date().toISOString();
  const payload = {
    organization_id: params.organizationId,
    subject_user_id: params.subjectUserId,
    author_user_id: params.authorUserId,
    action_text: params.actionText,
    updated_at: now,
  };

  const { data, error } = await client
    .from("listening_coaching_actions")
    .upsert(payload as never, {
      onConflict: "organization_id,subject_user_id",
    })
    .select("organization_id, subject_user_id, author_user_id, action_text, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo guardar la acción.");
  }

  return mapRow(data as CoachingActionRow);
}
