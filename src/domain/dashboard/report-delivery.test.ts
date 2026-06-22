import { describe, expect, it } from "vitest";

import { buildReportPrintHtml } from "./report-delivery";
import type { BranchReport } from "./report-readiness";
import type { DashboardCommentRow } from "./schemas";

const readiness = {
  percent: 80,
  usefulResponses: 8,
  targetUsefulResponses: 10,
  missingUsefulResponses: 0,
  qualityPercent: 75,
  headline: "Listo",
  detail: "Detalle del informe",
};

function buildReport(overrides: Partial<BranchReport> = {}): BranchReport {
  return {
    branchId: "branch-1",
    branch: "Centro",
    total: 4,
    risk: 2,
    positive: 1,
    neutral: 1,
    insufficient: 0,
    partial: 1,
    sufficient: 3,
    usefulResponses: 3.5,
    targetUsefulResponses: 4,
    readinessPercent: 88,
    missingUsefulResponses: 0,
    topPattern: "Tiempo de espera",
    recommendedAction: "Revisar caja",
    ...overrides,
  };
}

function buildComment(overrides: Partial<DashboardCommentRow> = {}): DashboardCommentRow {
  return {
    id: "comment-1",
    customer: "Cliente",
    business: "Feedback",
    branch: "Centro",
    branchId: "branch-1",
    feedbackType: "Observación",
    sentiment: "Riesgo",
    csatScore: 2,
    status: "Nuevo",
    message: "Mucha espera",
    receivedAt: "2026-06-10T12:00:00.000Z",
    createdAtIso: "2026-06-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("report-delivery", () => {
  it("escapa HTML proveniente de comentarios y reportes", () => {
    const html = buildReportPrintHtml({
      organizationName: 'Perks <img src=x onerror="alert(1)">',
      periodLabel: "Últimos 30 días",
      readiness,
      priorityBranch: buildReport(),
      reports: [
        buildReport({
          topPattern: '<script>alert("x")</script>',
          recommendedAction: '<b onclick="evil()">Acción</b>',
        }),
      ],
      comments: [
        buildComment({
          message: '<img src=x onerror="alert(1)"> Comentario',
        }),
      ],
    });

    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; Comentario");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('<b onclick="evil()">Acción</b>');
  });
});
