import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { createInviteActivationLink } from "./invite-link";
import type { TeamMemberAccountStatus } from "./team";

type ServiceClient = SupabaseClient<Database>;

const inviteRoleLabels = {
  owner: "Propietario",
  manager: "Gerente",
  collaborator: "Colaborador",
} as const;

export type ResendTeamMemberInviteResult = {
  inviteLink: string;
  email: string;
  fullName: string;
  roleLabel: string;
  accountStatus: TeamMemberAccountStatus;
};

export async function resendTeamMemberInvite(
  client: ServiceClient,
  params: {
    organizationId: string;
    targetUserId: string;
    siteUrl: string;
  },
): Promise<ResendTeamMemberInviteResult> {
  const { data: member, error: memberError } = await client
    .from("organization_members")
    .select("user_id, role, profiles(full_name), organization_roles(name)")
    .eq("organization_id", params.organizationId)
    .eq("user_id", params.targetUserId)
    .maybeSingle();

  if (memberError || !member) {
    throw new Error("Colaborador no encontrado en tu organizacion.");
  }

  const memberRow = member as {
    role: keyof typeof inviteRoleLabels;
    profiles: { full_name: string } | null;
    organization_roles: { name: string } | null;
  };

  if (memberRow.role === "owner") {
    throw new Error("No puedes reenviar invitacion al propietario.");
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
    email: authData.user.email,
    fullName: typeof fullName === "string" ? fullName : "Colaborador",
    roleLabel: memberRow.organization_roles?.name ?? inviteRoleLabels[memberRow.role],
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
