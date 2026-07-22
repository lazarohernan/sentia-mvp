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
  demoMode?: boolean;
  onDemoComplete?: Parameters<typeof FeedbackForm>[0]["onDemoComplete"];
  embedded?: boolean;
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
  demoMode = false,
  onDemoComplete,
  embedded = false,
}: FeedbackScreenProps) {
  const content = (
    <section
      className={
        embedded
          ? "mx-auto flex w-full max-w-md flex-col justify-center"
          : "mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center"
      }
    >
      <FeedbackTrustHeader
        organizationName={organizationName}
        branchName={branchName}
        logoUrl={logoUrl}
        tagline={tagline}
        siteHost={siteHost}
      />

      <FeedbackForm
        branchId={branchId}
        branchSlug={branchSlug}
        branchToken={branchToken}
        demoMode={demoMode}
        onDemoComplete={onDemoComplete}
      />

      <FeedbackPlatformFooter />
    </section>
  );

  if (embedded) {
    return <div className="bg-[#f6f7f4] px-4 py-5 text-slate-950 sm:px-5">{content}</div>;
  }

  return <main className="min-h-screen bg-[#f6f7f4] px-5 py-6 text-slate-950">{content}</main>;
}
