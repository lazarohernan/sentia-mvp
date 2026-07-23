import { getHomePathForMembership } from "@/domain/auth/redirects";
import { getPermissionProfileById } from "@/domain/organizations/permission-profiles";
import type { OrganizationMembership } from "@/domain/organizations/repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function resolveHomePathForMembership(
  client: Client,
  membership: OrganizationMembership | null,
) {
  if (!membership) {
    return "/dashboard";
  }

  const profile = membership.organizationRoleId
    ? await getPermissionProfileById(client, {
        organizationId: membership.organizationId,
        organizationRoleId: membership.organizationRoleId,
      })
    : null;

  return getHomePathForMembership({
    role: membership.role,
    profile,
    participatesInListening: membership.participatesInListening,
  });
}
