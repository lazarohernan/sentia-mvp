"use client";

import { CalendarDays, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import type { DashboardDateRange } from "@/domain/dashboard/date-range";

type DashboardDateFilterProps = {
  dateRange: DashboardDateRange;
  selectedBranchId?: string;
  selectedBranchIds?: string[];
  targetHash?: string;
  basePath?: string;
};

const presets = [
  { label: "Hoy", period: "today" },
  { label: "7 días", period: "7d" },
  { label: "30 días", period: "30d" },
];

function buildFilterHref(params: {
  period: string;
  selectedBranchId?: string;
  selectedBranchIds?: string[];
  targetHash?: string;
  basePath?: string;
  start?: string;
  end?: string;
}) {
  const searchParams = new URLSearchParams({ period: params.period });

  if (params.period === "custom") {
    if (params.start) searchParams.set("start", params.start);
    if (params.end) searchParams.set("end", params.end);
  }

  if (params.selectedBranchIds && params.selectedBranchIds.length > 0) {
    params.selectedBranchIds.forEach((branchId) =>
      searchParams.append("branchId", branchId),
    );
  } else if (params.selectedBranchId) {
    searchParams.set("branchId", params.selectedBranchId);
  }

  const basePath = params.basePath ?? "/dashboard";
  return `${basePath}?${searchParams.toString()}${
    params.targetHash ? `#${params.targetHash}` : ""
  }`;
}

export function DashboardDateFilter({
  dateRange,
  selectedBranchId,
  selectedBranchIds,
  targetHash,
  basePath = "/dashboard",
}: DashboardDateFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  function navigateTo(href: string) {
    setIsOpen(false);
    startTransition(() => {
      router.push(href);
    });
  }

  function handlePresetClick(period: string) {
    navigateTo(
      buildFilterHref({
        period,
        selectedBranchId,
        selectedBranchIds,
        targetHash,
        basePath,
      }),
    );
  }

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const start = String(formData.get("start") ?? "");
    const end = String(formData.get("end") ?? "");

    navigateTo(
      buildFilterHref({
        period: "custom",
        start,
        end,
        selectedBranchId,
        selectedBranchIds,
        targetHash,
        basePath,
      }),
    );
  }

  return (
    <details
      name="dashboard-header-filter"
      className="group relative"
      open={isOpen}
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
      }}
    >
      <summary
        className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 [&::-webkit-details-marker]:hidden"
        aria-busy={isPending}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <CalendarDays size={16} aria-hidden="true" />
        )}
        {dateRange.label}
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isActive = dateRange.period === preset.period;

            return (
              <button
                key={preset.period}
                type="button"
                disabled={isPending}
                onClick={() => handlePresetClick(preset.period)}
                className={[
                  "inline-flex h-9 items-center justify-center rounded-xl text-sm font-semibold transition disabled:cursor-wait disabled:opacity-70",
                  isActive
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900",
                ].join(" ")}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleCustomSubmit}
          className="mt-3 rounded-xl bg-[#f7f8f4] p-3"
        >
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
                disabled={isPending}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-70"
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
                disabled={isPending}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-70"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-80"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Aplicando…" : "Aplicar filtro"}
          </button>
        </form>
      </div>
    </details>
  );
}
