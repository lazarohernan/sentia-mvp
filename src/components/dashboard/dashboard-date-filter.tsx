"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DateRange,
} from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";

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

function parseYmd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Elige desde y hasta";
  const fromLabel = range.from.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
  });
  if (!range.to) return `${fromLabel} → …`;
  const toLabel = range.to.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
  });
  return `${fromLabel} – ${toLabel}`;
}

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
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: parseYmd(dateRange.startDate),
    to: parseYmd(dateRange.endDate),
  }));

  const defaultClassNames = useMemo(() => getDefaultClassNames(), []);
  const canApply = Boolean(range?.from && range?.to);
  const isCustomActive = dateRange.period === "custom";

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

  function handleApplyCustom() {
    if (!range?.from || !range.to) return;
    navigateTo(
      buildFilterHref({
        period: "custom",
        start: formatYmd(range.from),
        end: formatYmd(range.to),
        selectedBranchId,
        selectedBranchIds,
        targetHash,
        basePath,
      }),
    );
  }

  function handleClearFilter() {
    setRange(undefined);
    navigateTo(
      buildFilterHref({
        period: "7d",
        selectedBranchId,
        selectedBranchIds,
        targetHash,
        basePath,
      }),
    );
  }

  const canClear =
    dateRange.period !== "7d" || Boolean(range?.from || range?.to);

  return (
    <details
      name="dashboard-header-filter"
      className="group relative"
      open={isOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setIsOpen(nextOpen);
        if (nextOpen) {
          setRange({
            from: parseYmd(dateRange.startDate),
            to: parseYmd(dateRange.endDate),
          });
        }
      }}
    >
      <summary
        className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 [&::-webkit-details-marker]:hidden"
        aria-busy={isPending}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <CalendarDays size={16} aria-hidden="true" />
        )}
        {dateRange.label}
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-[min(22.5rem,calc(100vw-2rem))] rounded-2xl bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,0.16)]">
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

        <div
          className={[
            "mt-3 rounded-xl p-3",
            isCustomActive ? "bg-emerald-50/70" : "bg-[#f7f8f4]",
          ].join(" ")}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Rango personalizado
            </p>
            <p className="text-xs font-medium text-emerald-900/80">
              {formatRangeLabel(range)}
            </p>
          </div>

          <DayPicker
            mode="range"
            locale={es}
            selected={range}
            onSelect={setRange}
            disabled={isPending}
            numberOfMonths={1}
            defaultMonth={range?.from ?? parseYmd(dateRange.startDate)}
            className="rdp-perks mx-auto"
            classNames={{
              root: `${defaultClassNames.root} rdp-perks w-full`,
              months: `${defaultClassNames.months} w-full`,
              month: `${defaultClassNames.month} w-full`,
              month_caption: `${defaultClassNames.month_caption} mb-2 px-8 text-sm font-semibold capitalize text-slate-800`,
              nav: `${defaultClassNames.nav} absolute inset-x-0 top-0 flex items-center justify-between`,
              button_previous: `${defaultClassNames.button_previous} inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-emerald-900`,
              button_next: `${defaultClassNames.button_next} inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-emerald-900`,
              weekdays: `${defaultClassNames.weekdays} mt-1`,
              weekday: `${defaultClassNames.weekday} text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-slate-400`,
              week: `${defaultClassNames.week} mt-1`,
              day: `${defaultClassNames.day} text-sm`,
              day_button: `${defaultClassNames.day_button} rounded-lg font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900`,
              selected: defaultClassNames.selected,
              range_start: defaultClassNames.range_start,
              range_end: defaultClassNames.range_end,
              range_middle: defaultClassNames.range_middle,
              today: `${defaultClassNames.today}`,
              outside: `${defaultClassNames.outside} text-slate-300`,
              disabled: `${defaultClassNames.disabled} text-slate-300`,
              chevron: `${defaultClassNames.chevron} fill-emerald-800`,
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft size={16} aria-hidden="true" />
                ) : (
                  <ChevronRight size={16} aria-hidden="true" />
                ),
            }}
          />

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              disabled={isPending || !canApply}
              onClick={handleApplyCustom}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? "Aplicando…" : "Aplicar filtro"}
            </button>
            <button
              type="button"
              disabled={isPending || !canClear}
              onClick={handleClearFilter}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Limpiar filtro
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
