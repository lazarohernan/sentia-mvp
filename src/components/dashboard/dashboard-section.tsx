import type { ReactNode } from "react";

type DashboardSectionProps = {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({
  id,
  title,
  description,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
