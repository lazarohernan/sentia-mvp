"use client";

import {
  Bell,
  Building2,
  Loader2,
  MapPin,
  MessageSquareText,
  PencilLine,
  Plus,
  QrCode,
  Star,
  X,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Branch } from "@/domain/branches/schemas";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
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

type DashboardShellProps = {
  organizationName?: string;
  branches?: Branch[];
  dashboardData?: DashboardSummaryData;
  dateRange?: DashboardDateRange;
};

type CreateBranchDrawerProps = {
  open: boolean;
  onClose: () => void;
  branch?: Branch | null;
  onSaved: (branch: Branch) => void;
};

function getBranchStatusToneClass(tone?: string, isActive = true) {
  if (!isActive) {
    return "bg-slate-100 text-slate-600";
  }

  if (tone === "danger") {
    return "bg-red-50 text-red-700";
  }

  if (tone === "warning") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-emerald-50 text-emerald-800";
}

function DashboardBranchesList({
  branches,
  dashboardData,
  onEdit,
}: {
  branches: Branch[];
  dashboardData?: DashboardSummaryData;
  onEdit: (branch: Branch) => void;
}) {
  const healthByBranch = new Map(
    (dashboardData?.branchHealth ?? []).map((item) => [item.branch, item]),
  );

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {branches.map((branch) => {
        const health = healthByBranch.get(branch.name);
        const status = branch.is_active ? health?.status ?? "Activa" : "Inactiva";
        const csatValue = health?.csat ?? "Sin datos";
        const commentsValue = health?.comments ?? "0 comentarios";

        return (
          <article
            key={branch.id}
            className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.96)_100%)] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Sucursal
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
                    {branch.name}
                  </h3>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getBranchStatusToneClass(
                    health?.tone,
                    branch.is_active,
                  )}`}
                >
                  {status}
                </span>
              </div>

              <p className="mt-4 flex min-w-0 items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {branch.address || "Direccion pendiente"}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 py-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Star className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                    CSAT
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {csatValue}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em]">
                    Comentarios
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {commentsValue}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Ruta de captura
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-600">
                  /feedback/{branch.slug}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(branch)}
                  aria-label={`Editar ${branch.name}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  Editar
                </button>
                <Link
                  href={`/feedback/${branch.slug}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Abrir
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CreateBranchDrawer({
  open,
  onClose,
  branch,
  onSaved,
}: CreateBranchDrawerProps) {
  const isEditing = Boolean(branch);
  const [name, setName] = useState(branch?.name ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/branches", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: branch?.id,
          name,
          address: address.trim() || undefined,
          is_active: isActive,
        }),
      });
      const body = (await response.json()) as {
        branch?: Branch;
        error?: string;
      };

      if (!response.ok || !body.branch) {
        setError(
          body.error ??
            (isEditing
              ? "No se pudo actualizar la sucursal."
              : "No se pudo crear la sucursal."),
        );
        return;
      }

      onSaved(body.branch);
      setName("");
      setAddress("");
      setIsActive(true);
      onClose();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className={[
        "fixed inset-0 z-50 transition-all duration-300 ease-out",
        open
          ? "pointer-events-auto bg-slate-950/30 backdrop-blur-[2px]"
          : "pointer-events-none bg-slate-950/0 backdrop-blur-0",
      ].join(" ")}
      role={open ? "presentation" : undefined}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar drawer"
        onClick={onClose}
      />
      <aside
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0",
        ].join(" ")}
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-labelledby="new-branch-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p
              className={[
                "text-sm font-semibold text-emerald-800 transition-all duration-300",
                open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              ].join(" ")}
            >
              {isEditing ? "Editar sucursal" : "Nueva sucursal"}
            </p>
            <h2
              id="new-branch-title"
              className={[
                "mt-1 text-xl font-semibold text-slate-950 transition-all delay-75 duration-300",
                open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              ].join(" ")}
            >
              Datos de la sucursal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div
            className={[
              "flex-1 space-y-5 overflow-y-auto px-6 py-6 transition-all delay-100 duration-300",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            ].join(" ")}
          >
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Nombre de sucursal
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={160}
                placeholder="Ej. Mall Norte"
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Direccion
              </span>
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={320}
                placeholder="Ej. Nivel 2, local 14"
                className="mt-2 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="mt-1 size-4 rounded border-slate-300 accent-emerald-700"
                aria-label="Sucursal activa"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-slate-900">
                  Sucursal activa
                </span>
                <span className="block text-sm leading-6 text-slate-500">
                  Si la desactivas, deja de mostrarse como operativa en el dashboard.
                </span>
              </span>
            </label>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">
              {isEditing ? (
                <>
                  Al guardar se actualizan los datos de la sucursal y su enlace
                  de captura visible en el dashboard.
                </>
              ) : (
                <>
                  Al guardar se crea la sucursal y queda listo su enlace de captura
                  en formato <span className="font-semibold">/feedback/nombre</span>.
                </>
              )}
            </div>

            {error ? (
              <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <div
            className={[
              "flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5 transition-all delay-150 duration-300",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {isEditing ? "Guardar cambios" : "Guardar sucursal"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export function DashboardShell({
  organizationName,
  branches,
  dashboardData,
  dateRange = getDashboardDateRange({}),
}: DashboardShellProps) {
  const serverBranches = branches ?? [];
  const serverBranchIds = new Set(serverBranches.map((branch) => branch.id));
  const [showDemoData, setShowDemoData] = useState(false);
  const [activeView, setActiveView] = useState<DashboardNavView>("resumen");
  const [createdBranches, setCreatedBranches] = useState<Branch[]>([]);
  const [updatedBranches, setUpdatedBranches] = useState<Record<string, Branch>>({});
  const [isBranchDrawerOpen, setIsBranchDrawerOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const liveBranches = [
    ...createdBranches.filter((branch) => !serverBranchIds.has(branch.id)),
    ...serverBranches.map((branch) => updatedBranches[branch.id] ?? branch),
  ];

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

  function openCreateBranchDrawer() {
    setSelectedBranch(null);
    setIsBranchDrawerOpen(true);
  }

  function openEditBranchDrawer(branch: Branch) {
    setSelectedBranch(branch);
    setIsBranchDrawerOpen(true);
  }

  function closeBranchDrawer() {
    setSelectedBranch(null);
    setIsBranchDrawerOpen(false);
  }

  function handleBranchSaved(branch: Branch) {
    setCreatedBranches((current) => {
      const existsInCreated = current.some((item) => item.id === branch.id);

      if (!existsInCreated && serverBranchIds.has(branch.id)) {
        return current;
      }

      if (existsInCreated) {
        return current.map((item) => (item.id === branch.id ? branch : item));
      }

      return [branch, ...current];
    });

    if (serverBranchIds.has(branch.id)) {
      setUpdatedBranches((current) => ({
        ...current,
        [branch.id]: branch,
      }));
    }
  }

  const demoDataToggle = (
    <DashboardDemoDataToggle
      pressed={showDemoData}
      onPressedChange={toggleDemoData}
    />
  );
  const branchesAction = (
    <div className="flex flex-wrap items-center gap-3">
      {demoDataToggle}
      <button
        type="button"
        onClick={openCreateBranchDrawer}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Nueva sucursal
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <DashboardFloatingNav
        activeView={activeView}
        onViewChange={setActiveView}
        notifications={showDemoData ? undefined : dashboardData?.notifications}
      />
      <section className="mx-auto w-full max-w-[92rem] px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div>
          {activeView === "resumen" ? (
            <>
              <DashboardExecutiveHeader
                showDemoData={showDemoData}
                onToggleDemoData={toggleDemoData}
                organizationName={organizationName}
                branchCount={liveBranches.length}
                dashboardData={dashboardData}
                dateRange={dateRange}
              />
              <DashboardSummaryView
                showDemoData={showDemoData}
                dashboardData={dashboardData}
              />
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
                comments={
                  showDemoData ? dashboardMockComments : dashboardData?.comments ?? []
                }
              />
            </DashboardSection>
          ) : null}

          {activeView === "qr" ? (
            <DashboardQrView
              showDemoData={showDemoData}
              onToggleDemoData={toggleDemoData}
              organizationName={organizationName}
              branches={liveBranches}
              dashboardData={dashboardData}
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
                      className="rounded-lg border border-slate-200 bg-white p-5"
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
              action={branchesAction}
            >
              {showDemoData ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
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
              ) : liveBranches.length > 0 ? (
                <DashboardBranchesList
                  branches={liveBranches}
                  dashboardData={dashboardData}
                  onEdit={openEditBranchDrawer}
                />
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
                      className="rounded-lg border border-slate-200 bg-white p-5"
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
      <CreateBranchDrawer
        key={`${selectedBranch?.id ?? "create-branch"}-${isBranchDrawerOpen ? "open" : "closed"}`}
        open={isBranchDrawerOpen}
        branch={selectedBranch}
        onClose={closeBranchDrawer}
        onSaved={handleBranchSaved}
      />
    </main>
  );
}
