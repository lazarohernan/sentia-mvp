import { NextResponse } from "next/server";

import {
  createPermissionProfile,
  createPermissionProfileInputSchema,
} from "@/domain/organizations/permission-profiles";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function canManageRoles(role: string) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit({
    namespace: "api:organization-roles:create",
    key: getClientIpFromHeaders(request.headers),
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  if (!hasSupabasePublicEnv() || !hasSupabaseServiceEnv()) {
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

  if (!membership || !canManageRoles(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para crear roles." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createPermissionProfileInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa nombre y permisos del rol." },
      { status: 400 },
    );
  }

  try {
    const profile = await createPermissionProfile(createServiceClient(), {
      organizationId: membership.organizationId,
      input: parsed.data,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre." }, { status: 409 });
    }

    return NextResponse.json({ error: "No se pudo crear el rol." }, { status: 500 });
  }
}
