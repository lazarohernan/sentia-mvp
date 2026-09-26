import { NextResponse } from "next/server";
import { z } from "zod";

import { insertAiUsageEvent } from "@/domain/ai-usage/repository";
import { buildAgentContextSnapshot } from "@/domain/agent/context";
import { getCalendarWeekWindow, getDashboardDateRange } from "@/domain/dashboard/date-range";
import {
  groupCommentsByBranchId,
  partitionImprovementGeneration,
  resolveImprovementSourceComments,
  resolveApiGenerationStrategy,
} from "@/domain/dashboard/improvements-batch";
import { generateImprovementNarratives } from "@/domain/dashboard/improvements-narrative";
import {
  getImprovementNarratives,
  getWeeklyDigestsForRollup,
  upsertImprovementNarratives,
  upsertWeeklyDigests,
} from "@/domain/dashboard/improvements-repository";
import { getOrganizationByUser, getOrganizationMembershipByUser } from "@/domain/organizations/repository";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  period: z.enum(["7d", "30d"]).default("7d"),
  force: z.boolean().optional().default(false),
});

function canRunAiOperations(role: string | undefined) {
  return role === "owner" || role === "manager";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
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

  if (!canRunAiOperations(membership?.role)) {
    return NextResponse.json(
      { error: "No tienes permiso para generar mejoras con IA." },
      { status: 403 },
    );
  }

  const branchIds = membership?.branchId ? [membership.branchId] : undefined;
  const serviceClient = createServiceClient();
  const dateRange = getDashboardDateRange({ period: parsed.data.period });
  const calendarWeek = getCalendarWeekWindow(dateRange.endDate);

  const context = await buildAgentContextSnapshot(serviceClient, {
    organizationId: organization.id,
    branchIds,
    period: parsed.data.period,
  }).catch(() => null);

  if (!context) {
    return NextResponse.json({ error: "No se pudieron cargar los datos del periodo." }, { status: 500 });
  }

  const sourceComments = resolveImprovementSourceComments({
    period: parsed.data.period,
    comments: context.dashboardComments,
    weeklyWindow: {
      startDate: calendarWeek.startDate,
      endDate: calendarWeek.endDate,
    },
  });
  const branchGroups = groupCommentsByBranchId(sourceComments);
  const savedNarratives = await getImprovementNarratives(serviceClient, {
    organizationId: organization.id,
    period: parsed.data.period,
    branchIds,
  }).catch(() => []);
  const { reusable, commentsToGenerate } = partitionImprovementGeneration({
    groups: branchGroups,
    saved: savedNarratives,
    force: parsed.data.force,
  });

  if (commentsToGenerate.length === 0) {
    return NextResponse.json({
      narratives: reusable,
      reusedCount: reusable.length,
      generatedCount: 0,
    });
  }

  const rateLimit = consumeRateLimit({
    namespace: "api:improvements:generate",
    key: `${user.id}:${getClientIpFromHeaders(request.headers)}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes de generación. Intenta más tarde." },
      { status: 429 },
    );
  }

  const weeklyRollups =
    parsed.data.period === "30d"
      ? await getWeeklyDigestsForRollup(serviceClient, {
          organizationId: organization.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          branchIds,
        }).catch(() => [])
      : [];

  const generated = await generateImprovementNarratives(
    commentsToGenerate,
    process.env.OPENAI_API_KEY?.trim(),
    {
      period: parsed.data.period,
      weeklyRollups,
      onUsage: async ({ branchId, model, estimate, rawUsage }) => {
        await insertAiUsageEvent(serviceClient, {
          organizationId: organization.id,
          branchId,
          useCase: "improvement_narrative",
          provider: "openai",
          model,
          operation: "responses.create",
          estimate,
          rawUsage,
        });
      },
    },
  );
  const narratives = [...reusable, ...generated];
  const branchesWithWeeklyRollups = branchGroups.filter((group) =>
    weeklyRollups.some((rollup) => rollup.branchId === group.branchId),
  ).length;

  try {
    await upsertImprovementNarratives(serviceClient, {
      organizationId: organization.id,
      actorUserId: user.id,
      period: parsed.data.period,
      items: generated,
    });

    if (parsed.data.period === "7d") {
      const commentsByBranchId = new Map(
        branchGroups.map((group) => [group.branchId, group.comments] as const),
      );

      const weeklyItems = generated.map((narrative) => {
        return {
          branchId: narrative.branchId,
          branchName: narrative.branch,
          narrative,
          comments: commentsByBranchId.get(narrative.branchId) ?? [],
        };
      });

      await upsertWeeklyDigests(serviceClient, {
        organizationId: organization.id,
        windowKey: calendarWeek.weekKey,
        windowLabel: calendarWeek.label,
        periodStart: calendarWeek.startDate,
        periodEnd: calendarWeek.endDate,
        items: weeklyItems,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Las mejoras se generaron pero no se pudieron guardar.",
        narratives,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    narratives,
    reusedCount: reusable.length,
    generatedCount: generated.length,
    strategy: resolveApiGenerationStrategy({
      period: parsed.data.period,
      branchCount: branchGroups.length,
      branchesWithWeeklyRollups,
    }),
    weeklyBatchesUsed: weeklyRollups.length,
  });
}
