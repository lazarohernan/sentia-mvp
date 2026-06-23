import { FeedbackForm } from "../[branchSlug]/feedback-form";
import { FeedbackPlatformFooter } from "../[branchSlug]/feedback-platform-footer";
import { FeedbackTrustHeader } from "../[branchSlug]/feedback-trust-header";

type FeedbackScreenProps = {
  organizationName: string;
  branchName: string;
  branchId: string;
  branchSlug: string;
  branchToken?: string;
  logoUrl?: string | null;
  tagline?: string | null;
  siteHost?: string | null;
};

export function FeedbackScreen({
  organizationName,
  branchName,
  branchId,
  branchSlug,
  branchToken,
  logoUrl,
  tagline,
  siteHost,
}: FeedbackScreenProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center">
        <FeedbackTrustHeader
          organizationName={organizationName}
          branchName={branchName}
          logoUrl={logoUrl}
          tagline={tagline}
          siteHost={siteHost}
        />

        <FeedbackForm branchId={branchId} branchSlug={branchSlug} branchToken={branchToken} />

        <FeedbackPlatformFooter />
      </section>
    </main>
  );
}
