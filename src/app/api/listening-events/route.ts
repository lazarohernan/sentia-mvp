import { NextResponse } from "next/server";

import { createListeningEventInputSchema } from "@/domain/listening/schemas";
import { createListeningEvent } from "@/domain/listening/repository";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedOrganization() {
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

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);
  if (!organization) {
    return {
      errorResponse: NextResponse.json(
        { error: "No se encontro una organizacion para este usuario." },
        { status: 404 },
      ),
    };
  }

  return { supabase, organization, membership, userId: user.id };
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:listening-events:create",
    key: clientIp,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createListeningEventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa la sucursal y el nivel de escucha." }, { status: 400 });
  }

  const authResult = await getAuthenticatedOrganization();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { supabase, organization, membership, userId } = authResult;

  if (membership?.role === "collaborator") {
    return NextResponse.json(
      { error: "Usa el portal de colaborador para registrar escucha." },
      { status: 403 },
    );
  }

  if (membership?.branchId && parsed.data.branchId !== membership.branchId) {
    return NextResponse.json(
      { error: "Solo puedes registrar escucha para tu sucursal asignada." },
      { status: 403 },
    );
  }

  try {
    const event = await createListeningEvent(supabase, {
      organizationId: organization.id,
      userId,
      input: parsed.data,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar el evento." }, { status: 500 });
  }
}
