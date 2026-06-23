import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole } from "./schemas";

type ServiceClient = SupabaseClient<Database>;

export function canRemoveTeamMember(
  actorRole: "owner" | "manager",
  targetRole: MemberRole,
): boolean {
  if (targetRole === "owner") {
    return false;
  }

  if (actorRole === "owner") {
    return true;
  }

  return actorRole === "manager" && targetRole === "collaborator";
}

export async function removeTeamMember(
  client: ServiceClient,
  params: {
    organizationId: string;
    targetUserId: string;
    actorUserId: string;
    actorRole: "owner" | "manager";
  },
): Promise<void> {
  if (params.targetUserId === params.actorUserId) {
    throw new Error("No puedes eliminarte a ti mismo del equipo.");
  }

  const { data: member, error: memberError } = await client
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Colaborador no encontrado en tu organizacion.");
  }

  const memberRow = member as {
    role: MemberRole;
  };

  if (!canRemoveTeamMember(params.actorRole, memberRow.role)) {
    throw new Error("No tienes permisos para eliminar a esta persona.");
  }

  const { data: remainingMemberships, error: remainingError } = await client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", params.targetUserId)
    .neq("organization_id", params.organizationId);

  if (remainingError) {
    throw new Error("No se pudo validar el acceso del colaborador.");
  }

  const hasOtherOrganizations = Boolean(remainingMemberships?.length);

  let pushDeleteQuery = client
    .from("push_subscriptions")
    .delete()
    .eq("user_id", params.targetUserId);

  if (hasOtherOrganizations) {
    pushDeleteQuery = pushDeleteQuery.eq("organization_id", params.organizationId);
  }

  const { error: pushDeleteError } = await pushDeleteQuery;

  if (pushDeleteError) {
    throw new Error("No se pudieron limpiar las suscripciones push del colaborador.");
  }

  if (hasOtherOrganizations) {
    const { error: membershipDeleteError } = await client
      .from("organization_members")
      .delete()
      .eq("organization_id", params.organizationId)
      .eq("user_id", params.targetUserId);

    if (membershipDeleteError) {
      throw new Error("No se pudo eliminar al colaborador.");
    }

    return;
  }

  const { error: listeningDetachError } = await client
    .from("listening_events")
    .update({ user_id: null } as never)
    .eq("user_id", params.targetUserId);

  if (listeningDetachError) {
    throw new Error("No se pudo preservar el historial de escucha del colaborador.");
  }

  const { error: followUpDetachError } = await client
    .from("feedback_follow_up_actions")
    .update({ actor_user_id: null } as never)
    .eq("actor_user_id", params.targetUserId);

  if (followUpDetachError) {
    throw new Error("No se pudo preservar el historial de seguimiento del colaborador.");
  }

  const { error: authDeleteError } = await client.auth.admin.deleteUser(
    params.targetUserId,
    false,
  );

  if (authDeleteError) {
    throw new Error("No se pudo eliminar al colaborador.");
  }
}
