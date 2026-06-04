"use client";

import { Building2, Check } from "lucide-react";
import Link from "next/link";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";

type ListeningBranchFilterProps = {
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchIds: string[];
  lockedBranchScope?: boolean;
  basePath?: string;
};

function buildListeningBranchHref(
  dateRange: DashboardDateRange,
  branchIds: string[],
  basePath: string,
) {
  const params = new URLSearchParams({ period: dateRange.period });

  if (dateRange.period === "custom") {
    params.set("start", dateRange.startDate);
    params.set("end", dateRange.endDate);
  }

  branchIds.forEach((branchId) => params.append("branchId", branchId));

  return `${basePath}?${params.toString()}`;
}

function getBranchFilterLabel(
  branches: Branch[],
  selectedBranchIds: string[],
  lockedBranchScope: boolean,
) {
  if (lockedBranchScope && branches[0]) return branches[0].name;
  if (selectedBranchIds.length === 0) return "Todas las sucursales";
  if (selectedBranchIds.length === 1) {
    return (
      branches.find((branch) => branch.id === selectedBranchIds[0])?.name ??
      "1 sucursal"
    );
  }

  return `${selectedBranchIds.length} sucursales`;
}

export function ListeningBranchFilter({
  dateRange,
  branches,
  selectedBranchIds,
  lockedBranchScope = false,
  basePath = "/dashboard/escucha",
}: ListeningBranchFilterProps) {
  const branchFilterLabel = getBranchFilterLabel(
    branches,
    selectedBranchIds,
    lockedBranchScope,
  );

  return (
    <details className="group relative">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
        <Building2 className="h-4 w-4" aria-hidden="true" />
        {branchFilterLabel}
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
        {lockedBranchScope ? (
          <p className="px-3 py-2 text-sm leading-6 text-slate-600">
            Tu usuario está limitado a esta sucursal.
          </p>
        ) : (
          <>
            <Link
              href={buildListeningBranchHref(dateRange, [], basePath)}
              className={[
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                selectedBranchIds.length === 0
                  ? "bg-emerald-50 text-emerald-900"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Todas las sucursales
              {selectedBranchIds.length === 0 ? (
                <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              ) : null}
            </Link>

            <div className="mt-1 max-h-72 overflow-y-auto">
              {branches.map((branch) => {
                const isSelected = selectedBranchIds.includes(branch.id);
                const nextBranchIds = isSelected
                  ? selectedBranchIds.filter((branchId) => branchId !== branch.id)
                  : [...selectedBranchIds, branch.id];

                return (
                  <Link
                    key={branch.id}
                    href={buildListeningBranchHref(
                      dateRange,
                      nextBranchIds,
                      basePath,
                    )}
                    className={[
                      "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      isSelected
                        ? "bg-emerald-50 text-emerald-900"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {branch.name}
                    {isSelected ? (
                      <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
