import { NextResponse } from "next/server";

import { buildSignedBranchQrLink } from "@/domain/branches/qr-link";
import { getActiveBranchById } from "@/domain/branches/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasQrSigningSecret } from "@/lib/security/qr-signing";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type BranchQrLinkRouteProps = {
  params: Promise<{ branchId: string }>;
};

function getQrLinkOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ??
    new URL(request.url).origin
  );
}

export async function GET(request: Request, { params }: BranchQrLinkRouteProps) {
  const { branchId } = await params;

  if (!hasSupabasePublicEnv() || !hasQrSigningSecret()) {
    return NextResponse.json({ error: "QR firmado no esta configurado." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!organization || !membership) {
    return NextResponse.json({ error: "Organizacion no encontrada." }, { status: 404 });
  }

  const branch = await getActiveBranchById(supabase, branchId);

  if (!branch || branch.organization_id !== organization.id) {
    return NextResponse.json({ error: "Sucursal no encontrada." }, { status: 404 });
  }

  try {
    const origin = getQrLinkOrigin(request);
    const link = buildSignedBranchQrLink(branch, origin);

    return NextResponse.json({
      ...link,
      feedbackPath: link.path,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el QR firmado." }, { status: 500 });
  }
}
