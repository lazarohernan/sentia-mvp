import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { BranchDigest, WeeklyDigestRollup } from "./improvements-digest";
import { buildBranchDigest, buildCommentFingerprint } from "./improvements-digest";
import { dedupeOverlappingWeeklyRollups } from "./improvements-batch";
import { toHondurasTimestampIso } from "./honduras-time";
import type { ImprovementNarrative } from "./improvements-narrative";
import type { DashboardCommentRow } from "./schemas";

type Client = SupabaseClient<Database>;
type ImprovementNarrativeRow = Database["public"]["Tables"]["improvement_narratives"]["Row"];
type ImprovementWeeklyDigestRow =
  Database["public"]["Tables"]["improvement_weekly_digests"]["Row"];
type ImprovementPeriod = "7d" | "30d";

export function mapWeeklyDigestRow(row: ImprovementWeeklyDigestRow): WeeklyDigestRollup {
  return {
    branchId: row.branch_id,
    branch: row.branch_name,
    windowLabel: row.window_label,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    generatedAt: row.generated_at,
    commentFingerprint: row.comment_fingerprint,
    title: row.title,
    narrative: row.narrative,
    urgency: row.urgency,
    digest: row.digest as BranchDigest,
  };
}

export function mapImprovementNarrativeRow(row: ImprovementNarrativeRow): ImprovementNarrative {
  return {
    branchId: row.branch_id,
    branch: row.branch_name,
    title: row.title,
    narrative: row.narrative,
    urgency: row.urgency,
    generatedByLlm: row.generated_by_llm,
  };
}

export async function getImprovementNarratives(
  client: Client,
  params: {
    organizationId: string;
    period: ImprovementPeriod;
    branchIds?: string[];
  },
): Promise<ImprovementNarrative[]> {
  let query = client
    .from("improvement_narratives")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("period", params.period)
    .order("branch_name", { ascending: true });

  if (params.branchIds && params.branchIds.length > 0) {
    query = query.in("branch_id", params.branchIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudieron cargar las mejoras guardadas: ${error.message}`);
  }

  return (data ?? []).map((row) => mapImprovementNarrativeRow(row as ImprovementNarrativeRow));
}

export async function upsertImprovementNarratives(
  client: Client,
  params: {
    organizationId: string;
    actorUserId?: string | null;
    period: ImprovementPeriod;
    items: Array<
      ImprovementNarrative
    >;
  },
) {
  if (params.items.length === 0) {
    return;
  }

  const now = toHondurasTimestampIso();
  const payload: Database["public"]["Tables"]["improvement_narratives"]["Insert"][] =
    params.items.map((item) => ({
      organization_id: params.organizationId,
      branch_id: item.branchId,
      branch_name: item.branch,
      period: params.period,
      title: item.title,
      narrative: item.narrative,
      urgency: item.urgency,
      generated_by_llm: item.generatedByLlm,
      actor_user_id: params.actorUserId ?? null,
      generated_at: now,
      updated_at: now,
    }));

  const { error } = await client
    .from("improvement_narratives")
    .upsert(payload as never, { onConflict: "organization_id,branch_id,period" });

  if (error) {
    throw new Error(`No se pudieron guardar las mejoras: ${error.message}`);
  }
}

export async function getWeeklyDigestsForRollup(
  client: Client,
  params: {
    organizationId: string;
    startDate: string;
    endDate: string;
    branchIds?: string[];
  },
): Promise<WeeklyDigestRollup[]> {
  let query = client
    .from("improvement_weekly_digests")
    .select("*")
    .eq("organization_id", params.organizationId)
    .gte("period_end", params.startDate)
    .lte("period_start", params.endDate)
    .order("period_start", { ascending: true });

  if (params.branchIds && params.branchIds.length > 0) {
    query = query.in("branch_id", params.branchIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudieron cargar los lotes semanales: ${error.message}`);
  }

  return dedupeOverlappingWeeklyRollups(
    (data ?? []).map((row) => mapWeeklyDigestRow(row as ImprovementWeeklyDigestRow)),
  );
}

export async function upsertWeeklyDigests(
  client: Client,
  params: {
    organizationId: string;
    windowKey: string;
    windowLabel: string;
    periodStart: string;
    periodEnd: string;
    items: Array<{
      branchId: string;
      branchName: string;
      narrative: ImprovementNarrative;
      comments: DashboardCommentRow[];
    }>;
  },
) {
  if (params.items.length === 0) {
    return;
  }

  const now = toHondurasTimestampIso();
  const payload: Database["public"]["Tables"]["improvement_weekly_digests"]["Insert"][] =
    params.items.map((item) => {
      const digest = buildBranchDigest(item.comments);
      return {
        organization_id: params.organizationId,
        branch_id: item.branchId,
        branch_name: item.branchName,
        window_key: params.windowKey,
        window_label: params.windowLabel,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        digest: digest as unknown as Database["public"]["Tables"]["improvement_weekly_digests"]["Insert"]["digest"],
        title: item.narrative.title,
        narrative: item.narrative.narrative,
        urgency: item.narrative.urgency,
        comment_count: item.comments.length,
        comment_fingerprint: buildCommentFingerprint(item.comments),
        generated_at: now,
        updated_at: now,
      };
    });

  const { error } = await client
    .from("improvement_weekly_digests")
    .upsert(payload as never, { onConflict: "organization_id,branch_id,window_key" });

  if (error) {
    throw new Error(`No se pudieron guardar los lotes semanales: ${error.message}`);
  }
}
