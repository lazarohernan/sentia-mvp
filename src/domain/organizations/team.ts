import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole } from "./schemas";

type Client = SupabaseClient<Database>;

export type TeamMember = {
  userId: string;
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

type TeamMemberRow = {
  user_id: string;
  role: MemberRole;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
};

export async function getTeamMembersByOrganization(
  client: Client,
  organizationId: string,
): Promise<TeamMember[]> {
  const { data, error } = await client
    .from("organization_members")
    .select("user_id, role, created_at, profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return (data as TeamMemberRow[]).map((member) => ({
    userId: member.user_id,
    fullName: member.profiles?.full_name ?? "Usuario",
    role: member.role,
    roleLabel: roleLabels[member.role],
    joinedAt: member.created_at,
  }));
}
