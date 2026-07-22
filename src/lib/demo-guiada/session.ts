import type { DashboardAlertItem } from "@/domain/dashboard/alerts";
import type {
  DashboardBranchHealthItem,
  DashboardCommentRow,
  DashboardSummaryData,
} from "@/domain/dashboard/schemas";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { TeamMember } from "@/domain/organizations/team";

export type DemoFeedbackPayload = {
  csatScore: number;
  freeText: string;
  clarificationCategory?: string;
  clarificationDetail?: string;
  clarificationQuestion?: string | null;
};

export type DemoCase = {
  comment: DashboardCommentRow;
  alert: DashboardAlertItem;
};

export const DEMO_ORG_NAME = "Café Aurora";
export const DEMO_BRANCH_NAME = "Sucursal Centro";
export const DEMO_BRANCH_ID = "demo-branch-centro";
export const DEMO_BRANCH_SLUG = "demo-cafe";

export const DEMO_ASSIGNEES: TeamMember[] = [
  {
    userId: "demo-user-gerente",
    branchId: DEMO_BRANCH_ID,
    branchName: DEMO_BRANCH_NAME,
    fullName: "María López",
    email: "maria@cafeaurora.demo",
    role: "manager",
    roleLabel: "Gerente",
    joinedAt: "2026-01-10T12:00:00.000Z",
    accountStatus: "active",
  },
  {
    userId: "demo-user-supervisor",
    branchId: DEMO_BRANCH_ID,
    branchName: DEMO_BRANCH_NAME,
    fullName: "Carlos Méndez",
    email: "carlos@cafeaurora.demo",
    role: "collaborator",
    roleLabel: "Colaborador",
    joinedAt: "2026-02-01T12:00:00.000Z",
    accountStatus: "active",
  },
];

const categoryLabels: Record<string, string> = {
  customer_service: "Atención al cliente",
  wait_time: "Tiempo de espera",
  product_quality: "Calidad del producto",
  cleanliness: "Limpieza",
  price: "Precio",
  environment: "Ambiente",
  billing: "Cobro / pago",
  other: "Otro",
};

function inferFeedbackType(
  csatScore: number,
): DashboardCommentRow["feedbackType"] {
  if (csatScore <= 2) return "Queja";
  if (csatScore === 3) return "Observación";
  return "Felicitación";
}

function inferSentiment(csatScore: number): DashboardCommentRow["sentiment"] {
  if (csatScore <= 2) return "Riesgo";
  if (csatScore === 3) return "Neutral";
  return "Positivo";
}

function inferTone(
  sentiment: DashboardCommentRow["sentiment"],
): "success" | "warning" | "danger" {
  if (sentiment === "Riesgo") return "danger";
  if (sentiment === "Neutral") return "warning";
  return "success";
}

function buildOperationalReading(payload: DemoFeedbackPayload) {
  const category =
    payload.clarificationCategory && categoryLabels[payload.clarificationCategory]
      ? categoryLabels[payload.clarificationCategory]
      : payload.csatScore <= 2
        ? "Experiencia del cliente"
        : "Atención al cliente";

  if (payload.csatScore <= 2) {
    return {
      analysisSummary: `El cliente reporta una experiencia negativa. El comentario apunta a ${category.toLowerCase()} y requiere seguimiento operativo.`,
      probableCause: `Señal de fricción en ${category.toLowerCase()} durante la visita en ${DEMO_BRANCH_NAME}.`,
      recommendedAction:
        "Asignar responsable de turno, revisar el proceso en las próximas 24 horas y registrar la acción tomada.",
      suggestedOwner: "Gerencia de sucursal",
      suggestedSla: "24 horas",
      dominantPattern: category,
      urgency: "high" as const,
      priority: "Alta",
    };
  }

  if (payload.csatScore === 3) {
    return {
      analysisSummary: `La experiencia fue aceptable, pero hay una oportunidad clara de mejora en ${category.toLowerCase()}.`,
      probableCause: `El estándar de ${category.toLowerCase()} no fue consistente en esta visita.`,
      recommendedAction:
        "Observar el punto señalado en el próximo turno y ajustar el protocolo si se repite.",
      suggestedOwner: "Supervisor de turno",
      suggestedSla: "3 días",
      dominantPattern: category,
      urgency: "medium" as const,
      priority: "Media",
    };
  }

  return {
    analysisSummary: `El cliente destaca una experiencia positiva relacionada con ${category.toLowerCase()}.`,
    probableCause: "Práctica del equipo que conviene reconocer y replicar.",
    recommendedAction:
      "Reconocer al equipo y documentar la práctica como referencia para otros turnos.",
    suggestedOwner: "Servicio al cliente",
    suggestedSla: "7 días",
    dominantPattern: category,
    urgency: "low" as const,
    priority: "Baja",
  };
}

export function buildDemoCaseFromFeedback(payload: DemoFeedbackPayload): DemoCase {
  const id = `demo-submission-${Date.now()}`;
  const sentiment = inferSentiment(payload.csatScore);
  const tone = inferTone(sentiment);
  const reading = buildOperationalReading(payload);
  const followUpAnswer = [
    payload.clarificationCategory
      ? categoryLabels[payload.clarificationCategory] ?? payload.clarificationCategory
      : null,
    payload.clarificationDetail?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");

  const comment: DashboardCommentRow = {
    id,
    customer: "Cliente demo",
    business: DEMO_ORG_NAME,
    branch: DEMO_BRANCH_NAME,
    branchId: DEMO_BRANCH_ID,
    feedbackType: inferFeedbackType(payload.csatScore),
    sentiment,
    csatScore: payload.csatScore,
    status: "Nuevo",
    message: payload.freeText.trim(),
    receivedAt: "Hace un momento",
    createdAtIso: new Date().toISOString(),
    analysisSummary: reading.analysisSummary,
    probableCause: reading.probableCause,
    recommendedAction: reading.recommendedAction,
    suggestedOwner: reading.suggestedOwner,
    suggestedSla: reading.suggestedSla,
    dominantPattern: reading.dominantPattern,
    informationQuality: followUpAnswer ? "sufficient" : "partial",
    followUpQuestion: payload.clarificationQuestion ?? undefined,
    followUpAnswer: followUpAnswer || undefined,
    analysisConfidence: "Demo local",
    analysisModel: "demo-local",
  };

  const alert: DashboardAlertItem = {
    id: `submission-${id}`,
    title: reading.dominantPattern,
    subtitle: `${DEMO_BRANCH_NAME} · hace un momento`,
    detail: payload.freeText.trim(),
    priority: reading.priority,
    owner: reading.suggestedOwner,
    probableCause: reading.probableCause,
    suggestedSla: reading.suggestedSla,
    tone,
    unread: true,
    source: "ia",
    submissionId: id,
    branchId: DEMO_BRANCH_ID,
    branchName: DEMO_BRANCH_NAME,
    workflowStatus: "nuevo",
    assignedUserId: null,
    createdAtIso: comment.createdAtIso,
    urgency: reading.urgency,
    slaBreached: false,
    hoursOpen: 0,
  };

  return { comment, alert };
}

function branchHealth(
  branch: string,
  tone: DashboardBranchHealthItem["tone"],
  csat: string,
  comments: string,
  zones: DashboardBranchHealthItem["zoneCounts"],
): DashboardBranchHealthItem {
  const scored = zones.risk + zones.observation + zones.good;
  return {
    branch,
    status: tone === "danger" ? "Atención" : tone === "warning" ? "Observación" : "Estable",
    csat,
    comments,
    tone,
    zoneCounts: zones,
    zonePercents: {
      risk: Math.round((zones.risk / scored) * 100),
      observation: Math.round((zones.observation / scored) * 100),
      good: Math.round((zones.good / scored) * 100),
    },
    scoredCount: scored,
  };
}

export function buildDemoDashboardData(demoCase: DemoCase | null): DashboardSummaryData {
  const dateRange = getDashboardDateRange({ period: "7d" });
  const comments = demoCase
    ? [
        demoCase.comment,
        {
          id: "demo-context-1",
          customer: "Cliente verificado",
          business: DEMO_ORG_NAME,
          branch: "Mall Norte",
          feedbackType: "Felicitación" as const,
          sentiment: "Positivo" as const,
          csatScore: 5,
          status: "Resuelto" as const,
          message: "La atención fue rápida y resolvieron mi solicitud sin vueltas.",
          receivedAt: "Hace 2 h",
        },
        {
          id: "demo-context-2",
          customer: "Visita frecuente",
          business: DEMO_ORG_NAME,
          branch: "Boulevard",
          feedbackType: "Observación" as const,
          sentiment: "Neutral" as const,
          csatScore: 3,
          status: "En revisión" as const,
          message: "El producto estaba bien, pero el área de caja se sentía lenta.",
          receivedAt: "Hace 5 h",
        },
      ]
    : [];

  const attentionItems = demoCase
    ? [
        {
          priority: demoCase.alert.priority,
          title: demoCase.alert.title,
          description: demoCase.alert.detail,
          owner: demoCase.alert.owner ?? "Gerencia",
          probableCause: demoCase.alert.probableCause,
          suggestedSla: demoCase.alert.suggestedSla,
          age: "un momento",
          status: "Pendiente" as const,
          tone: demoCase.alert.tone,
          submissionId: demoCase.comment.id,
          branchId: DEMO_BRANCH_ID,
          branchName: DEMO_BRANCH_NAME,
          workflowStatus: demoCase.alert.workflowStatus,
          assignedUserId: demoCase.alert.assignedUserId,
          assignedUserName: demoCase.alert.assignedUserName,
          createdAtIso: demoCase.alert.createdAtIso,
          urgency: demoCase.alert.urgency,
          categoryLabel: demoCase.comment.dominantPattern,
        },
      ]
    : [];

  return {
    organizationName: DEMO_ORG_NAME,
    scope: "Toda la organización",
    period: dateRange.label,
    dateRange,
    metrics: [
      { label: "Comentarios", value: String(Math.max(comments.length, 12)), detail: "Últimos 7 días" },
      { label: "CSAT", value: demoCase && demoCase.comment.csatScore <= 2 ? "3.8" : "4.2", detail: "Promedio" },
      { label: "Alertas", value: String(attentionItems.length || 2), detail: "Abiertas" },
      { label: "Sucursales", value: "3", detail: "Activas" },
    ],
    insight: {
      status: "Lectura demo",
      confidence: "Alta",
      headline: demoCase
        ? `Tu caso en ${DEMO_BRANCH_NAME} ya aparece en la operación`
        : "Compara sucursales y enfoca la atención",
      detail: demoCase
        ? demoCase.comment.analysisSummary ?? demoCase.comment.message
        : "La vista multi-sucursal concentra salud, alertas y comentarios por establecimiento.",
      action: demoCase?.comment.recommendedAction ?? "Revisar sucursales con más riesgo",
      dominantPattern: demoCase?.comment.dominantPattern ?? "Atención al cliente",
      dominantPatternDetail: "Patrón dominante del periodo demo",
      actionDetail: "Prioriza el establecimiento con más señales de riesgo.",
      reasonMetrics: [
        { value: "3", label: "Sucursales" },
        { value: String(attentionItems.length || 2), label: "Alertas" },
      ],
    },
    attentionItems,
    branchHealth: [
      branchHealth(DEMO_BRANCH_NAME, demoCase?.alert.tone === "danger" ? "danger" : "warning", "3.6", "8", {
        risk: demoCase?.comment.csatScore && demoCase.comment.csatScore <= 2 ? 3 : 1,
        observation: 2,
        good: 3,
      }),
      branchHealth("Mall Norte", "success", "4.6", "11", { risk: 0, observation: 2, good: 9 }),
      branchHealth("Boulevard", "warning", "4.0", "7", { risk: 1, observation: 3, good: 3 }),
    ],
    recentComments: comments.slice(0, 3).map((comment) => ({
      id: comment.id,
      branch: comment.branch,
      comment: comment.message,
      sentiment: comment.sentiment,
      csat: `${comment.csatScore}/5`,
      status:
        comment.status === "Resuelto"
          ? ("Resuelto" as const)
          : comment.status === "En revisión" || comment.status === "En proceso"
            ? ("En revisión" as const)
            : ("Pendiente" as const),
      date: comment.receivedAt,
      tone:
        comment.sentiment === "Riesgo"
          ? ("danger" as const)
          : comment.sentiment === "Neutral"
            ? ("warning" as const)
            : ("success" as const),
    })),
    comments,
    notifications: demoCase
      ? [
          {
            id: `notif-${demoCase.comment.id}`,
            title: "Nueva alerta operativa",
            detail: demoCase.comment.message,
            time: "Ahora",
            href: "/dashboard#alertas",
            unread: true,
            tone: demoCase.alert.tone,
          },
        ]
      : [],
    followUpMetrics: {
      openCount: attentionItems.length,
      escalatedCount: 0,
      inReviewCount: comments.filter((c) => c.status === "En revisión").length,
      resolvedCount: comments.filter((c) => c.status === "Resuelto").length,
      slaBreachedCount: 0,
      avgResponseHours: 1.2,
      avgResolutionHours: 6.5,
    },
    qrScanCounts: {
      [DEMO_BRANCH_ID]: 24,
    },
  };
}
