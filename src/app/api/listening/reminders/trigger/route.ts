import { NextResponse } from "next/server";

import { triggerListeningSurveyForOrganization } from "@/domain/listening/reminder-trigger";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function canTriggerSurvey(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:listening-reminders:trigger",
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!membership || !canTriggerSurvey(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para enviar la encuesta." },
      { status: 403 },
    );
  }

  try {
    const result = await triggerListeningSurveyForOrganization(supabase, {
      organizationId: membership.organizationId,
      actorUserId: user.id,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar la encuesta de escucha." },
      { status: 500 },
    );
  }
}
