type AlertUrgency = "low" | "medium" | "high" | "critical" | null | undefined;

const SLA_HOURS: Record<NonNullable<AlertUrgency>, number> = {
  low: 72,
  medium: 48,
  high: 24,
  critical: 4,
};

export function getSlaHoursForUrgency(urgency: AlertUrgency) {
  if (!urgency) {
    return SLA_HOURS.medium;
  }

  return SLA_HOURS[urgency];
}

export function getHoursOpen(createdAtIso: string, referenceDate = new Date()) {
  const createdAt = new Date(createdAtIso).getTime();
  const reference = referenceDate.getTime();

  if (!Number.isFinite(createdAt) || reference < createdAt) {
    return 0;
  }

  return (reference - createdAt) / 3_600_000;
}

export function isSlaBreached(params: {
  createdAtIso: string;
  urgency?: AlertUrgency;
  firstResponseAt?: string | null;
  workflowStatus?: string;
  referenceDate?: Date;
}) {
  if (params.workflowStatus === "resuelto" || params.firstResponseAt) {
    return false;
  }

  const hoursOpen = getHoursOpen(params.createdAtIso, params.referenceDate);
  return hoursOpen >= getSlaHoursForUrgency(params.urgency);
}
