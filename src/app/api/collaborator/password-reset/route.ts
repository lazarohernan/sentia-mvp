import { NextResponse } from "next/server";

import { buildAuthCallbackUrl } from "@/domain/auth/redirects";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "api:collaborator-password-reset",
    key: getClientIpFromHeaders(request.headers),
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo más tarde." },
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

  if (!user?.email) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (
    !membership ||
    !membership.participatesInListening ||
    membership.role === "owner" ||
    membership.role === "manager"
  ) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: buildAuthCallbackUrl(origin, "/auth/activar-cuenta?mode=reset"),
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo enviar el correo de recuperación." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
