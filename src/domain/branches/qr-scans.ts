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
  branchIds?: string[],
): Promise<Record<string, number>> {
  let query = client
    .from("branch_qr_scans")
    .select("branch_id")
    .eq("organization_id", organizationId);

  if (branchIds && branchIds.length > 0) {
    query = query.in("branch_id", branchIds);
  }

  const { data, error } = await query;

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data as Array<{ branch_id: string }>) {
    counts[row.branch_id] = (counts[row.branch_id] ?? 0) + 1;
  }

  return counts;
}
