import type { ReactNode } from "react";

type DashboardSectionProps = {
  id: string;
  title: string;
  description?: string;
  titleMeta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function DashboardSection({
  id,
  title,
  description,
  titleMeta,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-2xl font-bold tracking-normal text-slate-950">
              {title}
            </h2>
            {titleMeta ? (
              <>
                <span
                  className="h-4 w-px shrink-0 bg-slate-300"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium tracking-normal text-slate-500">
                  {titleMeta}
                </span>
              </>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
