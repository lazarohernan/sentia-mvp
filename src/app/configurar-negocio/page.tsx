import Image from "next/image";
import { redirect } from "next/navigation";

import { DashboardWelcomeModal } from "@/components/dashboard/dashboard-welcome-modal";
import { getUserProfileById } from "@/domain/auth/profile";
import { needsOwnerOnboarding } from "@/domain/auth/owner-onboarding";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConfigureBusinessPage() {
  if (!hasSupabasePublicEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/configurar-negocio");
  }

  const [membership, profile] = await Promise.all([
    getOrganizationMembershipByUser(supabase, user.id),
    getUserProfileById(supabase, user.id),
  ]);

  if (!needsOwnerOnboarding(user)) {
    redirect(membership ? "/dashboard" : "/login");
  }

  return (
    <main className="min-h-dvh bg-[#f3f6f1] px-5 py-8 text-[#073c34] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Image src="/brand/perks-logo.png" alt="Perks" width={160} height={52} className="h-10 w-auto" priority />
        <DashboardWelcomeModal ownerSetup={{
          initialName: profile?.fullName ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""),
          businessCreated: Boolean(membership),
        }} />
      </div>
    </main>
  );
}
