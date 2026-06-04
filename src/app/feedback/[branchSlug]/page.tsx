import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getActiveBranchBySlug } from "@/domain/branches/repository";
import { getOrganizationSettingsById } from "@/domain/organizations/organization-settings";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

import { FeedbackForm } from "./feedback-form";
import { FeedbackPlatformFooter } from "./feedback-platform-footer";
import { FeedbackTrustHeader } from "./feedback-trust-header";

type FeedbackPageProps = {
  params: Promise<{
    branchSlug: string;
  }>;
};

async function getSiteHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") ?? headerStore.get("host");
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { branchSlug } = await params;

  if (!hasSupabaseServiceEnv()) {
    notFound();
  }

  const client = createServiceClient();
  const branch = await getActiveBranchBySlug(client, branchSlug);

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

        <FeedbackForm branchSlug={branch.slug} />

        <FeedbackPlatformFooter />
      </section>
    </main>
  );
}
