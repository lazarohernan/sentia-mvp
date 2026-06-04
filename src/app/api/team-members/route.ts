import { NextResponse } from "next/server";

import { addTeamMember } from "@/domain/organizations/add-team-member";
import { createTeamMemberInputSchema } from "@/domain/organizations/member-schemas";
import {
  getPermissionProfileById,
  inferMemberRoleFromPermissionProfile,
} from "@/domain/organizations/permission-profiles";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function canManageTeam(role: string) {
  return role === "owner" || role === "manager";
}

function canAssignRole(actorRole: string, targetRole: "manager" | "collaborator") {
  if (actorRole === "owner") {
    return true;
  }

  return actorRole === "manager" && targetRole === "collaborator";
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:team-members:create",
    key: clientIp,
    limit: 10,
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

  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para agregar colaboradores." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTeamMemberInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa nombre, correo, rol y sucursal." },
      { status: 400 },
    );
  }

  const serviceClient = createServiceClient();
  const permissionProfile = parsed.data.organizationRoleId
    ? await getPermissionProfileById(serviceClient, {
        organizationId: membership.organizationId,
        organizationRoleId: parsed.data.organizationRoleId,
      })
    : null;

  if (parsed.data.organizationRoleId && !permissionProfile) {
    return NextResponse.json(
      { error: "El rol seleccionado no pertenece a la organizacion." },
      { status: 400 },
    );
  }

  const targetRole = inferMemberRoleFromPermissionProfile(permissionProfile);

  if (!canAssignRole(membership.role, targetRole)) {
    return NextResponse.json(
      { error: "No puedes asignar ese rol con tu cuenta." },
      { status: 403 },
    );
  }

  const siteUrl = new URL(request.url).origin;

  try {
    const result = await addTeamMember(serviceClient, {
      organizationId: membership.organizationId,
      input: {
        ...parsed.data,
        role: targetRole,
      },
      siteUrl,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("ya pertenece")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("sucursal")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "No se pudo agregar al colaborador." },
      { status: 500 },
    );
  }
}
