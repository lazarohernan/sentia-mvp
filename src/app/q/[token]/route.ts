import { NextResponse } from "next/server";

import { recordBranchQrScan } from "@/domain/branches/qr-scans";
import {
  getBranchIdFromQrToken,
  verifyBranchQrTokenSignature,
} from "@/domain/branches/qr-token";
import { getActiveBranchById } from "@/domain/branches/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import { hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

type SignedQrRouteProps = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: SignedQrRouteProps) {
  const { token } = await params;
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "qr:signed:redirect",
    key: clientIp,
    limit: 120,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
  }

  if (!hasSupabaseServiceEnv() || !hasQrSigningSecret()) {
    return NextResponse.json({ error: "QR firmado no esta configurado." }, { status: 503 });
  }

  const branchId = getBranchIdFromQrToken(token);
  if (!branchId) {
    return NextResponse.redirect(new URL("/feedback/invalido", request.url));
  }

  const db = createServiceClient();
  const branch = await getActiveBranchById(db, branchId);

  if (!branch) {
    return NextResponse.redirect(new URL("/feedback/invalido", request.url));
  }

  const isValid = verifyBranchQrTokenSignature(token, {
    branchId: branch.id,
    branchSlug: branch.slug,
    organizationId: branch.organization_id,
  });

  if (!isValid) {
    return NextResponse.redirect(new URL("/feedback/invalido", request.url));
  }

  try {
    await recordBranchQrScan(db, {
      organizationId: branch.organization_id,
      branchId: branch.id,
      source: "signed_qr",
    });
  } catch {
    // Continue to feedback even if analytics insert fails.
  }

  return NextResponse.redirect(new URL(`/feedback/${branch.slug}`, request.url));
}
