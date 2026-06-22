export type ReportPeriod = "weekly" | "monthly";
export type ReportCadence = ReportPeriod | "both";

export const reportCadences = ["weekly", "monthly", "both"] as const;
export const reportPeriods = ["weekly", "monthly"] as const;

export function resolveReportPeriod(
  cadence: ReportCadence,
  activePeriod: ReportPeriod = "weekly",
): ReportPeriod {
  if (cadence === "both") {
    return activePeriod;
  }

  return cadence;
}

export function getReportCadenceTargets(period: ReportPeriod) {
  if (period === "weekly") {
    return { perBranch: 2, minimum: 4 };
  }

  return { perBranch: 8, minimum: 12 };
}

export function getReportCadenceMeta(period: ReportPeriod) {
  if (period === "weekly") {
    return {
      cadence: period,
      label: "Semanal",
      shortLabel: "semanal",
      periodLabel: "Últimos 7 días",
      preparationTitle: "Preparación del informe semanal",
      previewTitle: "Informe semanal",
      frequencyHint:
        "Revisa y comparte cada semana. El informe cubre los últimos 7 días.",
      branchReadinessLabel: "Preparación semanal",
    };
  }

  return {
    cadence: period,
    label: "Mensual",
    shortLabel: "mensual",
    periodLabel: "Últimos 30 días",
    preparationTitle: "Preparación del informe mensual",
    previewTitle: "Informe mensual",
    frequencyHint:
      "Revisa y comparte cada mes. El informe cubre los últimos 30 días.",
    branchReadinessLabel: "Preparación mensual",
  };
}

export function getReportCadenceSettingMeta(cadence: ReportCadence = "monthly") {
  if (cadence === "both") {
    return {
      cadence,
      label: "Semanal y mensual",
      frequencyHint:
        "Recibes un pulso semanal y un cierre mensual. En Informes puedes alternar entre ambos.",
      periodBadge: "Semanal y mensual",
    };
  }

  const periodMeta = getReportCadenceMeta(cadence);

  return {
    cadence,
    label: periodMeta.label,
    frequencyHint: periodMeta.frequencyHint,
    periodBadge: `Cadencia ${periodMeta.shortLabel}`,
  };
}
