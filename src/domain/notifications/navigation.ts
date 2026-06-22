import type { ReportPeriod } from "@/domain/dashboard/report-cadence";

export function buildInformesNotificationHref(
  reportPeriod: ReportPeriod,
  options?: { openReport?: boolean },
) {
  const params = new URLSearchParams();
  params.set("reportPeriod", reportPeriod);

  if (options?.openReport) {
    params.set("openReport", "1");
  }

  return `/dashboard?${params.toString()}#informes`;
}

export function parseInformesNavigation(params: {
  searchParams?: URLSearchParams | null;
}) {
  const reportPeriodParam = params.searchParams?.get("reportPeriod");
  const reportPeriod: ReportPeriod | undefined =
    reportPeriodParam === "weekly" || reportPeriodParam === "monthly"
      ? reportPeriodParam
      : undefined;

  return {
    reportPeriod,
    autoOpenReport: params.searchParams?.get("openReport") === "1",
  };
}

export function getDashboardViewFromNotificationHref(href: string) {
  try {
    const url = new URL(href, "https://perks.local");
    const hash = url.hash.replace("#", "").split("?")[0];

    if (hash === "mejoras") {
      return "informes" as const;
    }

    if (
      hash === "comentarios" ||
      hash === "alertas" ||
      hash === "informes" ||
      hash === "resumen"
    ) {
      return hash;
    }

    if (
      hash === "qr" ||
      hash === "sucursales" ||
      hash === "equipo" ||
      hash === "permisos" ||
      hash === "configuracion"
    ) {
      return "gestion" as const;
    }
  } catch {
    return null;
  }

  return null;
}
