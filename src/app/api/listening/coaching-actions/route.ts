import { NextResponse } from "next/server";

import {
  getListeningCoachingAction,
  upsertListeningCoachingAction,
} from "@/domain/listening/coaching-actions";
import { upsertListeningCoachingActionSchema } from "@/domain/listening/schemas";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canManageCoaching(role: string) {
  return role === "owner" || role === "manager";
}

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 503 });
  }

  const subjectUserId = new URL(request.url).searchParams.get("subjectUserId");
  if (!subjectUserId) {
    return NextResponse.json({ error: "Falta el colaborador." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  if (!membership || !canManageCoaching(membership.role)) {
    return NextResponse.json({ error: "No tienes permisos." }, { status: 403 });
  }

  const action = await getListeningCoachingAction(supabase, {
    organizationId: membership.organizationId,
    subjectUserId,
  });

  return NextResponse.json({ action });
}

export async function PUT(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "api:listening-coaching-actions",
    key: getClientIpFromHeaders(request.headers),
    limit: 30,
    windowMs: 10 * 60 * 1000,
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

  const body = await request.json().catch(() => null);
  const parsed = upsertListeningCoachingActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Escribe una acción concreta de 1 a 500 caracteres." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  if (!membership || !canManageCoaching(membership.role)) {
    return NextResponse.json({ error: "No tienes permisos." }, { status: 403 });
  }

  try {
    const action = await upsertListeningCoachingAction(supabase, {
      organizationId: membership.organizationId,
      subjectUserId: parsed.data.subjectUserId,
      authorUserId: user.id,
      actionText: parsed.data.actionText,
    });

    return NextResponse.json({ action });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la acción acordada." },
      { status: 500 },
    );
  }
}
