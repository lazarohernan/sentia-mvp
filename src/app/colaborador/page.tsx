import { redirect } from "next/navigation";

import { CollaboratorPortalView } from "@/components/collaborator/collaborator-portal-view";
import { normalizeCollaboratorView } from "@/domain/collaborator/portal-navigation";
import { getUserProfileById } from "@/domain/auth/profile";
import { getBranchesByOrganization } from "@/domain/branches/repository";
import {
  getListeningEventsByUser,
} from "@/domain/listening/repository";
import {
  defaultListeningSettings,
  getListeningSettingsByOrganization,
} from "@/domain/listening/settings";
import {
  getActiveListeningSurveyNotificationForUser,
  getNotificationsForUser,
} from "@/domain/notifications/repository";
import { resolveMemberAccess } from "@/domain/organizations/member-access";
import { getPermissionProfileById } from "@/domain/organizations/permission-profiles";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CollaboratorPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function normalizeView(value?: string): "inicio" | "evaluacion" | "perfil" {
  return normalizeCollaboratorView(value);
}

const HISTORY_PAGE_SIZE = 8;

export default async function CollaboratorPage({
  searchParams,
}: CollaboratorPageProps) {
  const params = await searchParams;

  if (!hasSupabasePublicEnv()) {
    redirect("/login?redirectTo=/colaborador");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/colaborador");
  }

  const [organization, membership, profile] = await Promise.all([
    getOrganizationByUser(supabase, user.id),
    getOrganizationMembershipByUser(supabase, user.id),
    getUserProfileById(supabase, user.id),
  ]);

  if (!organization || !membership) {
    redirect("/login");
  }

  const memberProfile = membership.organizationRoleId
    ? await getPermissionProfileById(supabase, {
        organizationId: organization.id,
        organizationRoleId: membership.organizationRoleId,
      })
    : null;

  const access = resolveMemberAccess({
    role: membership.role,
    profile: memberProfile,
    participatesInListening: membership.participatesInListening,
  });

  if (!access.canAccessCollaboratorPortal) {
    redirect(access.canAccessDashboard ? "/dashboard" : "/login");
  }

  const activeBranches = (await getBranchesByOrganization(supabase, organization.id)).filter(
    (branch) => branch.is_active,
  );
  const assignedBranch =
    membership.branch ??
    (activeBranches.length === 1 ? activeBranches[0] : null);

  const [notifications, listeningEvents, listeningSettings, activeSurvey] =
    await Promise.all([
      getNotificationsForUser(supabase, {
        organizationId: organization.id,
        userId: user.id,
        limit: 20,
      }),
      getListeningEventsByUser(supabase, {
        organizationId: organization.id,
        userId: user.id,
        limit: 8,
      }),
      getListeningSettingsByOrganization(supabase, organization.id),
      getActiveListeningSurveyNotificationForUser(supabase, {
        organizationId: organization.id,
        userId: user.id,
      }),
    ]);

  return (
    <CollaboratorPortalView
      assignedBranch={assignedBranch}
      currentUser={{
        fullName:
          profile?.fullName ??
          (typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : user.email?.split("@")[0] ?? "Usuario"),
        email: user.email ?? null,
      }}
      organizationName={organization.name}
      notifications={notifications}
      listeningEvents={listeningEvents}
      listeningSettings={listeningSettings}
      hasActiveListeningSurvey={Boolean(activeSurvey)}
      hasMoreListeningHistory={listeningEvents.length === HISTORY_PAGE_SIZE}
      initialView={normalizeView(params.view)}
    />
  );
}
