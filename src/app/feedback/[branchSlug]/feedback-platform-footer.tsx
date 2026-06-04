import { ChartNoAxesCombined } from "lucide-react";

export function FeedbackPlatformFooter() {
  return (
    <footer className="mt-8 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-emerald-900 shadow-sm">
        <ChartNoAxesCombined className="h-4 w-4" aria-hidden="true" />
        Perks
      </div>
    </footer>
  );
}
