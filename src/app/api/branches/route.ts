import { NextResponse } from "next/server";

import { createBranch, updateBranch } from "@/domain/branches/repository";
import {
  createBranchInputSchema,
  updateBranchInputSchema,
} from "@/domain/branches/schemas";
import { getOrganizationByUser } from "@/domain/organizations/repository";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { getClientIpFromHeaders, consumeRateLimit } from "@/lib/security/rate-limit";
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
    return {
      errorResponse: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  const organization = await getOrganizationByUser(supabase, user.id);

  if (!organization) {
    return {
      errorResponse: NextResponse.json(
        { error: "No se encontro una organizacion para este usuario." },
        { status: 404 },
      ),
    };
  }

  return { supabase, organization };
}

export async function POST(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:branches:create",
    key: clientIp,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createBranchInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa el nombre y la direccion de la sucursal." },
      { status: 400 },
    );
  }

  const authResult = await getAuthenticatedOrganization();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { supabase, organization } = authResult;

  try {
    const branch = await createBranch(supabase, organization.id, parsed.data);

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: "Ya existe una sucursal con ese nombre." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo crear la sucursal." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const clientIp = getClientIpFromHeaders(request.headers);
  const rateLimit = consumeRateLimit({
    namespace: "api:branches:update",
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
  const parsed = updateBranchInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa el nombre, la direccion y el estado de la sucursal." },
      { status: 400 },
    );
  }

  const authResult = await getAuthenticatedOrganization();
  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { supabase, organization } = authResult;

  try {
    const branch = await updateBranch(supabase, organization.id, parsed.data);

    return NextResponse.json({ branch }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";

    if (message.toLowerCase().includes("duplicate")) {
      return NextResponse.json(
        { error: "Ya existe una sucursal con ese nombre." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "No se pudo actualizar la sucursal." },
      { status: 500 },
    );
  }
}
