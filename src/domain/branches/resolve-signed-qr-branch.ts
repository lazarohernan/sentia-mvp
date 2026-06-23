import {
  getBranchIdFromQrToken,
  verifyBranchQrTokenSignature,
} from "@/domain/branches/qr-token";
import { getActiveBranchById } from "@/domain/branches/repository";
import type { Branch } from "@/domain/branches/schemas";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function resolveSignedQrBranch(
  client: ServiceClient,
  token: string,
): Promise<Branch | null> {
  if (!hasQrSigningSecret()) {
    return null;
  }

  const branchId = getBranchIdFromQrToken(token);
  if (!branchId) {
    return null;
  }

  const branch = await getActiveBranchById(client, branchId);
  if (!branch) {
    return null;
  }

  const isValid = verifyBranchQrTokenSignature(token, {
    branchId: branch.id,
    branchSlug: branch.slug,
    organizationId: branch.organization_id,
  });

  return isValid ? branch : null;
}
