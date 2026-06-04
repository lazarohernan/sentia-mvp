import { NextResponse } from "next/server";

import { uploadOrganizationLogo } from "@/domain/organizations/organization-settings";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canManageOrganizationSettings(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:organization:settings:logo",
    key: clientIp,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 503 });
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
    return NextResponse.json(
      { error: "No se encontro una organizacion para este usuario." },
      { status: 404 },
    );
  }

  if (!canManageOrganizationSettings(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para editar la configuracion del negocio." },
      { status: 403 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const logo = formData?.get("logo");

  if (!(logo instanceof File) || logo.size === 0) {
    return NextResponse.json({ error: "Selecciona un archivo de logo." }, { status: 400 });
  }

  try {
    const logoUrl = await uploadOrganizationLogo(supabase, {
      organizationId: organization.id,
      file: logo,
    });

    return NextResponse.json({ logoUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("Formato") || message.includes("2 MB")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo subir el logo." }, { status: 500 });
  }
}
