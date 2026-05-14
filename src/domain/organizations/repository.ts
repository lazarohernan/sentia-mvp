import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Organization } from "./schemas";

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
