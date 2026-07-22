import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import type { AiUsageCostEstimate, AiUseCase } from "./pricing";

type Client = SupabaseClient<Database>;

export async function insertAiUsageEvent(
  client: Client,
  params: {
    organizationId: string;
    branchId?: string | null;
    submissionId?: string | null;
    useCase: AiUseCase;
    provider: "openai" | "huggingface" | "internal";
    model: string;
    operation: string;
    estimate: AiUsageCostEstimate;
    rawUsage?: unknown;
  },
) {
  const payload: Database["public"]["Tables"]["ai_usage_events"]["Insert"] = {
    organization_id: params.organizationId,
    branch_id: params.branchId ?? null,
    submission_id: params.submissionId ?? null,
    use_case: params.useCase,
    provider: params.provider,
    model: params.model,
    operation: params.operation,
    input_tokens: params.estimate.usage.inputTokens,
    cached_input_tokens: params.estimate.usage.cachedInputTokens,
    output_tokens: params.estimate.usage.outputTokens,
    reasoning_output_tokens: params.estimate.usage.reasoningOutputTokens,
    total_tokens: params.estimate.usage.totalTokens,
    estimated_cost_usd: params.estimate.estimatedCostUsd,
    pricing_source: params.estimate.pricing?.source ?? null,
    pricing_effective_date: params.estimate.pricing?.effectiveDate ?? null,
    raw_usage: (params.rawUsage ?? {}) as Json,
  };

  const { error } = await client.from("ai_usage_events").insert(payload as never);
  if (error) {
    throw new Error(`No se pudo registrar consumo de IA: ${error.message}`);
  }
}
