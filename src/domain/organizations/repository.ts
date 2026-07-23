import type { SupabaseClient } from "@supabase/supabase-js";

import type { Branch } from "@/domain/branches/schemas";
import type { Database } from "@/lib/supabase/database.types";
import type { MemberRole, Organization } from "./schemas";

type Client = SupabaseClient<Database>;

export async function getOrganizationByUser(
  client: Client,
  userId: string,
): Promise<Organization | null> {
  const { data, error } = await client
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) return null;

  const first = data[0] as { organizations: Organization };
  return first.organizations ?? null;
}

export type OrganizationMembership = {
  userId: string;
  organizationId: string;
  branchId: string | null;
  organizationRoleId: string | null;
  role: MemberRole;
  participatesInListening: boolean;
  createdAt: string;
  branch: Branch | null;
};

type OrganizationMembershipRow = {
  user_id: string;
  organization_id: string;
  branch_id: string | null;
  organization_role_id: string | null;
  role: MemberRole;
  participates_in_listening: boolean | null;
  created_at: string;
  branches: Branch | null;
};

export async function getOrganizationMembershipByUser(
  client: Client,
  userId: string,
): Promise<OrganizationMembership | null> {
  const { data, error } = await client
    .from("organization_members")
    .select(
      "user_id, organization_id, branch_id, organization_role_id, role, participates_in_listening, created_at, branches(*)",
    )
    .eq("user_id", userId)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const membership = data[0] as OrganizationMembershipRow;
  return {
    userId: membership.user_id,
    organizationId: membership.organization_id,
    branchId: membership.branch_id,
    organizationRoleId: membership.organization_role_id,
    role: membership.role,
    participatesInListening: Boolean(membership.participates_in_listening),
    createdAt: membership.created_at,
    branch: membership.branches,
  };
}

export async function createUserOrganization(
  client: Client,
  params: {
    fullName: string;
    orgName: string;
    orgSlug: string;
  },
): Promise<string> {
  const rpcArgs: Database["public"]["Functions"]["create_user_organization"]["Args"] = {
    p_full_name: params.fullName,
    p_org_name: params.orgName,
    p_org_slug: params.orgSlug,
  };
  const { data, error } = await client.rpc(
    "create_user_organization",
    rpcArgs as never,
  );

  if (error) throw new Error(`Failed to create organization: ${error.message}`);

  return data as string;
}
