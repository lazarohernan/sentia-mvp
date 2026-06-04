import {
  buildSignedQrPath,
  createBranchQrToken,
} from "@/domain/branches/qr-token";
import type { Branch } from "@/domain/branches/schemas";

export function buildSignedBranchQrLink(branch: Branch, origin: string) {
  const token = createBranchQrToken({
    branchId: branch.id,
    branchSlug: branch.slug,
    organizationId: branch.organization_id,
  });
  const path = buildSignedQrPath(token);

  return {
    token,
    path,
    url: `${origin.replace(/\/$/, "")}${path}`,
  };
}
