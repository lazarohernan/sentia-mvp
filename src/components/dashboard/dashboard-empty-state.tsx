import type { LucideIcon } from "lucide-react";

type DashboardEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 text-center">
      <div>
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
          <Icon size={20} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}
