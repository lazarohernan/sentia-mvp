import { NextResponse } from "next/server";

import { resendTeamMemberInvite } from "@/domain/organizations/resend-team-member-invite";
import { getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { sendTeamInviteEmail } from "@/lib/email/send-team-invite-email";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv, hasSupabaseServiceEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const RESEND_COOLDOWN_MS = 10 * 60 * 1000;
const RESEND_EMAIL_WINDOW_MS = 60 * 60 * 1000;

function canManageTeam(role: string) {
  return role === "owner" || role === "manager";
}

function rateLimitResponse(message: string, resetAt: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return NextResponse.json({ error: message, retryAfterSeconds }, { status: 429 });
}

function getAppUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ??
    new URL(request.url).origin
  );
}

async function getOrganizationName(
  client: ReturnType<typeof createServiceClient>,
  organizationId: string,
) {
  const { data } = await client
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  return (data as { name?: string } | null)?.name ?? "Tu organización";
}

type ResendInviteRouteProps = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: ResendInviteRouteProps) {
  const { userId: targetUserId } = await params;
  const clientIp = getClientIpFromHeaders(request.headers);

  const ipRateLimit = consumeRateLimit({
    namespace: "api:team-members:resend:ip",
    key: clientIp,
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!ipRateLimit.allowed) {
    return rateLimitResponse(
      "Demasiados reenvios desde esta red. Intenta mas tarde.",
      ipRateLimit.resetAt,
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
      { error: "No tienes permisos para reenviar invitaciones." },
      { status: 403 },
    );
  }

  const actorTargetRateLimit = consumeRateLimit({
    namespace: "api:team-members:resend:actor-target",
    key: `${user.id}:${targetUserId}`,
    limit: 1,
    windowMs: RESEND_COOLDOWN_MS,
  });

  if (!actorTargetRateLimit.allowed) {
    return rateLimitResponse(
      "Espera antes de reenviar otra invitacion a esta persona.",
      actorTargetRateLimit.resetAt,
    );
  }

  const targetRateLimit = consumeRateLimit({
    namespace: "api:team-members:resend:target",
    key: targetUserId,
    limit: 3,
    windowMs: RESEND_EMAIL_WINDOW_MS,
  });

  if (!targetRateLimit.allowed) {
    return rateLimitResponse(
      "Este colaborador ya recibio varias invitaciones recientes.",
      targetRateLimit.resetAt,
    );
  }

  const siteUrl = getAppUrl(request);

  try {
    const serviceClient = createServiceClient();
    const result = await resendTeamMemberInvite(serviceClient, {
      organizationId: membership.organizationId,
      targetUserId,
      siteUrl,
    });

    const organizationName = await getOrganizationName(
      serviceClient,
      membership.organizationId,
    );
    const inviteEmailStatus = await sendTeamInviteEmail({
      to: result.email,
      fullName: result.fullName,
      organizationName,
      roleLabel: result.roleLabel,
      inviteLink: result.inviteLink,
      appUrl: siteUrl,
    });

    return NextResponse.json({ ...result, inviteEmailStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.includes("ya activo")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("no encontrado") || message.includes("No se encontro")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes("propietario")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    if (message.includes("correo")) {
      return NextResponse.json(
        { error: "No se pudo enviar la invitacion por correo." },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: "No se pudo reenviar la invitacion." }, { status: 500 });
  }
}
