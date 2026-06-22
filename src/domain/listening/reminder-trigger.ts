import type { SupabaseClient } from "@supabase/supabase-js";

import { dispatchPushForNotificationsIfConfigured } from "@/domain/push/notifications";
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
    actorUserId?: string;
    trigger?: "manual" | "scheduled";
    runId?: string;
  },
): Promise<TriggerListeningSurveyResult> {
  const { data: members, error: membersError } = await client
    .from("organization_members")
    .select("user_id, branch_id, role")
    .eq("organization_id", params.organizationId)
    .eq("role", "collaborator");

  if (membersError || !members) {
    throw new Error("No se pudo cargar el equipo para enviar la encuesta.");
  }

  const recipients = (members as MemberForSurvey[]).filter(
    (member) =>
      member.role === "collaborator" &&
      (!params.actorUserId || member.user_id !== params.actorUserId),
  );

  if (recipients.length === 0) {
    return { createdCount: 0 };
  }

  const runId = params.runId ?? new Date().toISOString();
  const { data: existingNotifications } = await client
    .from("notifications")
    .select("recipient_user_id")
    .eq("organization_id", params.organizationId)
    .eq("metadata->>run_id", runId);
  const existingRecipientIds = new Set(
    ((existingNotifications ?? []) as Array<{ recipient_user_id: string | null }>)
      .map((row) => row.recipient_user_id)
      .filter((userId): userId is string => Boolean(userId)),
  );
  const pendingRecipients = recipients.filter(
    (member) => !existingRecipientIds.has(member.user_id),
  );

  if (pendingRecipients.length === 0) {
    return { createdCount: 0 };
  }

  const rows: Array<Database["public"]["Tables"]["notifications"]["Insert"]> =
    pendingRecipients.map((member) => ({
      organization_id: params.organizationId,
      branch_id: member.branch_id,
      audience_type: "user",
      recipient_user_id: member.user_id,
      category: "task",
      tone: "warning",
      title: "Registro de escucha pendiente",
      detail: "Completa tu registro de escucha para este turno.",
      href: "/colaborador?view=evaluacion",
      source_table: "listening_events",
      metadata: {
        dedupe_key: `listening-survey:${runId}:${member.user_id}`,
        trigger: params.trigger ?? "manual",
        run_id: runId,
      },
    }));

  const { data, error } = await client
    .from("notifications")
    .insert(rows as never)
    .select("*");

  if (error) {
    throw new Error(`No se pudo enviar la encuesta: ${error.message}`);
  }

  await dispatchPushForNotificationsIfConfigured(
    (data ?? []) as Database["public"]["Tables"]["notifications"]["Row"][],
  );

  return { createdCount: rows.length };
}
