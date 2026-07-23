import { NextResponse } from "next/server";

import {
  deleteAllDeletableNotificationsForOrganization,
  deleteNotificationsByIds,
  getNotificationsPageForOrganization,
} from "@/domain/notifications/repository";
import {
  getPermissionProfileById,
  memberHasBusinessAccess,
} from "@/domain/organizations/permission-profiles";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function resolveOrganizationContext() {
  if (!hasSupabasePublicEnv()) {
    return {
      error: NextResponse.json(
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
    return {
      error: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  const [organization, membership] = await Promise.all([
    getOrganizationByUser(supabase, user.id),
    getOrganizationMembershipByUser(supabase, user.id),
  ]);

  if (!organization || !membership) {
    return {
      error: NextResponse.json(
        { error: "No se encontro la organizacion." },
        { status: 404 },
      ),
    };
  }

  const profile = membership.organizationRoleId
    ? await getPermissionProfileById(supabase, {
        organizationId: organization.id,
        organizationRoleId: membership.organizationRoleId,
      })
    : null;

  const canViewNotifications = memberHasBusinessAccess({
    role: membership.role,
    profile,
  });

  if (!canViewNotifications) {
    return {
      error: NextResponse.json(
        { error: "No tienes permiso para ver notificaciones." },
        { status: 403 },
      ),
    };
  }

  return { supabase, organization, membership };
}

export async function GET(request: Request) {
  const context = await resolveOrganizationContext();
  if ("error" in context) {
    return context.error;
  }

  const { supabase, organization } = context;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "15");

  const result = await getNotificationsPageForOrganization(
    supabase,
    organization.id,
    {
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 15,
    },
  );

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const context = await resolveOrganizationContext();
  if ("error" in context) {
    return context.error;
  }

  const { supabase, organization, membership } = context;

  if (membership.role !== "owner" && membership.role !== "manager") {
    return NextResponse.json(
      { error: "No tienes permiso para eliminar notificaciones." },
      { status: 403 },
    );
  }

  let body: { ids?: string[]; all?: boolean } = {};
  try {
    body = (await request.json()) as { ids?: string[]; all?: boolean };
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido." }, { status: 400 });
  }

  if (body.all === true) {
    const result = await deleteAllDeletableNotificationsForOrganization(
      supabase,
      organization.id,
    );
    return NextResponse.json({ status: "ok", ...result });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Selecciona al menos una notificacion." },
      { status: 400 },
    );
  }

  const result = await deleteNotificationsByIds(supabase, ids);
  return NextResponse.json({ status: "ok", ...result });
}
