import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole } from "./schemas";

type Client = SupabaseClient<Database>;

export type TeamMember = {
  userId: string;
  branchId: string | null;
  branchName: string | null;
  fullName: string;
  role: MemberRole;
  roleLabel: string;
  joinedAt: string;
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
  role: MemberRole;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
  branches: {
    name: string;
  } | null;
};

export async function getTeamMembersByOrganization(
  client: Client,
  organizationId: string,
): Promise<TeamMember[]> {
  const { data, error } = await client
    .from("organization_members")
    .select("user_id, branch_id, role, created_at, profiles(full_name), branches(name)")
    .eq("organization_id", organizationId)
    .neq("role", "owner")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as TeamMemberRow[]).map((member) => ({
    userId: member.user_id,
    branchId: member.branch_id,
    branchName: member.branches?.name ?? null,
    fullName: member.profiles?.full_name ?? "Usuario",
    role: member.role,
    roleLabel: roleLabels[member.role],
    joinedAt: member.created_at,
  }));
}
