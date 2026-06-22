import type { OrganizationSettings } from "@/domain/organizations/organization-settings-schemas";

import type { BranchReport, ReportReadiness } from "./report-readiness";
import type { DashboardCommentRow } from "./schemas";

export type ReportDeliveryChannel = "pdf" | "email";

export type ReportDeliveryRecord = {
  id: string;
  createdAt: string;
  channel: ReportDeliveryChannel;
  label: string;
  recipient?: string | null;
};

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getReportRecipientEmail(params: {
  organizationSettings?: OrganizationSettings;
  currentUserEmail?: string | null;
}) {
  return (
    params.organizationSettings?.contactEmail ??
    params.organizationSettings?.alertEscalationEmail ??
    params.currentUserEmail ??
    null
  );
}

export function buildReportHeadline(params: {
  readiness: ReportReadiness;
  priorityBranch?: BranchReport;
  reportTitle?: string;
}) {
  const reportLabel = params.reportTitle ?? "informe mensual";

  if (params.readiness.missingUsefulResponses > 0) {
    return params.priorityBranch
      ? `${params.priorityBranch.branch} necesita más contexto antes del cierre`
      : `Aún falta contexto para cerrar el ${reportLabel}`;
  }

  return params.priorityBranch
    ? `${params.priorityBranch.branch} marca la referencia principal del periodo`
    : `El ${reportLabel} ya está listo para compartirse`;
}

export function buildReportEmailHref(params: {
  organizationName?: string;
  periodLabel: string;
  readiness: ReportReadiness;
  priorityBranch?: BranchReport;
  recipientEmail: string;
}) {
  const subject = `Informe mensual ${params.organizationName ?? "Perks"} - ${params.periodLabel}`;
  const body = [
    `Resumen del periodo: ${params.periodLabel}`,
    "",
    buildReportHeadline({
      readiness: params.readiness,
      priorityBranch: params.priorityBranch,
    }),
    params.readiness.detail,
    "",
    `Avance actual: ${params.readiness.percent}%`,
    `Respuestas utiles: ${params.readiness.usefulResponses.toFixed(1)} de ${params.readiness.targetUsefulResponses}`,
    `Claridad: ${params.readiness.qualityPercent}%`,
    "",
    params.priorityBranch
      ? `Sucursal prioritaria: ${params.priorityBranch.branch} (${params.priorityBranch.readinessPercent}% listo)`
      : "Sucursal prioritaria: Sin datos suficientes",
  ].join("\n");

  return `mailto:${encodeURIComponent(params.recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildReportPrintHtml(params: {
  organizationName?: string;
  periodLabel: string;
  reportTitle?: string;
  readiness: ReportReadiness;
  priorityBranch?: BranchReport;
  reports: BranchReport[];
  comments: DashboardCommentRow[];
}) {
  const generatedAt = new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const topComments = params.comments.slice(0, 5);

  const reportCards = params.reports
    .map(
      (report) => `
        <tr>
          <td>${escapeHtml(report.branch)}</td>
          <td>${report.total}</td>
          <td>${report.readinessPercent}%</td>
          <td>${escapeHtml(report.topPattern)}</td>
          <td>${escapeHtml(report.recommendedAction)}</td>
        </tr>
      `,
    )
    .join("");

  const commentRows = topComments
    .map(
      (comment) => `
        <tr>
          <td>${escapeHtml(comment.branch)}</td>
          <td>${escapeHtml(comment.sentiment)}</td>
          <td>${escapeHtml(truncate(comment.message, 140))}</td>
        </tr>
      `,
    )
    .join("");

  const headline = buildReportHeadline({
    readiness: params.readiness,
    priorityBranch: params.priorityBranch,
    reportTitle: params.reportTitle?.toLowerCase(),
  });

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(params.reportTitle ?? "Informe mensual")}</title>
      <style>
        body { font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 40px; }
        h1,h2,h3,p { margin: 0; }
        .header { margin-bottom: 28px; }
        .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; }
        .headline { margin-top: 10px; font-size: 28px; font-weight: 700; }
        .sub { margin-top: 12px; font-size: 15px; line-height: 1.7; color: #475569; max-width: 780px; }
        .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
        .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #fff; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; }
        .value { margin-top: 8px; font-size: 24px; font-weight: 700; }
        .detail { margin-top: 8px; font-size: 14px; line-height: 1.7; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border-bottom: 1px solid #e2e8f0; text-align: left; padding: 12px 8px; vertical-align: top; font-size: 14px; }
        th { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
        .section { margin-top: 28px; }
      </style>
    </head>
    <body>
      <div class="header">
        <p class="eyebrow">${escapeHtml(params.organizationName ?? "Perks")} · ${escapeHtml(params.periodLabel)}</p>
        <h1 class="headline">${escapeHtml(headline)}</h1>
        <p class="sub">${escapeHtml(params.readiness.detail)}</p>
        <p class="sub">Generado el ${escapeHtml(generatedAt)}</p>
      </div>

      <div class="grid">
        <div class="card">
          <p class="label">Avance</p>
          <p class="value">${params.readiness.percent}%</p>
          <p class="detail">Preparación actual del informe mensual.</p>
        </div>
        <div class="card">
          <p class="label">Respuestas útiles</p>
          <p class="value">${params.readiness.usefulResponses.toFixed(1)}</p>
          <p class="detail">De ${params.readiness.targetUsefulResponses} necesarias para cerrar el periodo.</p>
        </div>
        <div class="card">
          <p class="label">Claridad</p>
          <p class="value">${params.readiness.qualityPercent}%</p>
          <p class="detail">Porcentaje de respuestas con causa suficientemente clara.</p>
        </div>
      </div>

      <div class="section">
        <h2>Sucursales</h2>
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Valoraciones</th>
              <th>Avance</th>
              <th>Patrón</th>
              <th>Acción sugerida</th>
            </tr>
          </thead>
          <tbody>${reportCards}</tbody>
        </table>
      </div>

      <div class="section">
        <h2>Comentarios recientes</h2>
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Señal</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>${commentRows}</tbody>
        </table>
      </div>
    </body>
  </html>`;
}
