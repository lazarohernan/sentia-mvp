import { z } from "zod";

import { getActiveBranchBySlug } from "@/domain/branches/repository";
import { recordBranchQrScan } from "@/domain/branches/qr-scans";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

const scanSchema = z.object({
  branchSlug: z.string().min(2).max(120),
});

export async function POST(request: Request) {
  if (!hasSupabaseServiceEnv()) {
    return Response.json({ status: "error", message: "Service not configured." }, { status: 503 });
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:feedback:scan",
    key: clientIp,
    limit: 60,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return Response.json({ status: "error", message: "Too many requests." }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ status: "error", message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = scanSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ status: "error", message: "Invalid scan payload." }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    const branch = await getActiveBranchBySlug(db, parsed.data.branchSlug);
    if (!branch) {
      return Response.json({ status: "error", message: "Branch not found." }, { status: 404 });
    }

    await recordBranchQrScan(db, {
      organizationId: branch.organization_id,
      branchId: branch.id,
    });

    return Response.json({ status: "recorded" }, { status: 201 });
  } catch {
    return Response.json({ status: "error", message: "Could not record scan." }, { status: 500 });
  }
}
