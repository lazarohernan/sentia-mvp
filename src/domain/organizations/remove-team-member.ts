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

export function canManageTeamMemberInBranchScope(
  actorBranchId: string | null,
  targetBranchId: string | null,
): boolean {
  if (!actorBranchId) {
    return true;
  }

  return targetBranchId === actorBranchId;
}

export async function removeTeamMember(
  client: ServiceClient,
  params: {
    organizationId: string;
    targetUserId: string;
    actorUserId: string;
    actorRole: "owner" | "manager";
    actorBranchId?: string | null;
  },
): Promise<void> {
  if (params.targetUserId === params.actorUserId) {
    throw new Error("No puedes eliminarte a ti mismo del equipo.");
  }

  const { data: member, error: memberError } = await client
    .from("organization_members")
    .select("user_id, role, branch_id")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Colaborador no encontrado en tu organizacion.");
  }

  const memberRow = member as {
    role: MemberRole;
    branch_id: string | null;
  };

  if (!canRemoveTeamMember(params.actorRole, memberRow.role)) {
    throw new Error("No tienes permisos para eliminar a esta persona.");
  }

  if (!canManageTeamMemberInBranchScope(params.actorBranchId ?? null, memberRow.branch_id)) {
    throw new Error("No tienes permisos para administrar esta sucursal.");
  }

  const { error: deleteError } = await client
    .from("organization_members")
    .delete()
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId);

  if (deleteError) {
    throw new Error("No se pudo eliminar al colaborador.");
  }
}
