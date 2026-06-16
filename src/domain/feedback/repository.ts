import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { AiAnalysis } from "./schemas";

type Client = SupabaseClient<Database>;

type FeedbackInsert = Database["public"]["Tables"]["feedback_submissions"]["Insert"];

export async function insertFeedbackSubmission(
  client: Client,
  payload: Omit<FeedbackInsert, "id" | "created_at">,
): Promise<string> {
  const { data, error } = await client
    .from("feedback_submissions")
    .insert(payload as never)
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to insert feedback");
  return (data as { id: string }).id;
}

export async function insertAiAnalysis(
  client: Client,
  submissionId: string,
  result: {
    status: "completed" | "disabled" | "unavailable";
    model: string;
    analysis?: AiAnalysis;
    confidence?: number;
  },
): Promise<void> {
  const row = {
    submission_id: submissionId,
    status: result.status,
    model_used: result.model,
    sentiment: result.analysis?.sentiment ?? null,
    polarity: result.analysis?.polarity ?? null,
    urgency: result.analysis?.urgency ?? null,
    category: result.analysis?.category ?? null,
    summary: result.analysis?.summary ?? null,
    probable_cause: result.analysis?.probableCause ?? null,
    recommended_action: result.analysis?.recommendedAction ?? null,
    suggested_owner: result.analysis?.suggestedOwner ?? null,
    suggested_sla: result.analysis?.suggestedSla ?? null,
    requires_contact: result.analysis?.requiresContact ?? null,
    information_quality: result.analysis?.informationQuality ?? null,
    follow_up_question: result.analysis?.followUpQuestion ?? null,
    follow_up_answer: result.analysis?.followUpAnswer ?? null,
    keywords: result.analysis?.keywords ?? [],
    entities: result.analysis?.entities ?? [],
    confidence: result.confidence ?? null,
  };

  const { error } = await client.from("ai_analyses").insert(row as never);
  if (error) throw new Error(`Failed to insert AI analysis: ${error.message}`);
}
