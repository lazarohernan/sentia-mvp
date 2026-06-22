import type { DashboardCommentRow } from "./schemas";
import { isInstantInHondurasDateRange } from "./honduras-time";

import type { ImprovementPeriod } from "./improvements-narrative";
import type { WeeklyDigestRollup } from "./improvements-digest";

export type ImprovementPromptStrategy =
  | "weekly_batch"
  | "monthly_from_weekly_batches"
  | "monthly_compressed";

export type BranchCommentGroup = {
  branchId: string;
  branchName: string;
  comments: DashboardCommentRow[];
};

export type WeeklyWindow = {
  startDate: string;
  endDate: string;
};

export function resolveImprovementPromptStrategy(
  period: ImprovementPeriod,
  branchWeeklyRollups: WeeklyDigestRollup[],
): ImprovementPromptStrategy {
  if (period === "7d") {
    return "weekly_batch";
  }

  if (branchWeeklyRollups.length > 0) {
    return "monthly_from_weekly_batches";
  }

  return "monthly_compressed";
}

export function resolveApiGenerationStrategy(params: {
  period: ImprovementPeriod;
  branchCount: number;
  branchesWithWeeklyRollups: number;
}): ImprovementPromptStrategy | "monthly_mixed" {
  if (params.period === "7d") {
    return "weekly_batch";
  }

  if (params.branchesWithWeeklyRollups === 0) {
    return "monthly_compressed";
  }

  if (params.branchesWithWeeklyRollups >= params.branchCount) {
    return "monthly_from_weekly_batches";
  }

  return "monthly_mixed";
}

export function groupCommentsByBranchId(
  comments: DashboardCommentRow[],
): BranchCommentGroup[] {
  const groups = new Map<string, BranchCommentGroup>();

  for (const comment of comments) {
    const branchId = comment.branchId ?? `name:${comment.branch}`;
    const existing = groups.get(branchId);

    if (existing) {
      existing.comments.push(comment);
      continue;
    }

    groups.set(branchId, {
      branchId: comment.branchId ?? branchId,
      branchName: comment.branch,
      comments: [comment],
    });
  }

  return [...groups.values()];
}

function dateRangesOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean {
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

export function dedupeOverlappingWeeklyRollups(
  rollups: WeeklyDigestRollup[],
): WeeklyDigestRollup[] {
  const byBranch = new Map<string, WeeklyDigestRollup[]>();

  for (const rollup of rollups) {
    const group = byBranch.get(rollup.branchId) ?? [];
    group.push(rollup);
    byBranch.set(rollup.branchId, group);
  }

  const deduped: WeeklyDigestRollup[] = [];

  for (const group of byBranch.values()) {
    const sorted = [...group].sort((left, right) =>
      right.generatedAt.localeCompare(left.generatedAt),
    );
    const kept: WeeklyDigestRollup[] = [];
    const seenFingerprints = new Set<string>();

    for (const candidate of sorted) {
      if (seenFingerprints.has(candidate.commentFingerprint)) {
        continue;
      }

      const overlaps = kept.some((existing) =>
        dateRangesOverlap(
          candidate.periodStart,
          candidate.periodEnd,
          existing.periodStart,
          existing.periodEnd,
        ),
      );

      if (overlaps) {
        continue;
      }

      seenFingerprints.add(candidate.commentFingerprint);
      kept.push(candidate);
    }

    deduped.push(
      ...kept.sort((left, right) => left.periodStart.localeCompare(right.periodStart)),
    );
  }

  return deduped;
}

export function filterCommentsByHondurasDateWindow(
  comments: DashboardCommentRow[],
  startDate: string,
  endDate: string,
): DashboardCommentRow[] {
  return comments.filter((comment) => {
    if (!comment.createdAtIso) {
      return false;
    }

    return isInstantInHondurasDateRange(comment.createdAtIso, startDate, endDate);
  });
}

export function resolveImprovementSourceComments(params: {
  period: ImprovementPeriod;
  comments: DashboardCommentRow[];
  weeklyWindow?: WeeklyWindow;
}): DashboardCommentRow[] {
  if (params.period !== "7d" || !params.weeklyWindow) {
    return params.comments;
  }

  return filterCommentsByHondurasDateWindow(
    params.comments,
    params.weeklyWindow.startDate,
    params.weeklyWindow.endDate,
  );
}
