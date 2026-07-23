import type { CsatHealthZone } from "@/domain/dashboard/ratings-health";

export const HEALTH_DISTRIBUTION_TITLE = "Cómo calificaron los clientes";
export const HEALTH_DISTRIBUTION_HELP =
  "Cada barra representa las valoraciones con nota del 1 al 5. La altura indica cuántas hubo en experiencia crítica, regular o positiva.";

export const healthZoneStyles: Record<
  CsatHealthZone | "none",
  {
    badgeClassName: string;
    textClassName: string;
    barClassName: string;
  }
> = {
  none: {
    badgeClassName: "bg-slate-100 text-slate-600",
    textClassName: "text-slate-600",
    barClassName: "bg-slate-200",
  },
  risk: {
    badgeClassName: "bg-rose-50 text-rose-700",
    textClassName: "text-rose-700",
    barClassName: "bg-red-500",
  },
  observation: {
    badgeClassName: "bg-amber-50 text-amber-800",
    textClassName: "text-amber-800",
    barClassName: "bg-amber-400",
  },
  good: {
    badgeClassName: "bg-emerald-50 text-emerald-800",
    textClassName: "text-emerald-800",
    barClassName: "bg-emerald-500",
  },
};

/** Etiquetas cortas para la barra y accesibilidad. */
export const healthZoneLabels: Record<CsatHealthZone, string> = {
  risk: "Atención urgente",
  observation: "Experiencia regular",
  good: "Buena experiencia",
};

const healthZoneCopy: Record<
  CsatHealthZone,
  { title: string; meaning: string; scoreRange: string }
> = {
  risk: {
    title: "Requieren atención pronto",
    meaning: "notas 1 o 2 de 5",
    scoreRange: "1–2",
  },
  observation: {
    title: "Experiencia regular",
    meaning: "nota 3 de 5",
    scoreRange: "3",
  },
  good: {
    title: "Buena experiencia",
    meaning: "notas 4 o 5 de 5",
    scoreRange: "4–5",
  },
};

const healthSegments: CsatHealthZone[] = ["risk", "observation", "good"];

function formatValoraciones(count: number) {
  return count === 1 ? "1 valoración" : `${count} valoraciones`;
}

export function describeHealthZoneEntry(
  zone: CsatHealthZone,
  count: number,
  percent: number,
) {
  const copy = healthZoneCopy[zone];

  if (count === 0) {
    return {
      primary: `Ninguna con nota ${copy.scoreRange}`,
      secondary: `No hubo calificaciones de ${copy.meaning} en este periodo.`,
    };
  }

  return {
    primary: `${formatValoraciones(count)} (${percent}%)`,
    secondary: `${copy.title} — clientes dejaron ${copy.meaning}.`,
  };
}

export function buildHealthDistributionAriaLabel(
  zoneCounts: Record<CsatHealthZone, number>,
  zonePercents: Record<CsatHealthZone, number>,
) {
  return healthSegments
    .map((zone) => {
      const count = zoneCounts[zone];
      if (count === 0) {
        return `${healthZoneLabels[zone]}: ninguna`;
      }

      return `${healthZoneLabels[zone]}: ${formatValoraciones(count)}, ${zonePercents[zone]}%`;
    })
    .join(". ");
}

type CsatHealthExplanationProps = {
  zoneCounts: Record<CsatHealthZone, number>;
  zonePercents: Record<CsatHealthZone, number>;
  scoredCount: number;
};

export function CsatHealthExplanation({
  zoneCounts,
  zonePercents,
  scoredCount,
}: CsatHealthExplanationProps) {
  if (scoredCount === 0) {
    return (
      <p className="text-xs leading-5 text-slate-500">
        Aún no hay valoraciones con calificación en este periodo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs leading-5 text-slate-600">
        De{" "}
        <span className="font-semibold text-slate-800">
          {formatValoraciones(scoredCount)}
        </span>{" "}
        con nota en este periodo:
      </p>
      <ul className="space-y-2">
        {healthSegments.map((zone) => {
          const entry = describeHealthZoneEntry(
            zone,
            zoneCounts[zone],
            zonePercents[zone],
          );

          return (
            <li key={zone} className="flex gap-2 text-xs leading-5">
              <span
                className={[
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  healthZoneStyles[zone].barClassName,
                ].join(" ")}
                aria-hidden="true"
              />
              <span className="text-slate-600">
                <span className="font-semibold text-slate-800">{entry.primary}</span>
                <span className="block text-slate-500">{entry.secondary}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type CsatHealthChartSize = "default" | "compact" | "wide";

function chartSizeTokens(size: CsatHealthChartSize) {
  if (size === "compact") {
    return {
      trackHeight: "h-40",
      gridGap: "gap-2 sm:gap-3",
      trackPadding: "px-2 pb-2 pt-7",
      barWidth: "w-[72%] max-w-10",
    };
  }
  if (size === "wide") {
    return {
      trackHeight: "h-56 sm:h-64",
      gridGap: "gap-4 sm:gap-8 md:gap-10",
      trackPadding: "px-2 pb-2 pt-8",
      barWidth: "w-[78%] max-w-40",
    };
  }
  return {
    trackHeight: "h-52",
    gridGap: "gap-2 sm:gap-4",
    trackPadding: "px-2 pb-2 pt-7",
    barWidth: "w-[72%] max-w-16",
  };
}

type CsatHealthDistributionBarProps = {
  zonePercents: Record<CsatHealthZone, number>;
  zoneCounts: Record<CsatHealthZone, number>;
  showExplanation?: boolean;
  size?: CsatHealthChartSize;
};

function CsatHealthVerticalBars({
  zonePercents,
  zoneCounts,
  size = "default",
}: {
  zonePercents: Record<CsatHealthZone, number>;
  zoneCounts: Record<CsatHealthZone, number>;
  size?: CsatHealthChartSize;
}) {
  const tokens = chartSizeTokens(size);

  return (
    <div
      className={`grid grid-cols-3 items-end ${tokens.gridGap}`}
      role="img"
      aria-label={buildHealthDistributionAriaLabel(zoneCounts, zonePercents)}
    >
      {healthSegments.map((zone) => {
        const percent = zonePercents[zone];
        const count = zoneCounts[zone];
        const copy = healthZoneCopy[zone];
        const barHeightPercent =
          count > 0 ? Math.max(percent, 8) : 0;

        return (
          <div
            key={zone}
            className="flex min-w-0 flex-col items-center text-center"
            title={`${healthZoneLabels[zone]}: ${formatValoraciones(count)} (${percent}%)`}
          >
            <div
              className={[
                "relative w-full overflow-hidden rounded-lg bg-slate-100",
                tokens.trackHeight,
                tokens.trackPadding,
              ].join(" ")}
            >
              {count > 0 ? (
                <>
                  <span className="absolute top-2 left-1/2 z-10 -translate-x-1/2 text-xs font-bold text-slate-800">
                    {count}
                  </span>
                  <div
                    data-testid={`csat-health-bar-${zone}`}
                    className={[
                      "absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg",
                      tokens.barWidth,
                      healthZoneStyles[zone].barClassName,
                    ].join(" ")}
                    style={{
                      height: `${barHeightPercent}%`,
                      minHeight: "0.5rem",
                    }}
                  />
                </>
              ) : (
                <div
                  className={[
                    "absolute bottom-2 left-1/2 h-1.5 -translate-x-1/2 rounded-full bg-slate-200",
                    tokens.barWidth,
                  ].join(" ")}
                />
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-800">{percent}%</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
              Notas {copy.scoreRange}
            </p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-3.5 text-slate-400">
              {healthZoneLabels[zone]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function CsatHealthEmptyBars({ size = "default" }: { size?: CsatHealthChartSize }) {
  const tokens = chartSizeTokens(size);

  return (
    <div
      className={`grid grid-cols-3 items-end ${tokens.gridGap}`}
      aria-hidden="true"
    >
      {healthSegments.map((zone) => (
        <div key={zone} className="flex flex-col items-center">
          <div
            className={`w-full rounded-lg bg-slate-50 ${tokens.trackHeight}`}
          />
          <p className="mt-2 text-[11px] text-slate-400">
            Notas {healthZoneCopy[zone].scoreRange}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CsatHealthDistributionBar({
  zonePercents,
  zoneCounts,
  showExplanation = true,
  size = "default",
}: CsatHealthDistributionBarProps) {
  const scoredCount =
    zoneCounts.risk + zoneCounts.observation + zoneCounts.good;
  const hasDistribution = scoredCount > 0;

  if (!hasDistribution) {
    return <CsatHealthEmptyBars size={size} />;
  }

  return (
    <div className="flex flex-col space-y-3">
      <CsatHealthVerticalBars
        zonePercents={zonePercents}
        zoneCounts={zoneCounts}
        size={size}
      />
      {showExplanation ? (
        <CsatHealthExplanation
          zoneCounts={zoneCounts}
          zonePercents={zonePercents}
          scoredCount={scoredCount}
        />
      ) : null}
    </div>
  );
}
