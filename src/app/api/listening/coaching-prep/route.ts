import { NextResponse } from "next/server";
import { z } from "zod";

import { generateListeningCoachingPrep } from "@/domain/listening/coaching-ai-prep";
import { getListeningCoachingPriorities } from "@/domain/listening/coaching-priority";
import { getListeningCollaboratorSummaries } from "@/domain/listening/daily-summary";
import { getListeningEventsByOrganization } from "@/domain/listening/repository";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import {
  hasSupabasePublicEnv,
  hasSupabaseServiceEnv,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const requestSchema = z.object({
  subjectUserId: z.string().uuid(),
});

function canManageCoaching(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "api:listening-coaching-prep",
    key: getClientIpFromHeaders(request.headers),
    limit: 40,
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
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Colaborador invalido." }, { status: 400 });
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

  const events = await getListeningEventsByOrganization(
    supabase,
    membership.organizationId,
    500,
  );
  const subjectEvents = events.filter(
    (event) => event.userId === parsed.data.subjectUserId,
  );

  if (subjectEvents.length === 0) {
    return NextResponse.json(
      { error: "No hay registros de escucha para este colaborador." },
      { status: 404 },
    );
  }

  const summaries = getListeningCollaboratorSummaries(subjectEvents);
  const summary = summaries[0];
  const priorities = getListeningCoachingPriorities(summaries, subjectEvents, {
    limit: 1,
  });
  const reasons = priorities[0]?.reasons ?? ["Revision puntual de escucha"];

  const serviceClient = hasSupabaseServiceEnv() ? createServiceClient() : undefined;
  const prep = await generateListeningCoachingPrep({
    events: subjectEvents,
    userName: summary?.userName ?? "Colaborador",
    reasons,
    organizationId: membership.organizationId,
    serviceClient,
  });

  return NextResponse.json({
    prep,
    urgency: priorities[0]?.urgency ?? null,
    reasons,
  });
}
