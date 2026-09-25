import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import { DashboardHomeView } from "./dashboard-home-view";

const dateRange = getDashboardDateRange({ period: "custom", start: "2026-08-01", end: "2026-08-31" });
const branch = { id: "branch-1", organization_id: "org-1", name: "Centro", slug: "centro", address: null, is_active: true, created_at: "2026-01-01" };

describe("DashboardHomeView", () => {
  it("does not present absent feedback as healthy and opens the QR action", () => {
    const onShareQr = vi.fn();
    render(<DashboardHomeView branches={[branch]} alerts={[]} dateRange={dateRange} onShareQr={onShareQr} onBranches={vi.fn()} />);
    expect(screen.getByText("Aún no hay datos para detectar alertas")).toBeInTheDocument();
    expect(screen.queryByText("Sin alertas abiertas en esta vista")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Compartir QR" }));
    expect(onShareQr).toHaveBeenCalledOnce();
  });

  it("keeps the branch and custom date range in links to opinions", () => {
    render(<DashboardHomeView branches={[branch]} alerts={[]} dateRange={dateRange} selectedBranchId={branch.id} onShareQr={vi.fn()} onBranches={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute("href", "/dashboard?period=custom&start=2026-08-01&end=2026-08-31&branchId=branch-1#comentarios");
  });

  it("shows unresolved alerts but excludes resolved items", () => {
    render(<DashboardHomeView branches={[branch]} dateRange={dateRange} onShareQr={vi.fn()} onBranches={vi.fn()} alerts={[
      { id: "open", title: "Revisar atención", subtitle: "Centro", detail: "Hay una solicitud pendiente", priority: "Alta", tone: "danger", unread: true, source: "ia", workflowStatus: "nuevo" },
      { id: "done", title: "Asunto resuelto", subtitle: "Centro", detail: "Finalizado", priority: "Baja", tone: "success", unread: false, source: "ia", workflowStatus: "resuelto" },
    ]} />);
    expect(screen.getByText("Revisar atención")).toBeInTheDocument();
    expect(screen.queryByText("Asunto resuelto")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar pendientes" })).toBeInTheDocument();
  });
});
