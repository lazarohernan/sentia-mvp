import { NextResponse } from "next/server";
import { z } from "zod";

import { getImprovementNarratives } from "@/domain/dashboard/improvements-repository";
import { getOrganizationByUser, getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { createClient } from "@/lib/supabase/server";

const querySchema = z.object({
  period: z.enum(["7d", "30d"]).default("7d"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    period: searchParams.get("period") ?? "7d",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  if (!organization) {
    return NextResponse.json({ error: "Organización no encontrada." }, { status: 404 });
  }

  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  try {
    const narratives = await getImprovementNarratives(supabase, {
      organizationId: organization.id,
      period: parsed.data.period,
      branchIds: membership?.branchId ? [membership.branchId] : undefined,
    });

    return NextResponse.json({ narratives });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las mejoras guardadas.",
      },
      { status: 500 },
    );
  }
}
