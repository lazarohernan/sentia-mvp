import { dashboardMockSummary } from "./dashboard.mock-data";
import { DashboardExecutiveSummary } from "./dashboard-executive-summary";
import { DashboardSection } from "./dashboard-section";

type DashboardSummaryViewProps = {
  showDemoData: boolean;
};

const emptySummary = [
  { label: "Comentarios", value: "Sin datos", detail: "" },
  { label: "CSAT", value: "Sin datos", detail: "" },
  { label: "Alertas", value: "Sin datos", detail: "" },
  { label: "Sucursales", value: "Sin datos", detail: "" },
];

export function DashboardSummaryView({
  showDemoData,
}: DashboardSummaryViewProps) {
  const summary = showDemoData ? dashboardMockSummary : emptySummary;

  return (
    <DashboardSection
      id="resumen"
      title="Resumen"
      description="Indicadores principales e insights IA para decidir dónde revisar primero."
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <article
              key={item.label}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-600">
                {item.label}
              </p>
              <p
                className={
                  showDemoData
                    ? "mt-4 text-3xl font-semibold tracking-normal text-slate-950"
                    : "mt-5 text-sm text-slate-400"
                }
              >
                {item.value}
              </p>
              {item.detail ? (
                <p className="mt-2 text-sm font-medium text-emerald-800">
                  {item.detail}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <DashboardExecutiveSummary showDemoData={showDemoData} />
      </div>
    </DashboardSection>
  );
}
