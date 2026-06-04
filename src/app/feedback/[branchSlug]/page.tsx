import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  getActiveBranchById,
  getActiveBranchesBySlug,
} from "@/domain/branches/repository";
import {
  getBranchIdFromQrToken,
  verifyBranchQrTokenSignature,
} from "@/domain/branches/qr-token";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import { createServiceClient } from "@/lib/supabase/service";

import { FeedbackForm } from "./feedback-form";
import { FeedbackPlatformFooter } from "./feedback-platform-footer";
import { FeedbackTrustHeader } from "./feedback-trust-header";

type FeedbackPageProps = {
  params: Promise<{
    branchSlug: string;
  }>;
  searchParams?: Promise<{
    token?: string;
  }>;
};

async function getSiteHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") ?? headerStore.get("host");
}

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const { branchSlug } = await params;
  const { token } = (await searchParams) ?? {};

  if (!hasSupabaseServiceEnv()) {
    notFound();
  }

  const client = createServiceClient();
  const branch = token
    ? await (async () => {
        if (!hasQrSigningSecret()) {
          return null;
        }

        const branchId = getBranchIdFromQrToken(token);
        if (!branchId) {
          return null;
        }

        const tokenBranch = await getActiveBranchById(client, branchId);
        if (!tokenBranch) {
          return null;
        }

        const isValid = verifyBranchQrTokenSignature(token, {
          branchId: tokenBranch.id,
          branchSlug: tokenBranch.slug,
          organizationId: tokenBranch.organization_id,
        });

        return isValid ? tokenBranch : null;
      })()
    : await (async () => {
        const matches = await getActiveBranchesBySlug(client, branchSlug);
        return matches.length === 1 ? matches[0] : null;
      })();

  if (!branch) {
    notFound();
  }

  const organization = await getOrganizationSettingsById(client, branch.organization_id);
  const siteHost = await getSiteHost();

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <FeedbackTrustHeader
          organizationName={organization?.name ?? "Negocio"}
          branchName={branch.name}
          logoUrl={organization?.logoUrl}
          tagline={organization?.tagline}
          siteHost={siteHost}
        />

        <FeedbackForm
          branchId={branch.id}
          branchSlug={branch.slug}
          branchToken={token}
        />

        <FeedbackPlatformFooter />
      </section>
    </main>
  );
}
