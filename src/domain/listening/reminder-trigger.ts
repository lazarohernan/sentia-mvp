import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

type MemberForSurvey = {
  user_id: string;
  branch_id: string | null;
  role: string;
};

export type TriggerListeningSurveyResult = {
  createdCount: number;
};

export async function triggerListeningSurveyForOrganization(
  client: Client,
  params: {
    organizationId: string;
    actorUserId: string;
  },
): Promise<TriggerListeningSurveyResult> {
  const { data: members, error: membersError } = await client
    .from("organization_members")
    .select("user_id, branch_id, role")
    .eq("organization_id", params.organizationId)
    .neq("role", "owner");

  if (membersError || !members) {
    throw new Error("No se pudo cargar el equipo para enviar la encuesta.");
  }

  const recipients = (members as MemberForSurvey[]).filter(
    (member) => member.user_id !== params.actorUserId,
  );

  if (recipients.length === 0) {
    return { createdCount: 0 };
  }

  const runId = new Date().toISOString();
  const rows: Array<Database["public"]["Tables"]["notifications"]["Insert"]> =
    recipients.map((member) => ({
      organization_id: params.organizationId,
      branch_id: member.branch_id,
      audience_type: "user",
      recipient_user_id: member.user_id,
      category: "task",
      tone: "warning",
      title: "Registro de escucha pendiente",
      detail: "Completa tu registro de escucha para este turno.",
      href: "/escucha",
      source_table: "listening_events",
      metadata: {
        dedupe_key: `listening-survey:${runId}:${member.user_id}`,
        trigger: "manual",
        run_id: runId,
      },
    }));

  const { error } = await client.from("notifications").insert(rows as never);

  if (error) {
    throw new Error(`No se pudo enviar la encuesta: ${error.message}`);
  }

  return { createdCount: rows.length };
}
