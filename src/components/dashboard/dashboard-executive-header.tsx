"use client";

import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import { Dropdown } from "@/components/ui/dropdown";
import { DashboardDateFilter } from "./dashboard-date-filter";

type DashboardExecutiveHeaderProps = {
  dashboardData?: DashboardSummaryData;
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchId?: string;
  lockedBranchScope?: boolean;
};

function buildBranchHref(params: {
  dateRange: DashboardDateRange;
  branchId: string;
}) {
  const searchParams = new URLSearchParams({
    period: params.dateRange.period,
  });

  if (params.dateRange.period === "custom") {
    searchParams.set("start", params.dateRange.startDate);
    searchParams.set("end", params.dateRange.endDate);
  }

  if (params.branchId) {
    searchParams.set("branchId", params.branchId);
  }

  return `/dashboard?${searchParams.toString()}`;
}

export function getDashboardScopeLabel(params: {
  dashboardData?: DashboardSummaryData;
  branches: Branch[];
  selectedBranchId?: string;
}) {
  const isSingleBranchScope = params.dashboardData?.scope === "1 sucursal";
  const selectedBranch =
    params.branches.find((branch) => branch.id === params.selectedBranchId) ??
    (isSingleBranchScope && params.branches.length === 1
      ? params.branches[0]
      : undefined);
  const isBranchView = Boolean(selectedBranch) || isSingleBranchScope;

  return isBranchView ? "Vista de sucursal" : "Vista global";
}

export function DashboardExecutiveHeader({
  dashboardData,
  dateRange,
  branches,
  selectedBranchId,
  lockedBranchScope = false,
}: DashboardExecutiveHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeDateRange = dashboardData?.dateRange ?? dateRange;
  const branchOptions = [
    { value: "", label: "Todas las sucursales" },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ];

  function handleBranchChange(branchId: string) {
    if (lockedBranchScope || isPending) return;
    const href = buildBranchHref({
      dateRange: activeDateRange,
      branchId,
    });
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      <DashboardDateFilter
        dateRange={activeDateRange}
        selectedBranchId={selectedBranchId}
      />
      <Dropdown
        label="Filtrar por sucursal"
        value={selectedBranchId ?? ""}
        onChange={handleBranchChange}
        options={branchOptions}
        placeholder={lockedBranchScope ? "Sucursal asignada" : "Sucursal"}
        menuAlign="right"
        menuWidthClassName="w-[min(18rem,calc(100vw-2rem))]"
        disabled={lockedBranchScope || isPending}
        leadingIcon={Filter}
      />
    </div>
  );
}
