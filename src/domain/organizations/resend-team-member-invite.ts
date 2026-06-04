import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createInviteActivationLink } from "./invite-link";
import { canManageTeamMemberInBranchScope } from "./remove-team-member";
import type { TeamMemberAccountStatus } from "./team";

type ServiceClient = SupabaseClient<Database>;

export type ResendTeamMemberInviteResult = {
  inviteLink: string;
  accountStatus: TeamMemberAccountStatus;
};

export async function resendTeamMemberInvite(
  client: ServiceClient,
  params: {
    organizationId: string;
    targetUserId: string;
    siteUrl: string;
    actorBranchId?: string | null;
  },
): Promise<ResendTeamMemberInviteResult> {
  const { data: member, error: memberError } = await client
    .from("organization_members")
    .select("user_id, role, branch_id, profiles(full_name)")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Colaborador no encontrado en tu organizacion.");
  }

  const memberRow = member as {
    role: string;
    branch_id: string | null;
    profiles: { full_name: string } | null;
  };

  if (memberRow.role === "owner") {
    throw new Error("No puedes reenviar invitacion al propietario.");
  }

  if (!canManageTeamMemberInBranchScope(params.actorBranchId ?? null, memberRow.branch_id)) {
    throw new Error("No tienes permisos para administrar esta sucursal.");
  }

  const { data: authData, error: authError } = await client.auth.admin.getUserById(
    params.targetUserId,
  );

  if (authError || !authData.user?.email) {
    throw new Error("No se encontro la cuenta del colaborador.");
  }

  const accountStatus = getAccountStatusFromAuthUser(authData.user);

  if (accountStatus === "active") {
    throw new Error("Este colaborador ya activo su cuenta.");
  }

  const fullName =
    memberRow.profiles?.full_name ??
    authData.user.user_metadata?.full_name ??
    authData.user.email.split("@")[0] ??
    "Colaborador";

  const { inviteLink } = await createInviteActivationLink(client, {
    email: authData.user.email,
    fullName: typeof fullName === "string" ? fullName : "Colaborador",
    siteUrl: params.siteUrl,
  });

  return {
    inviteLink,
    accountStatus: "pending_activation",
  };
}

export function getAccountStatusFromAuthUser(user: {
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
}): TeamMemberAccountStatus {
  if (user.last_sign_in_at) {
    return "active";
  }

  return "pending_activation";
}
