import { NextResponse } from "next/server";

import { triggerListeningSurveyForOrganization } from "@/domain/listening/reminder-trigger";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import {
  hasSupabasePublicEnv,
  hasSupabaseServiceEnv,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function canTriggerSurvey(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
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

  if (!hasSupabaseServiceEnv()) {
    return NextResponse.json(
      { error: "Supabase service role no esta configurado." },
      { status: 503 },
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

  if (!membership || !canTriggerSurvey(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para enviar la encuesta." },
      { status: 403 },
    );
  }

  try {
    // Service role: el SELECT tras INSERT falla con el client de usuario porque
    // RLS solo deja leer notificaciones donde recipient_user_id = auth.uid().
    const result = await triggerListeningSurveyForOrganization(
      createServiceClient(),
      {
        organizationId: membership.organizationId,
        actorUserId: user.id,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("listening_survey_trigger_failed", error);
    return NextResponse.json(
      { error: "No se pudo enviar la encuesta de escucha." },
      { status: 500 },
    );
  }
}
