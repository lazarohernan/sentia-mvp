import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function recordBranchQrScan(
  client: Client,
  params: {
    organizationId: string;
    branchId: string;
    source?: string;
  },
): Promise<void> {
  const { error } = await client.from("branch_qr_scans").insert({
    organization_id: params.organizationId,
    branch_id: params.branchId,
    source: params.source ?? "feedback_page",
  } as never);

  if (error) {
    throw new Error(`Failed to record QR scan: ${error.message}`);
  }
}

export async function getBranchQrScanCounts(
  client: Client,
  organizationId: string,
): Promise<Record<string, number>> {
  const { data, error } = await client
    .from("branch_qr_scans")
    .select("branch_id")
    .eq("organization_id", organizationId);

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ branch_id: string }>) {
    counts[row.branch_id] = (counts[row.branch_id] ?? 0) + 1;
  }

  return counts;
}
