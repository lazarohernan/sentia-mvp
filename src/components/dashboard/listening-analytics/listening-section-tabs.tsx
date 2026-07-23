import Link from "next/link";

import type { DashboardDateRange } from "@/domain/dashboard/date-range";

type ListeningSectionTabsProps = {
  activeTab: "analytics" | "coaching";
  dateRange: DashboardDateRange;
  selectedBranchIds: string[];
};

export function buildListeningSectionHref(
  basePath: string,
  dateRange: DashboardDateRange,
  selectedBranchIds: string[],
) {
  const params = new URLSearchParams({ period: dateRange.period });

  if (dateRange.period === "custom") {
    params.set("start", dateRange.startDate);
    params.set("end", dateRange.endDate);
  }

  selectedBranchIds.forEach((branchId) => params.append("branchId", branchId));

  return `${basePath}?${params.toString()}`;
}

export function ListeningSectionTabs({
  activeTab,
  dateRange,
  selectedBranchIds,
}: ListeningSectionTabsProps) {
  const tabs = [
    {
      id: "analytics",
      label: "Analítica",
      href: buildListeningSectionHref(
        "/dashboard/escucha",
        dateRange,
        selectedBranchIds,
      ),
    },
    {
      id: "coaching",
      label: "Coaching",
      href: buildListeningSectionHref(
        "/dashboard/escucha/coaching",
        dateRange,
        selectedBranchIds,
      ),
    },
  ] as const;

  return (
    <div className="inline-flex rounded-full bg-[rgb(2_44_34_/_0.055)] p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold transition",
              isActive
                ? "bg-emerald-800 text-white shadow-emerald-900/20"
                : "text-slate-600 hover:bg-white hover:text-emerald-900",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
