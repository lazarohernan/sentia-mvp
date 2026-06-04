import { NextResponse } from "next/server";

import {
  getFeedbackFollowUpActions,
  updateFeedbackFollowUp,
} from "@/domain/feedback/follow-up";
import { updateFeedbackFollowUpInputSchema } from "@/domain/feedback/follow-up-schemas";
import { workflowStatusToLabel } from "@/domain/feedback/workflow-status";
import {
  getOrganizationByUser,
  getOrganizationMembershipByUser,
} from "@/domain/organizations/repository";
import { consumeDistributedRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

async function getAuthContext() {
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
    return {
      errorResponse: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!organization || !membership) {
    return {
      errorResponse: NextResponse.json(
        { error: "No se encontro una organizacion para este usuario." },
        { status: 404 },
      ),
    };
  }

  return { supabase, user, organization, membership };
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await getAuthContext();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { submissionId } = await context.params;
  if (!submissionId) {
    return NextResponse.json({ error: "Comentario invalido." }, { status: 400 });
  }

  const actions = await getFeedbackFollowUpActions(
    authResult.supabase,
    submissionId,
    {
      organizationId: authResult.organization.id,
      actorBranchId: authResult.membership.branchId,
    },
  );

  return NextResponse.json({ actions });
}

export async function PATCH(request: Request, context: RouteContext) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = await consumeDistributedRateLimit({
    namespace: "api:feedback:follow-up",
    key: clientIp,
    limit: 80,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const authResult = await getAuthContext();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { submissionId } = await context.params;
  if (!submissionId) {
    return NextResponse.json({ error: "Comentario invalido." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateFeedbackFollowUpInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos." }, { status: 400 });
  }

  const result = await updateFeedbackFollowUp(authResult.supabase, {
    submissionId,
    organizationId: authResult.organization.id,
    actorUserId: authResult.user.id,
    actorBranchId: authResult.membership.branchId,
    input: parsed.data,
  });

  if (!result) {
    return NextResponse.json(
      { error: "No se pudo actualizar el seguimiento." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: workflowStatusToLabel(result.workflowStatus),
    workflowStatus: result.workflowStatus,
    actions: result.actions,
  });
}
