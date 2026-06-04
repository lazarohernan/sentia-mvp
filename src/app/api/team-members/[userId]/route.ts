import { NextResponse } from "next/server";

import {
  getPermissionProfileById,
  inferMemberRoleFromPermissionProfile,
  updateTeamMemberPermissionProfile,
  updateTeamMemberPermissionProfileInputSchema,
} from "@/domain/organizations/permission-profiles";
import { removeTeamMember } from "@/domain/organizations/remove-team-member";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
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

type TeamMemberRouteProps = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, { params }: TeamMemberRouteProps) {
  const { userId: targetUserId } = await params;
  const clientIp = getClientIpFromHeaders(request.headers);

  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:team-members:update-role",
    key: clientIp,
    limit: 40,
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
      { error: "No tienes permisos para actualizar colaboradores." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateTeamMemberPermissionProfileInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Rol invalido." }, { status: 400 });
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

  try {
    const result = await updateTeamMemberPermissionProfile(serviceClient, {
      organizationId: membership.organizationId,
      targetUserId,
      organizationRoleId: parsed.data.organizationRoleId,
      actorBranchId: membership.branchId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("no pertenece")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("permisos")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "No se pudo actualizar el rol del colaborador." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: TeamMemberRouteProps) {
  const { userId: targetUserId } = await params;
  const clientIp = getClientIpFromHeaders(request.headers);

  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:team-members:delete",
    key: clientIp,
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

  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar colaboradores." },
      { status: 403 },
    );
  }

  try {
    await removeTeamMember(createServiceClient(), {
      organizationId: membership.organizationId,
      targetUserId,
      actorUserId: user.id,
      actorRole: membership.role as "owner" | "manager",
      actorBranchId: membership.branchId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("no encontrado")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes("permisos") ||
      message.includes("eliminarte") ||
      message.includes("propietario")
    ) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: "No se pudo eliminar al colaborador." }, { status: 500 });
  }
}
