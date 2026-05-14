import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { getDashboardSummaryData } from "@/domain/dashboard/repository";
import { getOrganizationByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dateRange = getDashboardDateRange(params);

  if (!hasSupabasePublicEnv()) {
    return <DashboardShell dateRange={dateRange} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const branches = organization
    ? await getBranchesByOrganization(supabase, organization.id)
    : [];
  const dashboardData = await getDashboardSummaryData(supabase, {
    organizationName: organization?.name,
    branches,
    dateRange,
  });

  return (
    <DashboardShell
      organizationName={organization?.name}
      branches={branches}
      dashboardData={dashboardData}
      dateRange={dateRange}
    />
  );
}
