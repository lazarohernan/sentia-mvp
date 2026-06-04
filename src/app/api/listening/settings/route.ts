import { NextResponse } from "next/server";

import {
  getListeningSettingsByOrganization,
  updateListeningSettings,
  updateListeningSettingsInputSchema,
} from "@/domain/listening/settings";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canManageListening(role: string) {
  return role === "owner" || role === "manager";
}

async function getAuthorizedContext() {
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
    return { errorResponse: NextResponse.json({ error: "No autorizado." }, { status: 401 }) };
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!membership || !canManageListening(membership.role)) {
    return {
      errorResponse: NextResponse.json(
        { error: "No tienes permisos para configurar escucha." },
        { status: 403 },
      ),
    };
  }

  return { supabase, organizationId: membership.organizationId };
}

export async function GET() {
  const context = await getAuthorizedContext();

  if ("errorResponse" in context) {
    return context.errorResponse;
  }

  const settings = await getListeningSettingsByOrganization(
    context.supabase,
    context.organizationId,
  );

  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:listening-settings:update",
    key: getClientIpFromHeaders(request.headers),
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const context = await getAuthorizedContext();

  if ("errorResponse" in context) {
    return context.errorResponse;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateListeningSettingsInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa los dias y horarios antes de guardar." },
      { status: 400 },
    );
  }

  try {
    const settings = await updateListeningSettings(context.supabase, {
      organizationId: context.organizationId,
      input: parsed.data,
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la configuracion de escucha." },
      { status: 500 },
    );
  }
}
