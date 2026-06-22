import type { DashboardDateRange } from "@/domain/dashboard/date-range";
import {
  getReportCadenceMeta,
  type ReportCadence,
  type ReportPeriod,
} from "@/domain/dashboard/report-cadence";
import {
  buildBranchReports,
  buildReportReadiness,
} from "@/domain/dashboard/report-readiness";
import type { DashboardCommentRow } from "@/domain/dashboard/schemas";

import type { NotificationDraft } from "./schemas";
import { buildInformesNotificationHref } from "./navigation";

function periodsForCadence(cadence: ReportCadence): ReportPeriod[] {
  if (cadence === "both") {
    return ["weekly", "monthly"];
  }

  if (cadence === "weekly") {
    return ["weekly"];
  }

  return ["monthly"];
}

export function buildReportReadyNotificationDrafts(params: {
  organizationId: string;
  dateRange: DashboardDateRange;
  reportCadence: ReportCadence;
  comments: DashboardCommentRow[];
}): NotificationDraft[] {
  if (params.comments.length === 0) {
    return [];
  }

  const drafts: NotificationDraft[] = [];

  for (const period of periodsForCadence(params.reportCadence)) {
    const reports = buildBranchReports(
      params.comments,
      params.reportCadence,
      period,
    );
    const readiness = buildReportReadiness(
      params.comments,
      reports,
      params.reportCadence,
      period,
    );
    const meta = getReportCadenceMeta(period);

    if (readiness.missingUsefulResponses > 0) {
      continue;
    }

    drafts.push({
      dedupeKey: `report-ready:${params.organizationId}:${period}:${params.dateRange.period}`,
      organizationId: params.organizationId,
      audienceType: "organization",
      category: "digest",
      tone: "success",
      title: `${meta.previewTitle} listo para compartir`,
      detail: `La base de ${meta.periodLabel.toLowerCase()} ya permite consolidar patrones por sucursal. Toca para abrir el informe.`,
      href: buildInformesNotificationHref(period, { openReport: true }),
      metadata: {
        dedupe_key: `report-ready:${params.organizationId}:${period}:${params.dateRange.period}`,
        period: params.dateRange.period,
        reportPeriod: period,
        readinessPercent: readiness.percent,
      },
    });
  }

  return drafts;
}
