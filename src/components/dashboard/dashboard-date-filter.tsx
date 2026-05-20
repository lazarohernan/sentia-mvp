import { CalendarDays } from "lucide-react";
import Link from "next/link";

import type { DashboardDateRange } from "@/domain/dashboard/date-range";

type DashboardDateFilterProps = {
  dateRange: DashboardDateRange;
  selectedBranchId?: string;
  targetHash?: string;
};

const presets = [
  { label: "Hoy", period: "today" },
  { label: "7 días", period: "7d" },
  { label: "30 días", period: "30d" },
];

function buildPresetHref(
  period: string,
  selectedBranchId?: string,
  targetHash?: string,
) {
  const params = new URLSearchParams({ period });

  if (selectedBranchId) {
    params.set("branchId", selectedBranchId);
  }

  return `/dashboard?${params.toString()}${targetHash ? `#${targetHash}` : ""}`;
}

export function DashboardDateFilter({
  dateRange,
  selectedBranchId,
  targetHash,
}: DashboardDateFilterProps) {
  return (
    <details name="dashboard-header-filter" className="group relative">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 [&::-webkit-details-marker]:hidden">
        <CalendarDays size={16} aria-hidden="true" />
        {dateRange.label}
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isActive = dateRange.period === preset.period;

            return (
              <Link
                key={preset.period}
                href={buildPresetHref(preset.period, selectedBranchId, targetHash)}
                className={[
                  "inline-flex h-9 items-center justify-center rounded-xl text-sm font-semibold transition",
                  isActive
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900",
                ].join(" ")}
              >
                {preset.label}
              </Link>
            );
          })}
        </div>

        <form
          action={`/dashboard${targetHash ? `#${targetHash}` : ""}`}
          className="mt-3 rounded-xl bg-[#f7f8f4] p-3"
        >
          <input type="hidden" name="period" value="custom" />
          {selectedBranchId ? (
            <input type="hidden" name="branchId" value={selectedBranchId} />
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Rango personalizado
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">
                Desde
              </span>
              <input
                type="date"
                name="start"
                defaultValue={dateRange.startDate}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">
                Hasta
              </span>
              <input
                type="date"
                name="end"
                defaultValue={dateRange.endDate}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            Aplicar filtro
          </button>
        </form>
      </div>
    </details>
  );
}
