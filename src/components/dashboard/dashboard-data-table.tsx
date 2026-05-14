"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Dropdown } from "@/components/ui/dropdown";

export type DashboardDataTableColumn<Row> = {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
  className?: string;
};

export type DashboardDataTableFilter<Row> = {
  key: string;
  label: string;
  options: string[];
  getValue: (row: Row) => string;
};

type DashboardDataTableProps<Row> = {
  data: Row[];
  columns: DashboardDataTableColumn<Row>[];
  filters?: DashboardDataTableFilter<Row>[];
  getSearchText: (row: Row) => string;
  getRowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  rowActionLabel?: (row: Row) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyTitle?: string;
};

const allOption = "Todos";

export function DashboardDataTable<Row>({
  data,
  columns,
  filters = [],
  getSearchText,
  getRowKey,
  onRowClick,
  rowActionLabel,
  searchPlaceholder = "Buscar",
  pageSize = 5,
  emptyTitle = "Sin resultados",
}: DashboardDataTableProps<Row>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >(() =>
    filters.reduce<Record<string, string>>((values, filter) => {
      values[filter.key] = allOption;
      return values;
    }, {}),
  );

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.filter((row) => {
      const matchesSearch = normalizedQuery
        ? getSearchText(row).toLowerCase().includes(normalizedQuery)
        : true;
      const matchesFilters = filters.every((filter) => {
        const selected = selectedFilters[filter.key] ?? allOption;

        return selected === allOption || filter.getValue(row) === selected;
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, filters, getSearchText, query, selectedFilters]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visibleRows = filteredData.slice(start, start + pageSize);

  function updateFilter(key: string, value: string) {
    setSelectedFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">{searchPlaceholder}</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-full border border-slate-200 bg-[#f7f8f4] pl-9 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Dropdown
              key={filter.key}
              label={filter.label}
              value={selectedFilters[filter.key] ?? allOption}
              onChange={(value) => updateFilter(filter.key, value)}
              options={[
                { value: allOption, label: allOption },
                ...filter.options.map((option) => ({ value: option, label: option })),
              ]}
            />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#f7f8f4]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={[
                    "px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400",
                    column.className,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={[
                    "border-b border-slate-100 last:border-b-0",
                    onRowClick
                      ? "cursor-pointer transition hover:bg-emerald-50/40"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  aria-label={rowActionLabel?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "px-5 py-4 align-top text-sm text-slate-600",
                        column.className,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm font-medium text-slate-500"
                >
                  {emptyTitle}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {filteredData.length === 0
            ? "0 resultados"
            : `${start + 1}-${Math.min(
                start + visibleRows.length,
                filteredData.length,
              )} de ${filteredData.length}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Pagina anterior"
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <span className="min-w-16 text-center text-sm font-semibold text-slate-600">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            disabled={currentPage === pageCount}
            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Pagina siguiente"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
