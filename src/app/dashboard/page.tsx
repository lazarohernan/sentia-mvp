import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getLatestAgentOperationalReport } from "@/domain/agent/repository";
import type { DashboardCurrentUser } from "@/components/dashboard/dashboard-user-menu";
import { getUserProfileById } from "@/domain/auth/profile";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { getDashboardSummaryData } from "@/domain/dashboard/repository";
import { getListeningEventsByOrganization } from "@/domain/listening/repository";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import { getPermissionProfilesByOrganization } from "@/domain/organizations/permission-profiles";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import {
  getTeamMembersByOrganization,
  getTeamMembersWithAccountStatus,
} from "@/domain/organizations/team";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    branchId?: string;
    reportPeriod?: string;
    openReport?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const dateRange = getDashboardDateRange(params);

  if (!hasSupabasePublicEnv()) {
    redirect("/login?redirectTo=/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const [organization, membership, profile] = await Promise.all([
    getOrganizationByUser(supabase, user.id),
    getOrganizationMembershipByUser(supabase, user.id),
    getUserProfileById(supabase, user.id),
  ]);

  const allowedBranchId = membership?.branchId ?? null;
  const serviceClient = hasSupabaseServiceEnv() ? createServiceClient() : null;

  const [organizationSettings, branches, teamMembers, permissionProfiles] =
    organization
      ? await Promise.all([
          getOrganizationSettingsById(supabase, organization.id),
          getBranchesByOrganization(supabase, organization.id),
          serviceClient
            ? getTeamMembersWithAccountStatus(serviceClient, organization.id)
            : getTeamMembersByOrganization(supabase, organization.id),
          getPermissionProfilesByOrganization(supabase, organization.id),
        ])
      : [null, [], [], []];

  const scopedBranches = allowedBranchId
    ? branches.filter((branch) => branch.id === allowedBranchId)
    : branches;
  const selectedBranchId = allowedBranchId
    ? allowedBranchId
    : scopedBranches.some((branch) => branch.id === params.branchId)
      ? params.branchId
      : undefined;
  const dashboardBranches = selectedBranchId
    ? scopedBranches.filter((branch) => branch.id === selectedBranchId)
    : scopedBranches;
  const scopedTeamMembers = allowedBranchId
    ? teamMembers.filter((member) => member.branchId === allowedBranchId)
    : teamMembers;

  const [listeningEvents, dashboardData, latestAgentReport] = await Promise.all([
    organization
      ? getListeningEventsByOrganization(
          supabase,
          organization.id,
          20,
          allowedBranchId ? [allowedBranchId] : undefined,
          dateRange,
        )
      : Promise.resolve([]),
    getDashboardSummaryData(supabase, {
      organizationId: organization?.id,
      organizationName: organization?.name,
      branches: dashboardBranches,
      dateRange,
      reportCadence: organizationSettings?.reportCadence,
      syncNotificationDrafts: !allowedBranchId,
    }),
    organization && serviceClient
      ? getLatestAgentOperationalReport(serviceClient, {
          organizationId: organization.id,
          branchId: allowedBranchId,
          period: params.period === "30d" ? "30d" : "7d",
        })
      : Promise.resolve(null),
  ]);
  const currentUser: DashboardCurrentUser = {
    fullName:
      profile?.fullName ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "Usuario"),
    email: user.email ?? null,
  };

  const informesReportPeriod =
    params.reportPeriod === "weekly" || params.reportPeriod === "monthly"
      ? params.reportPeriod
      : undefined;

  return (
    <DashboardShell
      organizationName={organizationSettings?.name ?? organization?.name}
      organizationSettings={organizationSettings ?? undefined}
      branches={scopedBranches}
      selectedBranchId={selectedBranchId}
      lockedBranchScope={Boolean(allowedBranchId)}
      teamMembers={scopedTeamMembers}
      permissionProfiles={permissionProfiles}
      canManageTeam={
        membership?.role === "owner" || membership?.role === "manager"
      }
      actorRole={
        membership?.role === "owner" || membership?.role === "manager"
          ? membership.role
          : undefined
      }
      currentUserId={user.id}
      currentUser={currentUser}
      listeningEvents={listeningEvents}
      dashboardData={dashboardData}
      latestAgentReport={latestAgentReport ?? undefined}
      dateRange={dateRange}
      informesReportPeriod={informesReportPeriod}
      autoOpenReport={params.openReport === "1"}
    />
  );
}
