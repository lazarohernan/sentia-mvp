import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getActiveBranchesBySlug } from "@/domain/branches/repository";
import { buildSignedQrPath } from "@/domain/branches/qr-token";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import { FeedbackScreen } from "@/app/feedback/_shared/feedback-screen";
import { getPublicSiteHost } from "@/lib/app/public-site-host";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

type FeedbackPageProps = {
  params: Promise<{
    branchSlug: string;
  }>;
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const { branchSlug } = await params;
  const { token } = (await searchParams) ?? {};

  if (token) {
    redirect(buildSignedQrPath(token));
  }

  if (!hasSupabaseServiceEnv()) {
    notFound();
  }

  const client = createServiceClient();
  const matches = await getActiveBranchesBySlug(client, branchSlug);
  const branch = matches.length === 1 ? matches[0] : null;

  if (!branch) {
    notFound();
  }

  const organization = await getOrganizationSettingsById(client, branch.organization_id);
  const headerStore = await headers();
  const siteHost = getPublicSiteHost(
    headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
  );

  return (
    <FeedbackScreen
      organizationName={organization?.name ?? "Negocio"}
      branchName={branch.name}
      branchId={branch.id}
      branchSlug={branch.slug}
      logoUrl={organization?.logoUrl}
      tagline={organization?.tagline}
      siteHost={siteHost}
    />
  );
}
