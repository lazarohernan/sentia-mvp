import { NextResponse } from "next/server";

import {
  getOrganizationSettingsById,
  updateOrganizationSettings,
} from "@/domain/organizations/organization-settings";
import { updateOrganizationSettingsInputSchema } from "@/domain/organizations/organization-settings-schemas";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canManageOrganizationSettings(role: string) {
  return role === "owner" || role === "manager";
}

async function getAuthenticatedOrganizationContext() {
  if (!hasSupabasePublicEnv()) {
    return {
      errorResponse: NextResponse.json(
        { error: "Supabase no esta configurado." },
        { status: 503 },
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errorResponse: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!organization || !membership) {
    return {
      errorResponse: NextResponse.json(
        { error: "No se encontro una organizacion para este usuario." },
        { status: 404 },
      ),
    };
  }

  return { supabase, organization, membership };
}

export async function GET() {
  const authResult = await getAuthenticatedOrganizationContext();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const settings = await getOrganizationSettingsById(
    authResult.supabase,
    authResult.organization.id,
  );

  if (!settings) {
    return NextResponse.json(
      { error: "No se pudo cargar la configuracion del negocio." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    settings,
    canManage: canManageOrganizationSettings(authResult.membership.role),
  });
}

export async function PATCH(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:organization:settings:update",
    key: clientIp,
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const authResult = await getAuthenticatedOrganizationContext();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  if (!canManageOrganizationSettings(authResult.membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para editar la configuracion del negocio." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrganizationSettingsInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa la informacion del negocio antes de guardar." },
      { status: 400 },
    );
  }

  try {
    const currentSettings = await getOrganizationSettingsById(
      authResult.supabase,
      authResult.organization.id,
    );

    const settings = await updateOrganizationSettings(authResult.supabase, {
      organizationId: authResult.organization.id,
      input: {
        ...parsed.data,
        logoUrl: parsed.data.logoUrl ?? currentSettings?.logoUrl ?? null,
      },
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la configuracion del negocio." },
      { status: 500 },
    );
  }
}
