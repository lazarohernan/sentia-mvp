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
    <div className="flex min-h-40 items-center justify-center rounded-lg bg-white p-6 text-center shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
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
