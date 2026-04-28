import {
  Building2,
  CalendarDays,
  Download,
  Filter,
  Plus,
  Store,
} from "lucide-react";

import { dashboardMockContext } from "./dashboard.mock-data";
import { DashboardDemoDataToggle } from "./dashboard-demo-data-toggle";

type DashboardExecutiveHeaderProps = {
  showDemoData: boolean;
  onToggleDemoData: () => void;
};

export function DashboardExecutiveHeader({
  showDemoData,
  onToggleDemoData,
}: DashboardExecutiveHeaderProps) {
  const context = showDemoData
    ? dashboardMockContext
    : {
        company: "Configuracion pendiente",
        scope: "Sin alcance",
        period: "Sin periodo",
      };

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Lectura ejecutiva para detectar riesgo, tendencia y puntos de
            accion.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700">
              <Building2 size={15} aria-hidden="true" />
              {context.company}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <Store size={15} aria-hidden="true" />
              {context.scope}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <CalendarDays size={15} aria-hidden="true" />
              {context.period}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <DashboardDemoDataToggle
            pressed={showDemoData}
            onPressedChange={onToggleDemoData}
          />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
            aria-label="Filtrar"
          >
            <Filter size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900"
            aria-label="Exportar"
          >
            <Download size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
          >
            <Plus size={16} aria-hidden="true" />
            Nueva captura
          </button>
        </div>
      </div>
    </header>
  );
}
