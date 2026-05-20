import { notFound } from "next/navigation";

import { getActiveBranchBySlug } from "@/domain/branches/repository";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

import { FeedbackForm } from "./feedback-form";

type FeedbackPageProps = {
  params: Promise<{
    branchSlug: string;
  }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { branchSlug } = await params;

  if (!hasSupabaseServiceEnv()) {
    notFound();
  }

  const branch = await getActiveBranchBySlug(createServiceClient(), branchSlug);

  if (!branch) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-normal text-emerald-900">
            Logo negocio
          </p>
        </div>

        <FeedbackForm branchSlug={branch.slug} branchName={branch.name} />
      </section>
    </main>
  );
}
