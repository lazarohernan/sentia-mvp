import { redirect } from "next/navigation";

import { getBranchesByOrganization } from "@/domain/branches/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ListeningAssessmentView } from "./listening-assessment-view";

export const dynamic = "force-dynamic";

export default async function ListeningAssessmentPage() {
  if (!hasSupabasePublicEnv()) {
    redirect("/login?redirectTo=/escucha");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/escucha");
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (membership?.participatesInListening) {
    redirect("/colaborador?view=evaluacion");
  }

  const activeBranches =
    organization && !membership?.branch
      ? (await getBranchesByOrganization(supabase, organization.id)).filter(
          (branch) => branch.is_active,
        )
      : [];
  const assignedBranch = membership?.branch ?? activeBranches[0] ?? null;

  return (
    <ListeningAssessmentView
      assignedBranch={activeBranches.length <= 1 ? assignedBranch : membership?.branch ?? null}
      organizationName={organization?.name}
    />
  );
}
