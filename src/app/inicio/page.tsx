import { redirect } from "next/navigation";

import { resolveHomePathForMembership } from "@/domain/auth/resolve-home-path";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  if (!hasSupabasePublicEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  redirect(await resolveHomePathForMembership(supabase, membership));
}
