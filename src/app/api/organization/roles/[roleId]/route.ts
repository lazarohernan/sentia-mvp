import { NextResponse } from "next/server";

import {
  deletePermissionProfile,
  getPermissionProfileById,
  getPermissionProfileUsage,
  updatePermissionProfile,
  updatePermissionProfileInputSchema,
} from "@/domain/organizations/permission-profiles";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type RouteContext = {
  params: Promise<{ roleId: string }>;
};

function canManageRoles(role: string) {
  return role === "owner" || role === "manager";
}

async function authorizeRoleManagement() {
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
      { error: "No tienes permisos para administrar roles." },
      { status: 403 },
    );
  }

  return { membership, serviceClient: createServiceClient() };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await authorizeRoleManagement();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { roleId } = await context.params;
  const profile = await getPermissionProfileById(auth.serviceClient, {
    organizationId: auth.membership.organizationId,
    organizationRoleId: roleId,
  });

  if (!profile) {
    return NextResponse.json({ error: "Rol no encontrado." }, { status: 404 });
  }

  const usage = await getPermissionProfileUsage(auth.serviceClient, {
    organizationId: auth.membership.organizationId,
    organizationRoleId: roleId,
  });

  return NextResponse.json({
    profile: {
      ...profile,
      memberCount: usage?.memberCount ?? 0,
    },
    usage,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:organization-roles:update",
    key: getClientIpFromHeaders(request.headers),
    limit: 40,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const auth = await authorizeRoleManagement();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { roleId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updatePermissionProfileInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa nombre y permisos del rol." },
      { status: 400 },
    );
  }

  try {
    const profile = await updatePermissionProfile(auth.serviceClient, {
      organizationId: auth.membership.organizationId,
      organizationRoleId: roleId,
      input: parsed.data,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre." }, { status: 409 });
    }

    if (message.includes("no existe")) {
      return NextResponse.json({ error: "Rol no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo actualizar el rol." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:organization-roles:delete",
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

  const auth = await authorizeRoleManagement();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { roleId } = await context.params;

  try {
    const result = await deletePermissionProfile(auth.serviceClient, {
      organizationId: auth.membership.organizationId,
      organizationRoleId: roleId,
    });

    return NextResponse.json({
      deleted: true,
      affectedMemberCount: result.affectedMemberCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("no existe")) {
      return NextResponse.json({ error: "Rol no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo eliminar el rol." }, { status: 500 });
  }
}
