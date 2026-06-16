import OpenAI from "openai";
import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";

import type { AgentContextSnapshot, AgentOperationalReport } from "./context";

export type OperationalAgentConfig = {
  openAiApiKey: string;
  openAiModel: string;
};

function buildPrompt(context: AgentContextSnapshot) {
  const knowledgeLines = [
    `- Horarios pico: ${context.knowledge.peakHours ?? "No configurado"}`,
    `- Prioridades de servicio: ${context.knowledge.servicePriorities ?? "No configurado"}`,
    `- Politica de compensacion: ${context.knowledge.compensationPolicy ?? "No configurado"}`,
    `- Tono de follow-up: ${context.knowledge.followUpTone ?? "No configurado"}`,
    `- Notas operativas: ${context.knowledge.agentNotes ?? "No configurado"}`,
  ].join("\n");

  return `
Genera una lectura operativa ejecutiva para Perks en espanol natural, pensada para gerencia en Honduras.

Contexto:
- Periodo: ${context.period}
- Comentarios analizados: ${context.commentsCount}
- Preparacion del informe: ${context.readinessPercent}%
- Claridad: ${context.qualityPercent}%
- Faltan respuestas utiles: ${context.missingUsefulResponses}
- Sucursal prioritaria: ${context.priorityBranch?.branch ?? "Sin prioridad"}
- Patrón principal de la sucursal prioritaria: ${context.priorityBranch?.topPattern ?? "Sin patron"}

Base operativa del negocio:
${knowledgeLines}

Sucursales:
${context.branchReports
  .map(
    (item) =>
      `- ${item.branch}: ${item.total} valoraciones, ${item.risk} en riesgo, ${item.readinessPercent}% listo, patron ${item.topPattern}.`,
  )
  .join("\n")}

Comentarios recientes:
${context.recentComments
  .map(
    (item) =>
      `- ${item.branch} | ${item.sentiment} | ${item.message} | patron ${item.dominantPattern}`,
  )
  .join("\n")}

Responde solo JSON valido con este formato:
{
  "headline": "string",
  "summary": "string",
  "nextActions": ["string", "string", "string"],
  "deliveryReadiness": "string"
}
`.trim();
}

function safeParseReport(
  value: string,
  context: AgentContextSnapshot,
): AgentOperationalReport {
  const hasKnowledgeContext = Object.values(context.knowledge).some(Boolean);

  try {
    const parsed = JSON.parse(value) as {
      headline?: string;
      summary?: string;
      nextActions?: string[];
      deliveryReadiness?: string;
    };

    return {
      headline:
        parsed.headline ??
        `${context.priorityBranch?.branch ?? "La operación"} requiere atención operativa`,
      summary:
        parsed.summary ??
        "El agente no pudo estructurar un resumen completo, pero la base ya fue cargada.",
      nextActions:
        parsed.nextActions?.filter(Boolean).slice(0, 3) ?? [
          "Revisar comentarios ambiguos del periodo.",
          "Confirmar responsable por sucursal.",
          "Preparar el siguiente informe con mayor contexto.",
        ],
      deliveryReadiness:
        parsed.deliveryReadiness ??
        (context.missingUsefulResponses > 0
          ? hasKnowledgeContext
            ? "Aún falta base de respuestas, pero el agente ya usa el contexto operativo configurado."
            : "Aún no hay base suficiente para entregar un informe final."
          : hasKnowledgeContext
            ? "La base permite compartir un informe consolidado con contexto operativo del negocio."
            : "La base permite compartir un informe consolidado."),
      generatedAt: new Date().toISOString(),
      context,
    };
  } catch {
    return {
      headline: `${context.priorityBranch?.branch ?? "La operación"} necesita revisión`,
      summary:
        "El agente devolvió una salida no estructurada. Se conserva el contexto operativo como base.",
      nextActions: [
        "Revisar la sucursal prioritaria.",
        "Pedir más contexto en respuestas ambiguas.",
        "Preparar informe ejecutivo del periodo.",
      ],
      deliveryReadiness:
        context.missingUsefulResponses > 0
          ? hasKnowledgeContext
            ? "Aún falta base de respuestas, pero el agente ya usa el contexto operativo configurado."
            : "Aún no hay base suficiente para entregar un informe final."
          : hasKnowledgeContext
            ? "La base permite compartir un informe consolidado con contexto operativo del negocio."
            : "La base permite compartir un informe consolidado.",
      generatedAt: new Date().toISOString(),
      context,
    };
  }
}

export async function generateOperationalAgentReport(params: {
  config: OperationalAgentConfig;
  context: AgentContextSnapshot;
}): Promise<AgentOperationalReport> {
  const client = new OpenAI({
    apiKey: params.config.openAiApiKey,
  });

  setDefaultOpenAIClient(client);

  const agent = new Agent({
    name: "Perks Operational Agent",
    instructions:
      "Eres un analista operativo para experiencias de clientes. Respondes en espanol claro, directo y accionable.",
    model: params.config.openAiModel,
  });

  const result = await run(agent, buildPrompt(params.context));
  return safeParseReport(String(result.finalOutput ?? ""), params.context);
}
