import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { AgentOperationalReport } from "@/domain/agent/context";
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

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  const organizationSettings = organization
    ? await getOrganizationSettingsById(supabase, organization.id)
    : null;
  const branches = organization
    ? await getBranchesByOrganization(supabase, organization.id)
    : [];
  const allowedBranchId = membership?.branchId ?? null;
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
  const teamMembers = organization
    ? hasSupabaseServiceEnv()
      ? await getTeamMembersWithAccountStatus(createServiceClient(), organization.id)
      : await getTeamMembersByOrganization(supabase, organization.id)
    : [];
  const scopedTeamMembers = allowedBranchId
    ? teamMembers.filter((member) => member.branchId === allowedBranchId)
    : teamMembers;
  const permissionProfiles = organization
    ? await getPermissionProfilesByOrganization(supabase, organization.id)
    : [];
  const serviceClient = hasSupabaseServiceEnv() ? createServiceClient() : null;
  const listeningEvents = organization
    ? await getListeningEventsByOrganization(
        supabase,
        organization.id,
        20,
        allowedBranchId ? [allowedBranchId] : undefined,
        dateRange,
      )
    : [];
  const dashboardData = await getDashboardSummaryData(supabase, {
    organizationId: organization?.id,
    organizationName: organization?.name,
    branches: dashboardBranches,
    dateRange,
    reportCadence: organizationSettings?.reportCadence,
    syncNotificationDrafts: !allowedBranchId,
  });
  const latestAgentReport: AgentOperationalReport | null =
    organization && serviceClient
      ? await getLatestAgentOperationalReport(serviceClient, {
          organizationId: organization.id,
          branchId: allowedBranchId,
          period: params.period === "30d" ? "30d" : "7d",
        })
      : null;
  const profile = await getUserProfileById(supabase, user.id);
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
