import { redirect } from "next/navigation";

import { getHomePathForRole } from "@/domain/auth/redirects";
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
  redirect(getHomePathForRole(membership?.role));
}
