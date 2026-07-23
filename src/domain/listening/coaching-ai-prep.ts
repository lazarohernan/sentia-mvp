import {
  estimateOpenAICost,
  normalizeOpenAIUsage,
} from "@/domain/ai-usage/pricing";
import { insertAiUsageEvent } from "@/domain/ai-usage/repository";
import {
  listeningCoachingManagerPrompts,
  listeningLevelLabels,
  type ListeningEventRow,
} from "@/domain/listening/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const openAiResponsesUrl = "https://api.openai.com/v1/responses";
const defaultModel = "gpt-5.4-mini";
const requestTimeoutMs = 20_000;

export type CoachingAiPrep = {
  insight: string;
  questions: string[];
  generatedByLlm: boolean;
};

type ServiceClient = SupabaseClient<Database>;

function extractOutputText(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = record.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
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

function buildFallbackPrep(events: ListeningEventRow[]): CoachingAiPrep {
  const latest = [...events].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0];

  const level = latest?.level ?? "debate";
  const levelLabel = listeningLevelLabels[level];

  return {
    insight: latest
      ? `Último registro en ${levelLabel}. Usa las preguntas para una conversación breve y concreta.`
      : "Todavía hay pocos datos; abre con una pregunta abierta sobre el turno.",
    questions: listeningCoachingManagerPrompts[level],
    generatedByLlm: false,
  };
}

function parsePrep(raw: string, fallback: CoachingAiPrep): CoachingAiPrep {
  try {
    const parsed = JSON.parse(raw) as {
      insight?: unknown;
      questions?: unknown;
    };
    const insight =
      typeof parsed.insight === "string" ? parsed.insight.trim() : "";
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!insight || questions.length === 0) {
      return fallback;
    }

    return {
      insight: insight.slice(0, 280),
      questions,
      generatedByLlm: true,
    };
  } catch {
    return fallback;
  }
}

export async function generateListeningCoachingPrep(params: {
  events: ListeningEventRow[];
  userName: string;
  reasons: string[];
  organizationId?: string;
  serviceClient?: ServiceClient;
}): Promise<CoachingAiPrep> {
  const fallback = buildFallbackPrep(params.events);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return fallback;
  }

  const recent = [...params.events]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 6)
    .map((event) => ({
      level: listeningLevelLabels[event.level],
      note: event.note?.slice(0, 180) ?? null,
      createdAt: event.createdAt,
    }));

  const model =
    process.env.OPENAI_ALERTS_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    defaultModel;

  try {
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
              "Eres un coach operativo para gerentes de servicio. Das prep breve y privada para una conversación 1:1 de escucha. No diagnostiques salud mental ni sancione. Responde solo JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              collaborator: params.userName,
              priorityReasons: params.reasons,
              recentListening: recent,
              instructions: {
                insightMaxChars: 180,
                questionsCount: 2,
                language: "es",
                tone: "directo, respetuoso, accionable",
              },
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "listening_coaching_prep",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["insight", "questions"],
              properties: {
                insight: { type: "string" },
                questions: {
                  type: "array",
                  minItems: 2,
                  maxItems: 3,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok) {
      return fallback;
    }

    const body: unknown = await response.json();
    const text = extractOutputText(body);
    if (!text) {
      return fallback;
    }

    const prep = parsePrep(text, fallback);

    if (params.organizationId && params.serviceClient) {
      const usage =
        typeof body === "object" && body !== null && "usage" in body
          ? (body as { usage?: unknown }).usage
          : null;
      const tokenUsage = normalizeOpenAIUsage(usage);
      if (tokenUsage) {
        const estimate = estimateOpenAICost({ model, usage: tokenUsage });
        try {
          await insertAiUsageEvent(params.serviceClient, {
            organizationId: params.organizationId,
            useCase: "listening_coaching_prep",
            provider: "openai",
            model,
            operation: "responses.create",
            estimate,
            rawUsage: usage,
          });
        } catch {
          // No bloquear prep si falla el tracking.
        }
      }
    }

    return prep;
  } catch {
    return fallback;
  }
}
