import { z } from "zod";

import { getCategoryLabel, humanizeCategoryLabel } from "@/domain/feedback/sentiment-analysis";

import {
  buildBranchDigest,
  formatBranchDigestForPrompt,
  formatWeeklyRollupsForPrompt,
  type WeeklyDigestRollup,
} from "./improvements-digest";
import {
  groupCommentsByBranchId,
  resolveImprovementPromptStrategy,
  type BranchCommentGroup,
  type ImprovementPromptStrategy,
} from "./improvements-batch";
import { buildBranchReports } from "./report-readiness";
import type { DashboardCommentRow } from "./schemas";

const CATEGORY_CODE_PATTERN =
  /\b(customer_service|wait_time|product_quality|cleanliness|price|environment|billing|other)\b/gi;

export function humanizePatternLabel(pattern: string): string {
  return humanizeCategoryLabel(pattern);
}

export function humanizeNarrativeText(text: string): string {
  return text.replace(CATEGORY_CODE_PATTERN, (match) =>
    getCategoryLabel(match.toLowerCase()).toLowerCase(),
  );
}

const openAiResponsesUrl = "https://api.openai.com/v1/responses";
const defaultModel = "gpt-4.1-mini";
const requestTimeoutMs = 25_000;

export type ImprovementPeriod = "7d" | "30d";

export type ImprovementNarrative = {
  branchId: string;
  branch: string;
  title: string;
  narrative: string;
  urgency: "urgente" | "esta semana" | "próximo ciclo";
  generatedByLlm: boolean;
};

export type GenerateImprovementNarrativesOptions = {
  period?: ImprovementPeriod;
  weeklyRollups?: WeeklyDigestRollup[];
};

const narrativeResponseSchema = z.object({
  title: z.string(),
  narrative: z.string(),
  urgency: z.enum(["urgente", "esta semana", "próximo ciclo"]),
});

function buildSharedRules(): string[] {
  return [
    "Reglas estrictas:",
    "1. El título resume el foco principal en lenguaje humano (máx 8 palabras). Sin corchetes, sin códigos técnicos.",
    "2. El párrafo debe fluir de forma natural, como si se lo contaras a alguien en persona.",
    "3. Integra varias áreas cuando aplique: riesgos a atender Y fortalezas o buenas intenciones a replicar.",
    "4. Si hay señales positivas, menciónalas explícitamente como prácticas que conviene sostener.",
    "5. Dentro del párrafo, encierra entre dobles corchetes [[así]] los datos clave:",
    "   - sucursal, franja horaria, área o motivo, cantidad de casos, acción concreta, responsable",
    "6. Máximo 3 chips por oración. El párrafo completo máximo 4 oraciones.",
    "7. Escribe en español neutro, sin tecnicismos, sin bullets, sin markdown.",
    "8. Nunca uses códigos técnicos como wait_time o customer_service.",
  ];
}

function buildWeeklyPrompt(
  branch: string,
  digestText: string,
  report: ReturnType<typeof buildBranchReports>[number],
  dominantOwner: string,
): string {
  return [
    "Eres un analista operativo de experiencia de cliente para restaurantes y cafeterías en Latinoamérica.",
    "Tu tarea: escribir un título semántico breve y UN párrafo narrativo para el dueño o encargado del local.",
    "Este análisis corresponde a UN solo lote semanal. No mezcles semanas anteriores.",
    "",
    ...buildSharedRules(),
    "",
    `Sucursal: ${branch}`,
    `Patrón dominante del lote: ${humanizePatternLabel(report.topPattern)}`,
    `Responsable sugerido más frecuente: ${dominantOwner}`,
    "",
    "Resumen comprimido por áreas (usa esto como base principal, no inventes datos):",
    digestText,
  ].join("\n");
}

function buildMonthlyPrompt(
  branch: string,
  digestText: string,
  weeklyRollups: WeeklyDigestRollup[],
  report: ReturnType<typeof buildBranchReports>[number],
): string {
  return [
    "Eres un analista operativo de experiencia de cliente para restaurantes y cafeterías en Latinoamérica.",
    "Tu tarea: escribir un título semántico breve y UN párrafo narrativo mensual.",
    "NO reanalices comentarios crudos: sintetiza los lotes semanales ya procesados.",
    "Integra tendencias del mes, áreas recurrentes de mejora y fortalezas sostenidas.",
    "",
    ...buildSharedRules(),
    "",
    `Sucursal: ${branch}`,
    `Totales del mes en curso: ${report.total} comentarios (${report.risk} riesgo, ${report.positive} positivo)`,
    "",
    "Lotes semanales ya analizados:",
    formatWeeklyRollupsForPrompt(weeklyRollups),
    "",
    "Resumen mensual comprimido por áreas:",
    digestText,
  ].join("\n");
}

function buildMonthlyCompressedPrompt(
  branch: string,
  digestText: string,
  report: ReturnType<typeof buildBranchReports>[number],
  dominantOwner: string,
): string {
  return [
    "Eres un analista operativo de experiencia de cliente para restaurantes y cafeterías en Latinoamérica.",
    "Tu tarea: escribir un título semántico breve y UN párrafo narrativo mensual.",
    "Este análisis cubre el periodo mensual completo. Integra tendencias del mes, áreas recurrentes de mejora y fortalezas sostenidas.",
    "No hay lotes semanales previos guardados: usa el resumen comprimido del mes como base principal.",
    "",
    ...buildSharedRules(),
    "",
    `Sucursal: ${branch}`,
    `Totales del mes: ${report.total} comentarios (${report.risk} riesgo, ${report.positive} positivo)`,
    `Patrón dominante del mes: ${humanizePatternLabel(report.topPattern)}`,
    `Responsable sugerido más frecuente: ${dominantOwner}`,
    "",
    "Resumen mensual comprimido por áreas:",
    digestText,
  ].join("\n");
}

function buildPromptForStrategy(
  strategy: ImprovementPromptStrategy,
  group: BranchCommentGroup,
  digestText: string,
  report: ReturnType<typeof buildBranchReports>[number],
  branchWeeklyRollups: WeeklyDigestRollup[],
): string {
  const dominantOwner = resolveDominantOwner(group.comments);

  if (strategy === "monthly_from_weekly_batches") {
    return buildMonthlyPrompt(group.branchName, digestText, branchWeeklyRollups, report);
  }

  if (strategy === "monthly_compressed") {
    return buildMonthlyCompressedPrompt(
      group.branchName,
      digestText,
      report,
      dominantOwner,
    );
  }

  return buildWeeklyPrompt(group.branchName, digestText, report, dominantOwner);
}

export { resolveImprovementPromptStrategy } from "./improvements-batch";

function resolveDominantOwner(comments: DashboardCommentRow[]): string {
  const topOwner = comments
    .filter((comment) => comment.suggestedOwner)
    .map((comment) => comment.suggestedOwner as string)
    .reduce<Record<string, number>>((acc, owner) => {
      acc[owner] = (acc[owner] ?? 0) + 1;
      return acc;
    }, {});

  return Object.entries(topOwner).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "encargado del turno";
}

function buildResponseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "narrative", "urgency"],
    properties: {
      title: {
        type: "string",
        description:
          "Título semántico breve. Máximo 8 palabras, español natural, sin corchetes.",
      },
      narrative: {
        type: "string",
        description:
          "Párrafo natural en español con datos clave entre [[corchetes]]. Máximo 4 oraciones. Incluye mejoras y fortalezas.",
      },
      urgency: {
        type: "string",
        enum: ["urgente", "esta semana", "próximo ciclo"],
      },
    },
  };
}

function extractOutputText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }
  const output = "output" in payload ? payload.output : null;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (typeof item !== "object" || item === null || !("content" in item)) continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
    }
  }
  return null;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string | null> {
  const model = process.env.OPENAI_ALERTS_MODEL?.trim() || defaultModel;

  const response = await fetch(openAiResponsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Eres un analista operativo de experiencia de cliente. Sintetizas feedback en narrativas claras, equilibrando riesgos y fortalezas.",
        },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "improvement_narrative",
          strict: true,
          schema: buildResponseSchema(),
        },
      },
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) return null;
  const body: unknown = await response.json();
  return extractOutputText(body);
}

function buildFallbackNarrative(
  group: BranchCommentGroup,
  report: ReturnType<typeof buildBranchReports>[number],
): ImprovementNarrative {
  const digest = buildBranchDigest(group.comments);
  const owner = resolveDominantOwner(group.comments);
  const urgency: ImprovementNarrative["urgency"] =
    report.risk > 2 ? "urgente" : report.risk > 0 ? "esta semana" : "próximo ciclo";

  const riskArea = digest.topRiskAreas[0]?.toLowerCase() ?? "experiencia general";
  const strengthArea = digest.topStrengthAreas[0]?.toLowerCase() ?? riskArea;

  const title =
    report.risk > 0
      ? `Atender ${riskArea}`
      : `Reforzar ${strengthArea}`;

  const narrative =
    report.risk > 0
      ? `En [[${group.branchName}]] detectamos [[${report.risk} comentarios de riesgo]] en áreas como [[${riskArea}]]${digest.topStrengthAreas.length > 0 ? `, aunque [[${strengthArea}]] también destaca como fortaleza` : ""}. Recomendamos revisar el proceso con [[${owner}]] esta semana.`
      : `[[${group.branchName}]] muestra una base positiva — [[${strengthArea}]] es una de las áreas que mejor resuenan. El siguiente paso es [[documentar qué funciona bien]] y replicarlo en el equipo.`;

  return {
    branchId: group.branchId,
    branch: group.branchName,
    title,
    narrative,
    urgency,
    generatedByLlm: false,
  };
}

export async function generateImprovementNarratives(
  comments: DashboardCommentRow[],
  apiKey: string | undefined,
  options: GenerateImprovementNarrativesOptions = {},
): Promise<ImprovementNarrative[]> {
  const period = options.period ?? "7d";
  const branchGroups = groupCommentsByBranchId(comments);
  const allReports = buildBranchReports(comments);
  const weeklyRollupsByBranchId = new Map<string, WeeklyDigestRollup[]>();

  for (const rollup of options.weeklyRollups ?? []) {
    const current = weeklyRollupsByBranchId.get(rollup.branchId) ?? [];
    current.push(rollup);
    weeklyRollupsByBranchId.set(rollup.branchId, current);
  }

  const results: ImprovementNarrative[] = [];

  for (const group of branchGroups) {
    const report = allReports.find((item) => item.branchId === group.branchId);
    if (!report) continue;

    const branchWeeklyRollups = weeklyRollupsByBranchId.get(group.branchId) ?? [];
    const strategy = resolveImprovementPromptStrategy(period, branchWeeklyRollups);

    if (!apiKey) {
      results.push(buildFallbackNarrative(group, report));
      continue;
    }

    const digest = buildBranchDigest(group.comments);
    const digestText = formatBranchDigestForPrompt(digest);
    const prompt = buildPromptForStrategy(
      strategy,
      group,
      digestText,
      report,
      branchWeeklyRollups,
    );

    try {
      const outputText = await callOpenAI(prompt, apiKey);
      if (!outputText) {
        results.push(buildFallbackNarrative(group, report));
        continue;
      }

      const parsed = narrativeResponseSchema.safeParse(JSON.parse(outputText));
      if (!parsed.success) {
        results.push(buildFallbackNarrative(group, report));
        continue;
      }

      results.push({
        branchId: group.branchId,
        branch: group.branchName,
        title: humanizeNarrativeText(parsed.data.title),
        narrative: humanizeNarrativeText(parsed.data.narrative),
        urgency: parsed.data.urgency,
        generatedByLlm: true,
      });
    } catch {
      results.push(buildFallbackNarrative(group, report));
    }
  }

  return results;
}

export { buildBranchDigest, buildCommentFingerprint } from "./improvements-digest";
