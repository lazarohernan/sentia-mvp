"use client";

import { BarChart3, List } from "lucide-react";

export type ValoracionesTab = "listado" | "graficos";

type DashboardValoracionesTabsProps = {
  activeTab: ValoracionesTab;
  onTabChange: (tab: ValoracionesTab) => void;
};

export function DashboardValoracionesTabs({
  activeTab,
  onTabChange,
}: DashboardValoracionesTabsProps) {
  const tabs = [
    { id: "listado" as const, label: "Listado", icon: List },
    { id: "graficos" as const, label: "Gráficos", icon: BarChart3 },
  ];

  return (
    <div
      role="tablist"
      aria-label="Secciones de valoraciones"
      className="mb-5 w-fit max-w-full overflow-x-auto rounded-full bg-white p-1 backdrop-blur"
    >
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
                isActive
                  ? "bg-emerald-800 text-white shadow-emerald-900/20"
                  : "text-slate-600 hover:bg-white hover:text-emerald-900",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
