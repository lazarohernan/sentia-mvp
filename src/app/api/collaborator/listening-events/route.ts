import { NextResponse } from "next/server";

import { createListeningEventInputSchema } from "@/domain/listening/schemas";
import { createListeningEvent, getListeningEventsByUser } from "@/domain/listening/repository";
import {
  getActiveListeningSurveyNotificationForUser,
  markNotificationAsRead,
} from "@/domain/notifications/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const HISTORY_PAGE_SIZE = 8;

async function getCollaboratorContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [organization, membership] = await Promise.all([
    getOrganizationByUser(supabase, user.id),
    getOrganizationMembershipByUser(supabase, user.id),
  ]);

  if (!organization || !membership || membership.role !== "collaborator") {
    return null;
  }

  return { supabase, organization, user };
}

export async function GET(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase no esta configurado." }, { status: 503 });
  }

  const context = await getCollaboratorContext();

  if (!context) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(
    searchParams.get("limit") ?? String(HISTORY_PAGE_SIZE),
    10,
  );

  if (!Number.isFinite(offset) || offset < 0 || !Number.isFinite(limit) || limit < 1 || limit > 24) {
    return NextResponse.json({ error: "Parametros de paginacion invalidos." }, { status: 400 });
  }

  const events = await getListeningEventsByUser(context.supabase, {
    organizationId: context.organization.id,
    userId: context.user.id,
    limit,
    offset,
  });

  return NextResponse.json({
    events,
    hasMore: events.length === limit,
  });
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "api:collaborator-listening-events:create",
    key: getClientIpFromHeaders(request.headers),
    limit: 10,
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
  const parsed = createListeningEventInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa la sucursal y el nivel de escucha." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [organization, membership] = await Promise.all([
    getOrganizationByUser(supabase, user.id),
    getOrganizationMembershipByUser(supabase, user.id),
  ]);

  if (!organization || !membership || membership.role !== "collaborator") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (membership.branchId && parsed.data.branchId !== membership.branchId) {
    return NextResponse.json(
      { error: "Solo puedes registrar escucha para tu sucursal asignada." },
      { status: 403 },
    );
  }

  const activeSurvey = await getActiveListeningSurveyNotificationForUser(supabase, {
    organizationId: organization.id,
    userId: user.id,
  });

  if (!activeSurvey) {
    return NextResponse.json(
      { error: "La evaluación de escucha no está activa en este momento." },
      { status: 403 },
    );
  }

  try {
    const event = await createListeningEvent(supabase, {
      organizationId: organization.id,
      userId: user.id,
      input: parsed.data,
    });

    await markNotificationAsRead(supabase, activeSurvey.id);

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el evento." }, { status: 500 });
  }
}
