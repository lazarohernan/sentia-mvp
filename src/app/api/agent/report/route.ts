import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAgentContextSnapshot } from "@/domain/agent/context";
import { generateOperationalAgentReport } from "@/domain/agent/operational-report";
import { insertAgentOperationalReport } from "@/domain/agent/repository";
import { getOrganizationByUser, getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const generateAgentReportInputSchema = z.object({
  period: z.enum(["7d", "30d"]).default("30d"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generateAgentReportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const organization = await getOrganizationByUser(supabase, user.id);
  const membership = await getOrganizationMembershipByUser(supabase, user.id);

  if (!organization) {
    return NextResponse.json(
      { error: "No se encontro una organizacion para este usuario." },
      { status: 404 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI no esta configurado para ejecutar el agente." },
      { status: 503 },
    );
  }

  try {
    const serviceClient = createServiceClient();
    const context = await buildAgentContextSnapshot(serviceClient, {
      organizationId: organization.id,
      branchIds: membership?.branchId ? [membership.branchId] : undefined,
      period: parsed.data.period,
    });

    const report = await generateOperationalAgentReport({
      config: {
        openAiApiKey: process.env.OPENAI_API_KEY,
        openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      },
      context,
    });

    await insertAgentOperationalReport(serviceClient, {
      organizationId: organization.id,
      actorUserId: user.id,
      branchId: membership?.branchId ?? null,
      report,
    });

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo ejecutar el agente operativo.",
      },
      { status: 500 },
    );
  }
}
