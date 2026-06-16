import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAgentContextSnapshot } from "@/domain/agent/context";
import { createServiceClient } from "@/lib/supabase/service";

const agentContextRequestSchema = z.object({
  organizationId: z.string().uuid(),
  branchIds: z.array(z.string().uuid()).optional(),
  period: z.enum(["7d", "30d"]).default("30d"),
});

function isAuthorizedAgent(request: Request) {
  const configuredToken = process.env.AGENT_INTERNAL_TOKEN;
  if (!configuredToken) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const token = header.replace("Bearer ", "").trim();
  return token === configuredToken;
}

export async function POST(request: Request) {
  if (!isAuthorizedAgent(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = agentContextRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parametros invalidos." }, { status: 400 });
  }

  try {
    const snapshot = await buildAgentContextSnapshot(createServiceClient(), parsed.data);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo construir el contexto del agente.",
      },
      { status: 500 },
    );
  }
}
