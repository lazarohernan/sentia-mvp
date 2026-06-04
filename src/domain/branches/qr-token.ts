import { createHmac, timingSafeEqual } from "crypto";

import { getQrSigningSecret } from "@/lib/security/qr-signing";

export type BranchQrTokenPayload = {
  branchId: string;
  branchSlug: string;
  organizationId: string;
};

function signBranchMessage(params: BranchQrTokenPayload) {
  return createHmac("sha256", getQrSigningSecret())
    .update(`${params.branchId}:${params.branchSlug}:${params.organizationId}`)
    .digest("base64url")
    .slice(0, 22);
}

function encodeBranchId(branchId: string) {
  return Buffer.from(branchId, "utf8").toString("base64url");
}

function decodeBranchId(encodedBranchId: string) {
  try {
    return Buffer.from(encodedBranchId, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export function createBranchQrToken(params: BranchQrTokenPayload) {
  const signature = signBranchMessage(params);
  return `${encodeBranchId(params.branchId)}.${signature}`;
}

export function verifyBranchQrTokenSignature(
  token: string,
  params: BranchQrTokenPayload,
) {
  const [encodedBranchId, signature] = token.split(".");

  if (!encodedBranchId || !signature) {
    return false;
  }

  const branchId = decodeBranchId(encodedBranchId);
  if (!branchId || branchId !== params.branchId) {
    return false;
  }

  const expectedSignature = signBranchMessage(params);

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

export function getBranchIdFromQrToken(token: string) {
  const [encodedBranchId] = token.split(".");
  if (!encodedBranchId) {
    return null;
  }

  return decodeBranchId(encodedBranchId);
}

export function buildSignedQrPath(token: string) {
  return `/q/${token}`;
}
