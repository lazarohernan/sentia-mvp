import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { recordBranchQrScan } from "@/domain/branches/qr-scans";
import { resolveSignedQrBranch } from "@/domain/branches/resolve-signed-qr-branch";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import { FeedbackScreen } from "@/app/feedback/_shared/feedback-screen";
import { getPublicSiteHost } from "@/lib/app/public-site-host";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

type SignedQrPageProps = {
  params: Promise<{ token: string }>;
};

export default async function SignedQrFeedbackPage({ params }: SignedQrPageProps) {
  const { token } = await params;

  if (!hasSupabaseServiceEnv() || !hasQrSigningSecret()) {
    redirect("/feedback/invalido");
  }

  const headerStore = await headers();
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "qr:signed:redirect",
    key: getClientIpFromHeaders(headerStore),
    limit: 120,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirect("/feedback/invalido");
  }

  const client = createServiceClient();
  const branch = await resolveSignedQrBranch(client, token);

  if (!branch) {
    redirect("/feedback/invalido");
  }

  try {
    await recordBranchQrScan(client, {
      organizationId: branch.organization_id,
      branchId: branch.id,
      source: "signed_qr",
    });
  } catch {
    // Continue to feedback even if analytics insert fails.
  }

  const organization = await getOrganizationSettingsById(client, branch.organization_id);
  const siteHost = getPublicSiteHost(
    headerStore.get("x-forwarded-host") ?? headerStore.get("host"),
  );

  return (
    <FeedbackScreen
      organizationName={organization?.name ?? "Negocio"}
      branchName={branch.name}
      branchId={branch.id}
      branchSlug={branch.slug}
      branchToken={token}
      logoUrl={organization?.logoUrl}
      tagline={organization?.tagline}
      siteHost={siteHost}
    />
  );
}
