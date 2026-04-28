"use client";

import {
  Bell,
  Building2,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  dashboardMockAlerts,
  dashboardMockBranches,
  dashboardMockComments,
  dashboardMockTeam,
} from "./dashboard.mock-data";
import { DashboardCommentsTable } from "./dashboard-comments-table";
import { DashboardDemoDataToggle } from "./dashboard-demo-data-toggle";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardExecutiveHeader } from "./dashboard-executive-header";
import { DashboardFloatingNav } from "./dashboard-floating-nav";
import type { DashboardNavView } from "./dashboard-floating-nav";
import { DashboardQrView } from "./dashboard-qr-view";
import { DashboardSection } from "./dashboard-section";
import { DashboardSummaryView } from "./dashboard-summary-view";

function getDashboardViewFromHash(): DashboardNavView {
  if (typeof window === "undefined") {
    return "resumen";
  }

  const hash = window.location.hash.replace("#", "");

  if (
    hash === "comentarios" ||
    hash === "qr" ||
    hash === "alertas" ||
    hash === "sucursales" ||
    hash === "equipo"
  ) {
    return hash;
  }

  return "resumen";
}

export function DashboardShell() {
  const [showDemoData, setShowDemoData] = useState(false);
  const [activeView, setActiveView] = useState<DashboardNavView>("resumen");

  useEffect(() => {
    function updateActiveView() {
      setActiveView(getDashboardViewFromHash());
    }

    updateActiveView();
    window.addEventListener("hashchange", updateActiveView);
    window.addEventListener("popstate", updateActiveView);

    return () => {
      window.removeEventListener("hashchange", updateActiveView);
      window.removeEventListener("popstate", updateActiveView);
    };
  }, []);

  function toggleDemoData() {
    setShowDemoData((current) => !current);
  }

  const demoDataToggle = (
    <DashboardDemoDataToggle
      pressed={showDemoData}
      onPressedChange={toggleDemoData}
    />
  );

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-slate-950">
      <DashboardFloatingNav
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-28 sm:px-8 lg:px-10">
        <div>
          {activeView === "resumen" ? (
            <>
              <DashboardExecutiveHeader
                showDemoData={showDemoData}
                onToggleDemoData={toggleDemoData}
              />
              <DashboardSummaryView showDemoData={showDemoData} />
            </>
          ) : null}

          {activeView === "comentarios" ? (
            <DashboardSection
              id="comentarios"
              title="Comentarios"
              description="Entradas recibidas desde los canales de feedback."
              action={demoDataToggle}
            >
              <DashboardCommentsTable
                comments={showDemoData ? dashboardMockComments : []}
              />
            </DashboardSection>
          ) : null}

          {activeView === "qr" ? (
            <DashboardQrView
              showDemoData={showDemoData}
              onToggleDemoData={toggleDemoData}
            />
          ) : null}

          {activeView === "alertas" ? (
            <DashboardSection
              id="alertas"
              title="Alertas"
              description="Situaciones que requieren atención o seguimiento."
              action={demoDataToggle}
            >
              {showDemoData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {dashboardMockAlerts.map((alert) => (
                    <article
                      key={alert.title}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-slate-950">
                            {alert.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {alert.branch}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {alert.priority}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {alert.detail}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  icon={Bell}
                  title="Sin alertas abiertas"
                  description="Las alertas se mostrarán cuando haya señales que atender."
                />
              )}
            </DashboardSection>
          ) : null}

          {activeView === "sucursales" ? (
            <DashboardSection
              id="sucursales"
              title="Sucursales"
              description="Puntos de atención o unidades operativas."
              action={demoDataToggle}
            >
              {showDemoData ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  {dashboardMockBranches.map((branch) => (
                    <div
                      key={branch.name}
                      className="grid gap-3 border-b border-slate-100 p-5 last:border-b-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                    >
                      <h3 className="font-semibold text-slate-950">
                        {branch.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Satisfaccion {branch.score}
                      </p>
                      <p className="text-sm text-slate-600">
                        {branch.comments} comentarios
                      </p>
                      <p className="text-sm font-semibold text-emerald-800">
                        {branch.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  icon={Building2}
                  title="Sin sucursales configuradas"
                  description="Las sucursales aparecerán cuando se agreguen al sistema."
                />
              )}
            </DashboardSection>
          ) : null}

          {activeView === "equipo" ? (
            <DashboardSection
              id="equipo"
              title="Equipo"
              description="Personas que participan en atención y seguimiento."
              action={demoDataToggle}
            >
              {showDemoData ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {dashboardMockTeam.map((member) => (
                    <article
                      key={member.name}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <h3 className="font-semibold text-slate-950">
                        {member.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {member.role}
                      </p>
                      <p className="mt-5 text-sm font-semibold text-emerald-800">
                        {member.status}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <DashboardEmptyState
                  icon={UsersRound}
                  title="Sin equipo registrado"
                  description="Los usuarios y colaboradores aparecerán en esta sección."
                />
              )}
            </DashboardSection>
          ) : null}
        </div>
      </section>
    </main>
  );
}
