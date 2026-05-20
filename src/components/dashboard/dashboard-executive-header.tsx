import { Filter } from "lucide-react";

import type { Branch } from "@/domain/branches/schemas";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import { DashboardDateFilter } from "./dashboard-date-filter";
import { DashboardDemoDataToggle } from "./dashboard-demo-data-toggle";

type DashboardExecutiveHeaderProps = {
  showDemoData: boolean;
  onToggleDemoData: () => void;
  dashboardData?: DashboardSummaryData;
  dateRange: DashboardDateRange;
  branches: Branch[];
  selectedBranchId?: string;
};

export function DashboardExecutiveHeader({
  showDemoData,
  onToggleDemoData,
  dashboardData,
  dateRange,
  branches,
  selectedBranchId,
}: DashboardExecutiveHeaderProps) {
  const activeDateRange = dashboardData?.dateRange ?? dateRange;
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

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
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardDateFilter
            dateRange={activeDateRange}
            selectedBranchId={selectedBranchId}
          />
          <details name="dashboard-header-filter" className="group relative">
            <summary
              className={[
                "inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border px-4 text-sm font-semibold transition [&::-webkit-details-marker]:hidden",
                selectedBranch
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900",
              ].join(" ")}
              aria-label="Filtrar por sucursal"
            >
              <Filter size={16} aria-hidden="true" />
              {selectedBranch?.name ?? "Sucursal"}
            </summary>

            <form
              action="/dashboard"
              className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.16)]"
            >
              <input type="hidden" name="period" value={activeDateRange.period} />
              {activeDateRange.period === "custom" ? (
                <>
                  <input type="hidden" name="start" value={activeDateRange.startDate} />
                  <input type="hidden" name="end" value={activeDateRange.endDate} />
                </>
              ) : null}
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Sucursal
                </span>
                <select
                  name="branchId"
                  defaultValue={selectedBranchId ?? ""}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Aplicar filtro
              </button>
            </form>
          </details>
          <DashboardDemoDataToggle
            pressed={showDemoData}
            onPressedChange={onToggleDemoData}
          />
        </div>
      </div>
    </header>
  );
}
