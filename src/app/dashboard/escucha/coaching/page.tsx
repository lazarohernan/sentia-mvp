import { redirect } from "next/navigation";

import { ListeningCoachingView } from "@/components/dashboard/listening-analytics/listening-coaching-view";
import type { DashboardCurrentUser } from "@/components/dashboard/dashboard-user-menu";
import { getUserProfileById } from "@/domain/auth/profile";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { getListeningEventsByOrganization } from "@/domain/listening/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DashboardListeningCoachingPageProps = {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
    branchId?: string | string[];
  }>;
};

function normalizeBranchIds(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function DashboardListeningCoachingPage({
  searchParams,
}: DashboardListeningCoachingPageProps) {
  const params = await searchParams;
  const dateRange = getDashboardDateRange(params);

  if (!hasSupabasePublicEnv()) {
    redirect("/login?redirectTo=/dashboard/escucha/coaching");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/escucha/coaching");
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  const profile = await getUserProfileById(supabase, user.id);
  const branches = organization
    ? await getBranchesByOrganization(supabase, organization.id)
    : [];
  const scopedBranches = membership?.branchId
    ? branches.filter((branch) => branch.id === membership.branchId)
    : branches;
  const requestedBranchIds = normalizeBranchIds(params.branchId);
  const selectedBranchIds = membership?.branchId
    ? [membership.branchId]
    : requestedBranchIds.filter((branchId) =>
        scopedBranches.some((branch) => branch.id === branchId),
      );
  const queryBranchIds =
    selectedBranchIds.length > 0 ? selectedBranchIds : undefined;
  const listeningEvents = organization
    ? await getListeningEventsByOrganization(
        supabase,
        organization.id,
        500,
        queryBranchIds,
        dateRange,
      )
    : [];
  const currentUser: DashboardCurrentUser = {
    fullName:
      profile?.fullName ??
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "Usuario"),
    email: user.email ?? null,
  };

  return (
    <ListeningCoachingView
      listeningEvents={listeningEvents}
      currentUser={currentUser}
      dateRange={dateRange}
      branches={scopedBranches}
      selectedBranchIds={selectedBranchIds}
      lockedBranchScope={Boolean(membership?.branchId)}
    />
  );
}
