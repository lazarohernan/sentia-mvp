import { NextResponse } from "next/server";

import {
  getAlertEscalationSettings,
  updateAlertEscalation,
} from "@/domain/organizations/organization-settings";
import { updateAlertEscalationInputSchema } from "@/domain/organizations/organization-settings-schemas";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canManageAlertEscalation(role: string) {
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

  const settings = await getAlertEscalationSettings(
    authResult.supabase,
    authResult.organization.id,
  );

  if (!settings) {
    return NextResponse.json(
      { error: "No se pudo cargar el contacto de escalamiento." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    settings,
    canManage: canManageAlertEscalation(authResult.membership.role),
  });
}

export async function PATCH(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:organization:alert-escalation:update",
    key: clientIp,
    limit: 30,
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

  if (!canManageAlertEscalation(authResult.membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para editar el contacto de escalamiento." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateAlertEscalationInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa el telefono y correo antes de guardar." },
      { status: 400 },
    );
  }

  try {
    const settings = await updateAlertEscalation(authResult.supabase, {
      organizationId: authResult.organization.id,
      input: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el contacto de escalamiento." },
      { status: 500 },
    );
  }
}
