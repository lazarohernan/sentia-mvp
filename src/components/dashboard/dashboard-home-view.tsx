"use client";

import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Branch } from "@/domain/branches/schemas";
import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";
import styles from "./dashboard-home.module.css";

type Props = {
  filters?: ReactNode;
  dashboardData?: DashboardSummaryData;
  alerts: DashboardAlertItem[];
  branches: Branch[];
  dateRange: DashboardDateRange;
  selectedBranchId?: string;
  userName?: string;
  onShareQr: () => void;
  onBranches: () => void;
};

const actionClass = styles.action;
const panelClass = styles.panel;

export function DashboardHomeView({ filters, dashboardData, alerts, branches, dateRange, selectedBranchId, userName, onShareQr, onBranches }: Props) {
  const metrics = dashboardData?.metrics ?? [];
  const comments = dashboardData?.recentComments ?? [];
  const health = dashboardData?.branchHealth ?? [];
  const pending = alerts.filter((alert) => alert.workflowStatus !== "resuelto");
  const hasFeedback = (dashboardData?.comments.length ?? 0) > 0 || comments.length > 0 || health.some((branch) => branch.scoredCount > 0)
    || Number(metrics.find((metric) => metric.label === "Comentarios")?.value.replace(/[^0-9]/g, "") || 0) > 0;
  const scopedBranches = selectedBranchId ? branches.filter((branch) => branch.id === selectedBranchId) : branches;
  const period = dashboardData?.dateRange ?? dateRange;
  const firstName = userName?.trim().split(/\s+/)[0];

  function href(hash: string, branchId = selectedBranchId) {
    const query = new URLSearchParams({ period: period.period });
    if (period.period === "custom") {
      query.set("start", period.startDate);
      query.set("end", period.endDate);
    }
    if (branchId) query.set("branchId", branchId);
    return `/dashboard?${query}#${hash}`;
  }

  const stats = [
    { label: "Opiniones recibidas", value: metrics.find((metric) => metric.label === "Comentarios")?.value ?? "—", href: href("comentarios") },
    { label: "Satisfacción · CSAT", value: metrics.find((metric) => metric.label === "CSAT")?.value ?? "Sin datos", href: href("comentarios") },
    { label: "Pendientes de atención", value: dashboardData ? String(dashboardData.followUpMetrics.openCount) : "—", href: href("alertas") },
    { label: "Sucursales en esta vista", value: String(scopedBranches.length), href: "/dashboard#sucursales" },
  ];

  return (
    <div className={`${styles.home} space-y-6 pb-8`}>
      <section aria-label="Bienvenida" className={styles.welcome}>
        <img src="/images/perks-welcome-connections-v2.svg" alt="" width={1200} height={480} className={styles.welcomeArt} />
        <div className={styles.welcomeCopy}>
          <h3>{firstName ? `Hola, ${firstName}.` : "Qué bueno verte por aquí."}</h3>
          <p>
            {pending.length > 0 ? "Revisa los asuntos pendientes y las opiniones de este periodo."
              : hasFeedback ? "Aquí tienes las opiniones y el seguimiento de tus sucursales."
              : "Comparte el QR de tu sucursal para recibir las primeras opiniones."}
          </p>
          {pending.length > 0 ? <Link className={`${actionClass} ${styles.primary} mt-4`} href={href("alertas")}>Revisar pendientes <ArrowRight size={16} aria-hidden="true" /></Link> : null}
        </div>
      </section>

      <section aria-label="Tu negocio en este periodo">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Tu negocio, de un vistazo</h3>
            <p className="mt-1 text-xs text-text-secondary">{period.label} · {dashboardData?.scope ?? "Sucursales disponibles"}</p>
          </div>
          {filters ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-text-secondary">Filtros</span>
              {filters}
            </div>
          ) : null}
        </div>
        <div className={styles.metrics}>
          {stats.map((stat) => <Link key={stat.label} href={stat.href} className="min-w-0 hover:underline active:opacity-75">
            <p className="text-xs text-text-secondary">{stat.label}</p>
            <p className="mt-2 break-words text-2xl font-semibold text-text-primary">{stat.value}</p>
          </Link>)}
        </div>
      </section>

      <div className={styles.row}>
        <section aria-label="Qué necesita tu atención" className={panelClass}>
          <div className={styles.panelHead}><h3>Qué necesita tu atención</h3><Link href={href("alertas")} className={actionClass}>Ver alertas <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {pending.length ? <ul className="mt-3 divide-y divide-border-soft">{pending.slice(0, 3).map((alert) => <li key={alert.id} className="py-4">
            <div className="flex items-start gap-3"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${alert.tone === "danger" ? "bg-red-600" : "bg-amber-500"}`} aria-hidden="true" /><div className="min-w-0"><p className="text-xs font-medium text-text-secondary">{alert.priority}{alert.branchName ? ` · ${alert.branchName}` : ""}</p><p className="mt-1 text-sm font-semibold">{alert.title}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-text-secondary">{alert.detail}</p></div></div>
          </li>)}</ul> : <div className={styles.empty}><img src="/images/illustrations/perks-empty-attention-v1.svg" alt="" width={120} height={96} className={styles.emptyArt} /><div><p>{hasFeedback ? "Sin alertas abiertas en esta vista" : "Aún no hay datos para detectar alertas"}</p><p className="mt-2">{hasFeedback ? "Revisa las opiniones para ver el detalle de este periodo." : "Cuando recibas opiniones, aquí aparecerán los asuntos que necesitan seguimiento."}</p></div></div>}
        </section>

        <section aria-label="Escucha y conecta" className={panelClass}>
          <h3 className="text-lg font-semibold">Escucha y conecta</h3>
          <div className={styles.connect}>
            <img src="/images/perks-empty-feedback-v1.svg" alt="" width={320} height={200} className="h-auto w-24 shrink-0 sm:w-28" />
            <div className="min-w-0"><h4 className="text-sm font-semibold">Opiniones de clientes</h4><p className="mt-1 text-sm leading-6 text-text-secondary">Comparte el QR en tu sucursal para recibir valoraciones.</p><button type="button" onClick={scopedBranches.length ? onShareQr : onBranches} className={actionClass}>{scopedBranches.length ? "Compartir QR" : "Crear sucursal"}<ArrowRight size={15} aria-hidden="true" /></button></div>
          </div>
          <div className={styles.connect}>
            <img src="/images/perks-team-connect-v1.svg" alt="" width={240} height={160} className="h-auto w-24 shrink-0 sm:w-28" />
            <div className="min-w-0"><h4 className="text-sm font-semibold">Escucha a tu equipo</h4><p className="mt-1 text-sm leading-6 text-text-secondary">Revisa lo que comparte tu equipo y su seguimiento.</p><Link href="/dashboard/escucha" className={actionClass}>Ir a Escucha <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
        </section>
      </div>

      <div className={styles.row}>
        <section aria-label="Últimas opiniones" className={panelClass}>
          <div className={styles.panelHead}><h3>Últimas opiniones</h3><Link href={href("comentarios")} className={actionClass}>Ver todas <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {comments.length ? <ul className="mt-2 divide-y divide-border-soft">{comments.slice(0, 3).map((comment) => <li key={comment.id} className="py-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-text-secondary"><span>{comment.branch}</span><span>{comment.date}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-text-primary">{comment.comment}</p><p className="mt-2 text-xs font-medium text-text-secondary">{comment.sentiment} · {comment.status}</p></li>)}</ul>
            : <div className={styles.empty}><img src="/images/illustrations/perks-empty-opinions-v1.svg" alt="" width={120} height={96} className={styles.emptyArt} /><div><p>No hay opiniones en este periodo</p><p className="mt-2">Prueba con otras fechas o comparte el QR de tu sucursal.</p></div></div>}
        </section>

        <section aria-label="Tus sucursales" className={panelClass}>
          <div className={styles.panelHead}><h3>Tus sucursales</h3><button type="button" onClick={onBranches} className={actionClass}>Ver sucursales <ArrowRight size={15} aria-hidden="true" /></button></div>
          {scopedBranches.length ? <ul className="mt-2 divide-y divide-border-soft">{scopedBranches.slice(0, 4).map((branch) => {
            const item = health.find((entry) => entry.branchId === branch.id);
            return (
              <li key={branch.id}>
                <Link href={href("comentarios", branch.id)} className="flex min-h-20 items-center justify-between gap-3 py-3 focus-visible:outline-2 focus-visible:outline-brand">
                  <div className="flex min-w-0 items-center gap-3">
                    <Store size={19} aria-hidden="true" className="shrink-0 text-text-secondary" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{branch.name}</p>
                      <p className="mt-1 text-xs text-text-secondary">{item?.comments ?? "Ver detalle de la sucursal"}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${item?.tone === "danger" ? "text-red-700" : item?.tone === "warning" ? "text-amber-800" : "text-text-secondary"}`}>
                    {item ? item.scoredCount > 0 ? `${item.csat} / 5` : "Sin calificación" : "Ver opiniones"}
                  </span>
                </Link>
              </li>
            );
          })}</ul> : <p className="py-8 text-sm leading-6 text-text-secondary">Aquí verás las sucursales disponibles para tu cuenta y cómo les está yendo.</p>}
          {scopedBranches.length > 4 ? <p className="mt-3 text-xs text-text-secondary">Y {scopedBranches.length - 4} sucursales más.</p> : null}
        </section>
      </div>
    </div>
  );
}
