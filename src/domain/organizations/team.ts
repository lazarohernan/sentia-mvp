import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { getAccountStatusFromAuthUser } from "./resend-team-member-invite";
import type { MemberRole } from "./schemas";

type Client = SupabaseClient<Database>;

export type TeamMemberAccountStatus = "active" | "pending_activation";

export type TeamMember = {
  userId: string;
  branchId: string | null;
  branchName: string | null;
  fullName: string;
  email: string | null;
  role: MemberRole;
  roleLabel: string;
  permissionProfileId?: string | null;
  permissionProfileName?: string | null;
  joinedAt: string;
  accountStatus: TeamMemberAccountStatus;
};

const roleLabels: Record<MemberRole, string> = {
  owner: "Propietario",
  manager: "Gerente",
  collaborator: "Colaborador",
};

export { roleLabels };

type TeamMemberRow = {
  user_id: string;
  branch_id: string | null;
  organization_role_id: string | null;
  role: MemberRole;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
  branches: {
    name: string;
  } | null;
  organization_roles: {
    name: string;
  } | null;
};

function mapTeamMemberRow(member: TeamMemberRow): TeamMember {
  return {
    userId: member.user_id,
    branchId: member.branch_id,
    branchName: member.branches?.name ?? null,
    fullName: member.profiles?.full_name ?? "Usuario",
    email: null,
    role: member.role,
    roleLabel: roleLabels[member.role],
    permissionProfileId: member.organization_role_id,
    permissionProfileName: member.organization_roles?.name ?? null,
    joinedAt: member.created_at,
    accountStatus: "active",
  };
}

export async function getTeamMembersByOrganization(
  client: Client,
  organizationId: string,
): Promise<TeamMember[]> {
  const { data, error } = await client
    .from("organization_members")
    .select(
      "user_id, branch_id, organization_role_id, role, created_at, profiles(full_name), branches(name), organization_roles(name)",
    )
    .eq("organization_id", organizationId)
    .neq("role", "owner")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as TeamMemberRow[]).map(mapTeamMemberRow);
}

export async function getTeamMembersWithAccountStatus(
  client: Client,
  organizationId: string,
): Promise<TeamMember[]> {
  const members = await getTeamMembersByOrganization(client, organizationId);

  const enriched = await Promise.all(
    members.map(async (member) => {
      const { data, error } = await client.auth.admin.getUserById(member.userId);

      if (error || !data.user) {
        return member;
      }

      return {
        ...member,
        email: data.user.email ?? null,
        accountStatus: getAccountStatusFromAuthUser(data.user),
      };
    }),
  );

  return enriched;
}
