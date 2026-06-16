import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { AgentOperationalReport } from "./context";

type Client = SupabaseClient<Database>;

export type AgentReportRow = Database["public"]["Tables"]["agent_reports"]["Row"];

export function mapAgentReportRow(row: AgentReportRow): AgentOperationalReport {
  const nextActions = Array.isArray(row.next_actions)
    ? row.next_actions.filter((value): value is string => typeof value === "string")
    : [];

  return {
    headline: row.headline,
    summary: row.summary,
    nextActions,
    deliveryReadiness: row.delivery_readiness,
    generatedAt: row.generated_at,
    context: row.context as AgentOperationalReport["context"],
  };
}

export async function insertAgentOperationalReport(
  client: Client,
  params: {
    organizationId: string;
    actorUserId?: string | null;
    branchId?: string | null;
    report: AgentOperationalReport;
  },
) {
  const payload: Database["public"]["Tables"]["agent_reports"]["Insert"] = {
    organization_id: params.organizationId,
    branch_id: params.branchId ?? null,
    actor_user_id: params.actorUserId ?? null,
    report_type: "operational_report",
    period: params.report.context.period,
    headline: params.report.headline,
    summary: params.report.summary,
    next_actions: params.report.nextActions,
    delivery_readiness: params.report.deliveryReadiness,
    context: params.report.context as unknown as Database["public"]["Tables"]["agent_reports"]["Insert"]["context"],
    generated_at: params.report.generatedAt,
  };

  const { error } = await client.from("agent_reports").insert(payload as never);
  if (error) {
    throw new Error(`No se pudo guardar el reporte del agente: ${error.message}`);
  }
}

export async function getLatestAgentOperationalReport(
  client: Client,
  params: {
    organizationId: string;
    branchId?: string | null;
    period?: "7d" | "30d";
  },
): Promise<AgentOperationalReport | null> {
  let query = client
    .from("agent_reports")
    .select("*")
    .eq("organization_id", params.organizationId)
    .eq("report_type", "operational_report")
    .order("created_at", { ascending: false })
    .limit(1);

  if (params.branchId) {
    query = query.or(`branch_id.is.null,branch_id.eq.${params.branchId}`);
  }

  if (params.period) {
    query = query.eq("period", params.period);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    return null;
  }

  return mapAgentReportRow(data as AgentReportRow);
}
