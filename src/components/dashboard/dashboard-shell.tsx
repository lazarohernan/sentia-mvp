"use client";

import {
  Building2,
  Loader2,
  MapPin,
  MessageSquareText,
  PencilLine,
  Plus,
  QrCode,
  Settings2,
  ShieldCheck,
  Star,
  X,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Branch } from "@/domain/branches/schemas";
import type { AgentOperationalReport } from "@/domain/agent/context";
import { buildDashboardAlertItems } from "@/domain/dashboard/alerts";
import type { ReportPeriod } from "@/domain/dashboard/report-cadence";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import { getDashboardViewFromNotificationHref } from "@/domain/notifications/navigation";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import type { ListeningEventRow } from "@/domain/listening/schemas";
import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";
import type { PermissionProfile } from "@/domain/organizations/permission-profiles";
import type { TeamMember } from "@/domain/organizations/team";
import { AddTeamMemberDrawer } from "./add-team-member-drawer";
import { DashboardAlertsView } from "./dashboard-alerts-panel";
import { DashboardCommentsTable } from "./dashboard-comments-table";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DashboardExecutiveHeader } from "./dashboard-executive-header";
import { DashboardBusinessProfileDrawer } from "./dashboard-business-profile-drawer";
import { DashboardFloatingNav } from "./dashboard-floating-nav";
import type { DashboardNavView } from "./dashboard-floating-nav";
import { DashboardImprovementPlans } from "./dashboard-improvement-plans";
import { DashboardIntelligenceReports } from "./dashboard-intelligence-reports";
import { DashboardBranchQrPanel } from "./dashboard-branch-qr-panel";
import { DashboardOrganizationOperationalSettingsPanel } from "./dashboard-organization-operational-settings-panel";
import { DashboardReportCadenceSettingsPanel } from "./dashboard-report-cadence-settings-panel";
import { DashboardPermissionProfilesPanel } from "./dashboard-permission-profiles-panel";
import { DashboardSection } from "./dashboard-section";
import { DashboardSummaryView } from "./dashboard-summary-view";
import { DashboardTeamPanel } from "./dashboard-team-panel";
import type { DashboardCurrentUser } from "./dashboard-user-menu";
import { PlatformFooter } from "@/components/platform-footer";

type OperationsTab = "sucursales" | "equipo" | "permisos" | "configuracion";
type ReportsTab = "informes" | "mejoras";

function getDashboardViewFromHash(): DashboardNavView {
  if (typeof window === "undefined") {
    return "resumen";
  }

  const hash = window.location.hash.replace("#", "");

  if (hash === "mejoras") {
    return "informes";
  }

  if (hash === "comentarios" || hash === "alertas" || hash === "informes") {
    return hash;
  }

  if (
    hash === "qr" ||
    hash === "sucursales" ||
    hash === "equipo" ||
    hash === "permisos" ||
    hash === "configuracion"
  ) {
    return "gestion";
  }

  return "resumen";
}

function getOperationsTabFromHash(): OperationsTab {
  if (typeof window === "undefined") {
    return "equipo";
  }

  const hash = window.location.hash.replace("#", "");

  if (hash === "qr" || hash === "sucursales") {
    return "sucursales";
  }

  if (hash === "permisos" || hash === "configuracion") {
    return hash;
  }

  if (hash === "equipo") {
    return "equipo";
  }

  return "equipo";
}

function getReportsTabFromHash(): ReportsTab {
  if (typeof window === "undefined") {
    return "informes";
  }

  const hash = window.location.hash.replace("#", "");
  return hash === "mejoras" ? "mejoras" : "informes";
}

type DashboardShellProps = {
  organizationName?: string;
  organizationSettings?: OrganizationSettings;
  branches?: Branch[];
  selectedBranchId?: string;
  lockedBranchScope?: boolean;
  teamMembers?: TeamMember[];
  permissionProfiles?: PermissionProfile[];
  canManageTeam?: boolean;
  actorRole?: "owner" | "manager";
  currentUserId?: string;
  currentUser?: DashboardCurrentUser;
  listeningEvents?: ListeningEventRow[];
  dashboardData?: DashboardSummaryData;
  latestAgentReport?: AgentOperationalReport;
  dateRange?: DashboardDateRange;
  informesReportPeriod?: ReportPeriod;
  autoOpenReport?: boolean;
};

type CreateBranchDrawerProps = {
  open: boolean;
  onClose: () => void;
  branch?: Branch | null;
  onSaved: (branch: Branch) => void;
  onViewQr?: (branch: Branch) => void;
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
  onViewQr,
}: {
  branches: Branch[];
  dashboardData?: DashboardSummaryData;
  onEdit: (branch: Branch) => void;
  onViewQr: (branch: Branch) => void;
}) {
  const healthByBranch = new Map(
    (dashboardData?.branchHealth ?? []).map((item) => [
      item.branchId ?? `name:${item.branch}`,
      item,
    ]),
  );

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {branches.map((branch) => {
        const health = healthByBranch.get(branch.id) ?? healthByBranch.get(`name:${branch.name}`);
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
                  Codigo QR
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-600">
                  Enlace firmado por sucursal
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
                <button
                  type="button"
                  onClick={() => onViewQr(branch)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Ver QR
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OperationsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: OperationsTab;
  onTabChange: (tab: OperationsTab) => void;
}) {
  const tabs = [
    { id: "sucursales", label: "Sucursales", icon: Building2 },
    { id: "equipo", label: "Equipo", icon: UsersRound },
    { id: "permisos", label: "Permisos", icon: ShieldCheck },
    { id: "configuracion", label: "Configuracion", icon: Settings2 },
  ] satisfies Array<{
    id: OperationsTab;
    label: string;
    icon: typeof QrCode;
  }>;

  return (
    <div className="mb-5 w-fit max-w-full overflow-x-auto rounded-full border border-white/70 bg-white/75 p-1 shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/5 backdrop-blur">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-pressed={isActive}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition",
                isActive
                  ? "bg-emerald-800 text-white shadow-sm shadow-emerald-900/20"
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

function CreateBranchDrawer({
  open,
  onClose,
  branch,
  onSaved,
  onViewQr,
}: CreateBranchDrawerProps) {
  const isEditing = Boolean(branch);
  const [name, setName] = useState(branch?.name ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [isActive, setIsActive] = useState(branch?.is_active ?? true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBranch, setSavedBranch] = useState<Branch | null>(null);

  function resetForm() {
    setName(branch?.name ?? "");
    setAddress(branch?.address ?? "");
    setIsActive(branch?.is_active ?? true);
    setError("");
    setSavedBranch(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

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

      if (isEditing) {
        setName("");
        setAddress("");
        setIsActive(true);
        handleClose();
        return;
      }

      setSavedBranch(body.branch);
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
        onClick={handleClose}
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
            onClick={handleClose}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>

        {savedBranch ? (
          <div className="flex flex-1 flex-col px-6 py-6">
            <p className="text-sm leading-6 text-slate-600">
              <span className="font-semibold text-slate-950">{savedBranch.name}</span>{" "}
              quedo lista. Genera su codigo QR para compartirlo con clientes.
            </p>
            <div className="mt-5 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">
              Ruta firmada:{" "}
              <span className="font-semibold">/q/...</span>
            </div>
            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  onViewQr?.(savedBranch);
                  handleClose();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-800 px-5 text-sm font-semibold text-white"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Ver codigo QR
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700"
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
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
                  en formato <span className="font-semibold">/q/...</span>.
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
              onClick={handleClose}
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
        )}
      </aside>
    </div>
  );
}

export function DashboardShell({
  organizationName,
  organizationSettings: initialOrganizationSettings,
  branches,
  selectedBranchId,
  lockedBranchScope = false,
  teamMembers: initialTeamMembers = [],
  permissionProfiles: initialPermissionProfiles = [],
  canManageTeam = false,
  actorRole,
  currentUserId,
  currentUser,
  dashboardData,
  latestAgentReport,
  dateRange = getDashboardDateRange({}),
  informesReportPeriod,
  autoOpenReport = false,
}: DashboardShellProps) {
  const serverBranches = branches ?? [];
  const serverBranchIds = new Set(serverBranches.map((branch) => branch.id));
  const [activeView, setActiveView] = useState<DashboardNavView>("resumen");
  const [activeOperationsTab, setActiveOperationsTab] =
    useState<OperationsTab>("equipo");
  const [activeReportsTab, setActiveReportsTab] = useState<ReportsTab>("informes");
  const [createdBranches, setCreatedBranches] = useState<Branch[]>([]);
  const [updatedBranches, setUpdatedBranches] = useState<Record<string, Branch>>({});
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [permissionProfiles, setPermissionProfiles] = useState(initialPermissionProfiles);
  const [organizationSettings, setOrganizationSettings] = useState(
    initialOrganizationSettings,
  );
  const [liveOrganizationName, setLiveOrganizationName] = useState(organizationName);
  const [isBranchDrawerOpen, setIsBranchDrawerOpen] = useState(false);
  const [isTeamMemberDrawerOpen, setIsTeamMemberDrawerOpen] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null);
  const canManageFollowUp = actorRole === "owner" || actorRole === "manager";
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [qrBranchId, setQrBranchId] = useState<string | null>(null);
  const [selectedQrBranch, setSelectedQrBranch] = useState<Branch | null>(null);
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false);
  const liveBranches = [
    ...createdBranches.filter((branch) => !serverBranchIds.has(branch.id)),
    ...serverBranches.map((branch) => updatedBranches[branch.id] ?? branch),
  ];

  useEffect(() => {
    function updateActiveView() {
      setActiveView(getDashboardViewFromHash());
      setActiveOperationsTab(getOperationsTabFromHash());
      setActiveReportsTab(getReportsTabFromHash());
    }

    updateActiveView();
    window.addEventListener("hashchange", updateActiveView);
    window.addEventListener("popstate", updateActiveView);

    return () => {
      window.removeEventListener("hashchange", updateActiveView);
      window.removeEventListener("popstate", updateActiveView);
    };
  }, []);

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

  function handleOperationsTabChange(tab: OperationsTab) {
    window.history.pushState({}, "", `/dashboard#${tab}`);
    setActiveView("gestion");
    setActiveOperationsTab(tab);
    setQrBranchId(null);
    setSelectedQrBranch(null);
  }

  function handleReportsTabChange(tab: ReportsTab) {
    window.history.pushState({}, "", `/dashboard#${tab}`);
    setActiveView("informes");
    setActiveReportsTab(tab);
  }

  function openBranchQrView(branch: Branch) {
    setActiveView("gestion");
    setActiveOperationsTab("sucursales");
    setQrBranchId(branch.id);
    setSelectedQrBranch(branch);
    window.history.pushState({}, "", "/dashboard#sucursales");
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

  const branchesAction = (
    <div className="flex flex-wrap items-center gap-3">
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
  const teamAction = canManageTeam ? (
    <button
      type="button"
      onClick={() => setIsTeamMemberDrawerOpen(true)}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition hover:bg-emerald-900"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      Agregar colaborador
    </button>
  ) : null;

  const liveAlerts =
    dashboardData === undefined
      ? []
      : buildDashboardAlertItems({
          notifications: dashboardData.notifications,
          attentionItems: dashboardData.attentionItems,
        });
  const qrBranch = qrBranchId
    ? liveBranches.find((branch) => branch.id === qrBranchId) ?? selectedQrBranch
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f4f8f5_0%,#e9f0ed_100%)] text-slate-950">
      <DashboardFloatingNav
        activeView={activeView}
        onViewChange={setActiveView}
        onNotificationNavigate={(href) => {
          const nextView = getDashboardViewFromNotificationHref(href);
          if (nextView) {
            setActiveView(nextView);
            if (nextView === "informes") {
              setActiveReportsTab("informes");
            }
          }
        }}
        notifications={dashboardData?.notifications}
        currentUser={currentUser}
        organizationName={liveOrganizationName}
        canManageBusinessProfile={canManageTeam}
        onOpenBusinessProfile={() => setIsBusinessProfileOpen(true)}
      />
      <section className="mx-auto flex w-full max-w-368 flex-1 flex-col px-4 pb-4 pt-28 sm:px-6 lg:px-8">
        <div className="flex-1">
          {activeView === "resumen" ? (
            <>
              <DashboardExecutiveHeader
                dashboardData={dashboardData}
                dateRange={dateRange}
                branches={liveBranches}
                selectedBranchId={selectedBranchId}
                lockedBranchScope={lockedBranchScope}
              />
              <DashboardSummaryView
                dashboardData={dashboardData}
                alerts={liveAlerts}
              />
            </>
          ) : null}

          {activeView === "comentarios" ? (
            <DashboardSection
              id="comentarios"
              title="Valoraciones"
              description="Opiniones, calificaciones y señales recibidas desde los canales de feedback."
            >
              <DashboardCommentsTable
                comments={dashboardData?.comments ?? []}
                dateRange={dashboardData?.dateRange ?? dateRange}
                canManageFollowUp={canManageFollowUp}
                initialSelectedCommentId={pendingCommentId}
                onCloseDetail={() => setPendingCommentId(null)}
                onCommentUpdated={() => {
                  setPendingCommentId(null);
                }}
              />
            </DashboardSection>
          ) : null}

          {activeView === "informes" ? (
            <DashboardSection
              id="informes"
              title="Informes"
              description="Resumen inteligente de patrones, calidad de información y acciones por establecimiento."
            >
              <div className="space-y-5">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => handleReportsTabChange("informes")}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      activeReportsTab === "informes"
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    Informes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportsTabChange("mejoras")}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      activeReportsTab === "mejoras"
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    Mejoras
                  </button>
                </div>

                {activeReportsTab === "informes" ? (
                  <DashboardIntelligenceReports
                    dashboardData={dashboardData}
                    organizationName={organizationName}
                    organizationSettings={organizationSettings}
                    initialAgentReport={latestAgentReport}
                    initialReportPeriod={informesReportPeriod}
                    autoOpenReport={autoOpenReport}
                  />
                ) : (
                  <DashboardImprovementPlans dashboardData={dashboardData} />
                )}
              </div>
            </DashboardSection>
          ) : null}

          {activeView === "gestion" ? (
            <section id="gestion" className="scroll-mt-28">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
                  Gestión
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Administra sucursales y equipo desde una sola vista.
                </p>
              </div>

              <OperationsTabs
                activeTab={activeOperationsTab}
                onTabChange={handleOperationsTabChange}
              />

              {activeOperationsTab === "sucursales" ? (
                qrBranch ? (
                  <DashboardBranchQrPanel
                    branch={qrBranch}
                    organizationName={liveOrganizationName}
                    organizationLogoUrl={organizationSettings?.logoUrl}
                    dashboardData={dashboardData}
                    onBack={() => {
                      setQrBranchId(null);
                      setSelectedQrBranch(null);
                    }}
                  />
                ) : (
                <DashboardSection
                  id="sucursales"
                  title="Sucursales"
                  description="Puntos de atención o unidades operativas."
                  action={branchesAction}
                >
                  {liveBranches.length > 0 ? (
                    <DashboardBranchesList
                      branches={liveBranches}
                      dashboardData={dashboardData}
                      onEdit={openEditBranchDrawer}
                      onViewQr={openBranchQrView}
                    />
                  ) : (
                    <DashboardEmptyState
                      icon={Building2}
                      title="Sin sucursales configuradas"
                      description="Las sucursales aparecerán cuando se agreguen al sistema."
                    />
                  )}
                </DashboardSection>
                )
              ) : null}

              {activeOperationsTab === "equipo" ? (
                <DashboardSection
                  id="equipo"
                  title="Equipo"
                  description="Personas que participan en atención y seguimiento."
                  action={teamAction}
                >
                  <DashboardTeamPanel
                    teamMembers={teamMembers}
                    canManageTeam={canManageTeam}
                    actorRole={actorRole}
                    currentUserId={currentUserId}
                    permissionProfiles={permissionProfiles}
                    onMemberUpdated={(member) => {
                      setTeamMembers((current) =>
                        current.map((item) =>
                          item.userId === member.userId ? member : item,
                        ),
                      );
                    }}
                    onMemberRemoved={(userId) => {
                      setTeamMembers((current) =>
                        current.filter((item) => item.userId !== userId),
                      );
                    }}
                  />
                </DashboardSection>
              ) : null}

              {activeOperationsTab === "permisos" ? (
                <DashboardSection
                  id="permisos"
                  title="Permisos"
                  description="Roles operativos con acceso a secciones especificas de la plataforma."
                >
                  <DashboardPermissionProfilesPanel
                    profiles={permissionProfiles}
                    canManage={canManageTeam}
                    onProfileCreated={(profile) => {
                      setPermissionProfiles((current) => [...current, profile]);
                    }}
                    onProfileUpdated={(profile) => {
                      setPermissionProfiles((current) =>
                        current.map((item) =>
                          item.id === profile.id ? profile : item,
                        ),
                      );
                    }}
                    onProfileDeleted={(profileId, affectedMemberCount) => {
                      setPermissionProfiles((current) =>
                        current.filter((item) => item.id !== profileId),
                      );

                      if (affectedMemberCount > 0) {
                        setTeamMembers((current) =>
                          current.map((member) =>
                            member.permissionProfileId === profileId
                              ? {
                                  ...member,
                                  permissionProfileId: null,
                                  permissionProfileName: null,
                                }
                              : member,
                          ),
                        );
                      }
                    }}
                  />
                </DashboardSection>
              ) : null}

              {activeOperationsTab === "configuracion" ? (
                <div className="space-y-5">
                  <DashboardSection
                    id="configuracion-informes"
                    title="Informes"
                    description="Frecuencia de revision y entrega del informe operativo."
                  >
                    <DashboardReportCadenceSettingsPanel
                      initialCadence={organizationSettings?.reportCadence ?? "monthly"}
                      canManage={canManageTeam}
                      onSaved={(reportCadence) => {
                        setOrganizationSettings((current) =>
                          current ? { ...current, reportCadence } : current,
                        );
                      }}
                    />
                  </DashboardSection>

                  <DashboardSection
                    id="configuracion-operacion"
                    title="Operacion"
                    description="Prioridades y reglas que orientan alertas, informes y seguimiento."
                  >
                    <DashboardOrganizationOperationalSettingsPanel
                      initialSettings={organizationSettings}
                      canManage={canManageTeam}
                      onSaved={(settings) => {
                        setOrganizationSettings(settings);
                      }}
                    />
                  </DashboardSection>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeView === "alertas" ? (
            <DashboardAlertsView
              alerts={liveAlerts}
              metrics={
                dashboardData?.followUpMetrics ?? {
                  openCount: 0,
                  escalatedCount: 0,
                  inReviewCount: 0,
                  resolvedCount: 0,
                  slaBreachedCount: 0,
                  avgResponseHours: null,
                  avgResolutionHours: null,
                }
              }
              branches={liveBranches.filter((branch) => branch.is_active)}
              assignees={teamMembers.filter(
                (member) => member.role === "owner" || member.role === "manager",
              )}
              organizationSettings={organizationSettings}
              canManageEscalation={canManageFollowUp}
              canManageFollowUp={canManageFollowUp}
              onEscalationSettingsSaved={(settings) => {
                setOrganizationSettings((current) =>
                  current
                    ? {
                        ...current,
                        alertEscalationPhone: settings.alertEscalationPhone,
                        alertEscalationEmail: settings.alertEscalationEmail,
                      }
                    : current,
                );
              }}
              onOpenSubmission={(submissionId) => {
                setPendingCommentId(submissionId);
                setActiveView("comentarios");
                window.history.pushState({}, "", "/dashboard#comentarios");
              }}
            />
          ) : null}
        </div>
        <PlatformFooter />
      </section>
      <CreateBranchDrawer
        key={`${selectedBranch?.id ?? "create-branch"}-${isBranchDrawerOpen ? "open" : "closed"}`}
        open={isBranchDrawerOpen}
        branch={selectedBranch}
        onClose={closeBranchDrawer}
        onSaved={handleBranchSaved}
        onViewQr={openBranchQrView}
      />
      {actorRole ? (
        <AddTeamMemberDrawer
          key={isTeamMemberDrawerOpen ? "open" : "closed"}
          open={isTeamMemberDrawerOpen}
          onClose={() => setIsTeamMemberDrawerOpen(false)}
          branches={liveBranches.filter((branch) => branch.is_active)}
          actorRole={actorRole}
          permissionProfiles={permissionProfiles}
          onSaved={(member) => {
            setTeamMembers((current) =>
              current.some((item) => item.userId === member.userId)
                ? current.map((item) => (item.userId === member.userId ? member : item))
                : [member, ...current],
            );
          }}
        />
      ) : null}
      <DashboardBusinessProfileDrawer
        open={isBusinessProfileOpen}
        onClose={() => setIsBusinessProfileOpen(false)}
        initialSettings={organizationSettings}
        canManage={canManageTeam}
        onSaved={(settings) => {
          setOrganizationSettings(settings);
          setLiveOrganizationName(settings.name);
        }}
      />
    </main>
  );
}
