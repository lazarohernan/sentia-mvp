import { redirect } from "next/navigation";

import { ListeningAnalyticsView } from "@/components/dashboard/listening-analytics/listening-analytics-view";
import { getListeningEventsByOrganization } from "@/domain/listening/repository";
import { getOrganizationByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardListeningPage() {
  if (!hasSupabasePublicEnv()) {
    return (
      <ListeningAnalyticsView
        listeningEvents={[]}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/escucha");
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const listeningEvents = organization
    ? await getListeningEventsByOrganization(supabase, organization.id, 50)
    : [];

  return (
    <ListeningAnalyticsView
      listeningEvents={listeningEvents}
    />
  );
}
