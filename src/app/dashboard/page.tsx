import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { getDashboardSummaryData } from "@/domain/dashboard/repository";
import { getListeningEventsByOrganization } from "@/domain/listening/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { getTeamMembersByOrganization } from "@/domain/organizations/team";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    branchId?: string;
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
  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  const branches = organization
    ? await getBranchesByOrganization(supabase, organization.id)
    : [];
  const selectedBranchId = branches.some((branch) => branch.id === params.branchId)
    ? params.branchId
    : undefined;
  const dashboardBranches = selectedBranchId
    ? branches.filter((branch) => branch.id === selectedBranchId)
    : branches;
  const teamMembers = organization
    ? await getTeamMembersByOrganization(supabase, organization.id)
    : [];
  const listeningEvents = organization
    ? await getListeningEventsByOrganization(supabase, organization.id)
    : [];
  const dashboardData = await getDashboardSummaryData(supabase, {
    organizationId: organization?.id,
    organizationName: organization?.name,
    branches: dashboardBranches,
    dateRange,
  });

  return (
    <DashboardShell
      organizationName={organization?.name}
      branches={branches}
      selectedBranchId={selectedBranchId}
      teamMembers={teamMembers}
      canManageTeam={
        membership?.role === "owner" || membership?.role === "manager"
      }
      actorRole={
        membership?.role === "owner" || membership?.role === "manager"
          ? membership.role
          : undefined
      }
      listeningEvents={listeningEvents}
      dashboardData={dashboardData}
      dateRange={dateRange}
    />
  );
}
