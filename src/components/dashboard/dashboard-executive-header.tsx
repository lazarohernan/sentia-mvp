"use client";

import { Filter } from "lucide-react";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import { Dropdown } from "@/components/ui/dropdown";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DashboardDemoDataToggle } from "./dashboard-demo-data-toggle";

type DashboardExecutiveHeaderProps = {
  showDemoData: boolean;
  onToggleDemoData: () => void;
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

export function DashboardExecutiveHeader({
  showDemoData,
  onToggleDemoData,
  dashboardData,
  dateRange,
  branches,
  selectedBranchId,
  lockedBranchScope = false,
}: DashboardExecutiveHeaderProps) {
  const activeDateRange = dashboardData?.dateRange ?? dateRange;
  const isSingleBranchScope = dashboardData?.scope === "1 sucursal";
  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ??
    (isSingleBranchScope && branches.length === 1 ? branches[0] : undefined);
  const isBranchView = Boolean(selectedBranch) || isSingleBranchScope;
  const scopeLabel = isBranchView ? "Vista de sucursal" : "Vista global";
  const scopeDetail = isBranchView
    ? `Datos limitados a ${selectedBranch?.name ?? "la sucursal seleccionada"}.`
    : "Datos consolidados de toda la operación.";
  const branchOptions = [
    { value: "", label: "Todas las sucursales" },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ];

  function handleBranchChange(branchId: string) {
    if (lockedBranchScope) return;
    window.location.href = buildBranchHref({
      dateRange: activeDateRange,
      branchId,
    });
  }

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Lectura ejecutiva para detectar riesgo, tendencia y puntos de
            accion.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center rounded-full bg-slate-950 px-3 text-xs font-semibold text-white">
              {scopeLabel}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {scopeDetail}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
            disabled={lockedBranchScope}
            leadingIcon={Filter}
          />
          <DashboardDemoDataToggle
            pressed={showDemoData}
            onPressedChange={onToggleDemoData}
          />
        </div>
      </div>
    </header>
  );
}
