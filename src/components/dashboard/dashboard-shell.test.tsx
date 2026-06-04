import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardDateRange } from "@/domain/dashboard/date-range";
import type { DashboardSummaryData } from "@/domain/dashboard/schemas";

import { DashboardShell } from "./dashboard-shell";

function buildShellDashboardData(
  overrides: Partial<DashboardSummaryData> = {},
): DashboardSummaryData {
  return {
    scope: "3 sucursales",
    period: "Últimos 7 días",
    dateRange: getDashboardDateRange({ period: "7d" }),
    metrics: [],
    insight: null,
    attentionItems: [],
    branchHealth: [],
    recentComments: [],
    comments: [],
    notifications: [],
    followUpMetrics: {
      openCount: 0,
      escalatedCount: 0,
      inReviewCount: 0,
      resolvedCount: 0,
      avgResponseHours: null,
      avgResolutionHours: null,
    },
    qrScanCounts: {},
    ...overrides,
  };
}

const mallNorteBranch = {
  id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
  organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
  name: "Mall Norte",
  slug: "mall-norte",
  address: "Nivel 2, local 14",
  is_active: true,
  created_at: "2026-05-12T12:00:00.000Z",
};

function mockFetchWithSignedQrLink(
  handler?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (handler) {
      const response = await handler(input, init);

      if (response.status !== 404) {
        return response;
      }
    }

    if (url.includes("/qr-link")) {
      return Response.json({
        path: "/q/test-token",
        url: "http://localhost/q/test-token",
        feedbackPath: "/feedback/mall-norte?token=test-token",
      });
    }

    return Response.json({}, { status: 404 });
  });
}

function mockFetchWithPermissionProfile(
  handler?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/api/team-members/")) {
      return Response.json({
        permissionProfileId: "profile-1",
        permissionProfileName: "Gerente de tienda",
        role: "collaborator",
      });
    }

    if (url.includes("/api/organization/roles")) {
      return Response.json(
        {
          profile: {
            id: "profile-1",
            name: "Gerente de tienda",
            permissions: ["summary", "comments"],
            memberCount: 0,
          },
        },
        { status: 201 },
      );
    }

    if (handler) {
      return handler(input, init);
    }

    return Response.json({}, { status: 404 });
  });
}

describe("DashboardShell", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/dashboard");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the executive dashboard as its own view by default", async () => {
    render(<DashboardShell />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Resumen operativo sin datos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir asistente IA de alertas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Valoraciones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resolver alerta" })).not.toBeInTheDocument();
    expect(screen.queryByText("1,248")).not.toBeInTheDocument();
  });

  it("renders comments as an independent view from the hash", async () => {
    window.history.pushState({}, "", "/dashboard#comentarios");

    render(<DashboardShell />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Valoraciones" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen operativo sin datos")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Buscar valoración")).not.toBeInTheDocument();
    expect(screen.getByText("Sin valoraciones registradas")).toBeInTheDocument();
  });

  it("renders intelligence reports as an independent view from the hash", async () => {
    window.history.pushState({}, "", "/dashboard#informes");

    render(
      <DashboardShell
        dashboardData={buildShellDashboardData({
          comments: [
            {
              id: "feedback-1",
              customer: "Cliente anónimo",
              business: "Feedback",
              branch: "Centro",
              feedbackType: "Observación",
              sentiment: "Neutral",
              csatScore: 3,
              status: "Nuevo",
              message: "Estuvo excelente, pero hay mucho que mejorar.",
              receivedAt: "Hace 5 min",
              analysisSummary:
                "El cliente reconoce aspectos positivos pero no especifica la causa.",
              recommendedAction:
                "Pedir motivo principal cuando la valoración sea ambigua.",
              dominantPattern: "Experiencia general",
              analysisConfidence: "85% confianza",
              analysisModel: "gpt-4.1-mini",
            },
          ],
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Informes" })).toBeInTheDocument();
    });

    expect(screen.getByText("Informe inteligente")).toBeInTheDocument();
    expect(screen.getByText("Preparación del informe mensual")).toBeInTheDocument();
    expect(screen.getAllByText(/Faltan/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Patrones por establecimiento")).toBeInTheDocument();
    expect(screen.getByText("Entrega por defecto")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("changes dashboard content when a menu item is clicked", () => {
    render(<DashboardShell />);

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /gestión/i }));

    expect(screen.getByRole("heading", { name: "Gestión" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Equipo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen" })).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#equipo");
  }, 15_000);

  it("opens the notifications panel with server notifications", () => {
    render(
      <DashboardShell
        dashboardData={buildShellDashboardData({
          notifications: [
            {
              id: "notification-001",
              title: "Norte requiere atención",
              detail: "Subieron los comentarios por espera en la última hora.",
              time: "Hace 8 min",
              href: "/dashboard#alertas",
              unread: true,
              tone: "danger",
            },
            {
              id: "notification-002",
              title: "Nuevo comentario con riesgo",
              detail: "Centro recibió una observación con CSAT 2/5.",
              time: "Hace 21 min",
              href: "/dashboard#comentarios",
              unread: true,
              tone: "warning",
            },
          ],
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Notificaciones" }));

    expect(
      screen.getByRole("dialog", { name: "Panel de notificaciones" }),
    ).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Panel de notificaciones" });

    expect(within(dialog).getByText("Norte requiere atención")).toBeInTheDocument();
    expect(within(dialog).getByText("Nuevo comentario con riesgo")).toBeInTheDocument();
  });

  it("redirects the legacy qr hash to sucursales", async () => {
    window.history.pushState({}, "", "/dashboard#qr");

    render(<DashboardShell branches={[mallNorteBranch]} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: "QR" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver QR" })).toBeInTheDocument();
  });

  it("switches between operational tabs inside the management view", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");

    render(<DashboardShell />);

    expect(screen.getByRole("heading", { name: "Gestión" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Equipo" }));

    expect(window.location.hash).toBe("#equipo");
    expect(screen.getByRole("heading", { name: "Equipo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sucursales" })).not.toBeInTheDocument();
  });

  it("creates permission profiles from management settings", async () => {
    window.history.pushState({}, "", "/dashboard#permisos");
    vi.stubGlobal("fetch", mockFetchWithPermissionProfile());

    render(<DashboardShell canManageTeam actorRole="owner" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Permisos" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Nombre del rol"), {
      target: { value: "Gerente de tienda" },
    });
    fireEvent.click(screen.getByLabelText("Resumen"));
    fireEvent.click(screen.getByLabelText("Valoraciones"));
    fireEvent.click(screen.getByLabelText("Alertas"));
    fireEvent.click(screen.getByRole("button", { name: "Crear rol" }));

    await waitFor(() => {
      expect(screen.getByText("Gerente de tienda")).toBeInTheDocument();
    });

    expect(screen.getByText("Resumen, Valoraciones")).toBeInTheDocument();
  });

  it("assigns a created permission profile to a team member", async () => {
    window.history.pushState({}, "", "/dashboard#permisos");
    vi.stubGlobal("fetch", mockFetchWithPermissionProfile());

    render(
      <DashboardShell
        canManageTeam
        actorRole="owner"
        teamMembers={[
          {
            userId: "user-1",
            branchId: "branch-1",
            branchName: "Mall Norte",
            fullName: "Ana Lopez",
            email: "ana@empresa.com",
            role: "collaborator",
            roleLabel: "Colaborador",
            joinedAt: "2026-05-01T10:00:00.000Z",
            accountStatus: "active",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Permisos" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Nombre del rol"), {
      target: { value: "Gerente de tienda" },
    });
    fireEvent.click(screen.getByLabelText("Resumen"));
    fireEvent.click(screen.getByLabelText("Valoraciones"));
    fireEvent.click(screen.getByRole("button", { name: "Crear rol" }));

    await waitFor(() => {
      expect(screen.getByText("Gerente de tienda")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Equipo", pressed: false }));
    await waitFor(() => {
      expect(screen.getByLabelText("Ver detalle de Ana Lopez")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Ver detalle de Ana Lopez"));

    fireEvent.change(screen.getByLabelText("Rol"), {
      target: { value: "profile-1" },
    });

    await waitFor(() => {
      expect(screen.getAllByText("Gerente de tienda").length).toBeGreaterThan(0);
      expect(screen.getByText("Resumen, Valoraciones")).toBeInTheDocument();
    });
  });

  it("opens the branch QR panel from sucursales", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");
    vi.stubGlobal("fetch", mockFetchWithSignedQrLink());

    render(
      <DashboardShell
        organizationName="Sayit"
        branches={[mallNorteBranch]}
        dashboardData={{
          organizationName: "Sayit",
          scope: "1 sucursal",
          period: "Ultimos 7 dias",
          dateRange: {
            period: "7d",
            label: "Ultimos 7 dias",
            startDate: "2026-05-06",
            endDate: "2026-05-13",
            startIso: "2026-05-06T06:00:00.000Z",
            endIso: "2026-05-14T05:59:59.999Z",
          },
          metrics: [],
          insight: null,
          attentionItems: [],
          followUpMetrics: {
            openCount: 0,
            escalatedCount: 0,
            inReviewCount: 0,
            resolvedCount: 0,
            avgResponseHours: null,
            avgResolutionHours: null,
          },
          branchHealth: [
            {
              branch: "Mall Norte",
              status: "Bueno",
              csat: "4.6",
              comments: "12 comentarios",
              tone: "success",
              zoneCounts: { risk: 1, observation: 2, good: 9 },
              zonePercents: { risk: 8, observation: 17, good: 75 },
              scoredCount: 12,
            },
          ],
          recentComments: [],
          comments: [],
          notifications: [],
          qrScanCounts: {},
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ver QR" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver QR" }));

    await waitFor(() => {
      expect(screen.getByText("/q/test-token")).toBeInTheDocument();
    });

    expect(screen.getByText("Codigo QR")).toBeInTheDocument();
    expect(screen.getAllByText("Mall Norte").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /abrir formulario/i })).toHaveAttribute(
      "href",
      "/q/test-token",
    );
  });

  it("renders real branches in the branches view when demo data is off", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");

    render(<DashboardShell branches={[mallNorteBranch]} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    expect(screen.getByText("Mall Norte")).toBeInTheDocument();
    expect(screen.getByText("Nivel 2, local 14")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver QR" })).toBeInTheDocument();
    expect(screen.queryByText("Sin sucursales configuradas")).not.toBeInTheDocument();
  });

  it("creates a branch from the drawer and offers the QR view", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");
    vi.stubGlobal(
      "fetch",
      mockFetchWithSignedQrLink(async (input, init) => {
        const url = String(input);
        const method = init?.method ?? "GET";

        if (url.includes("/api/branches") && method !== "GET") {
          return Response.json(
            {
              branch: {
                id: "3c944d7c-95df-4976-a52d-8a9d063bfc6a",
                organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
                name: "Centro",
                slug: "centro",
                address: "Avenida principal",
                is_active: true,
                created_at: "2026-05-12T12:00:00.000Z",
              },
            },
            { status: 201 },
          );
        }

        if (url.includes("/qr-link")) {
          return Response.json({
            path: "/q/test-token-centro",
            url: "http://localhost/q/test-token-centro",
            feedbackPath: "/feedback/centro?token=test-token-centro",
          });
        }

        return Response.json({}, { status: 404 });
      }),
    );

    render(<DashboardShell />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Nueva sucursal" }));
    fireEvent.change(screen.getByPlaceholderText("Ej. Mall Norte"), {
      target: { value: "Centro" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. Nivel 2, local 14"), {
      target: { value: "Avenida principal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar sucursal" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ver codigo QR" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ver codigo QR" }));

    await waitFor(() => {
      expect(screen.getByText("Codigo QR")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("/q/test-token-centro")).toBeInTheDocument();
    });
  });

  it("edits a branch from the drawer and updates the card", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            branch: {
              id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
              organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
              name: "Mall Norte Renovado",
              slug: "mall-norte-renovado",
              address: "Plaza central, nivel 3",
              is_active: false,
              created_at: "2026-05-12T12:00:00.000Z",
            },
          },
          { status: 200 },
        ),
      ),
    );

    render(<DashboardShell branches={[mallNorteBranch]} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Mall Norte" }));

    fireEvent.change(screen.getByDisplayValue("Mall Norte"), {
      target: { value: "Mall Norte Renovado" },
    });
    fireEvent.change(screen.getByDisplayValue("Nivel 2, local 14"), {
      target: { value: "Plaza central, nivel 3" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Sucursal activa" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(screen.getByText("Mall Norte Renovado")).toBeInTheDocument();
    });

    expect(screen.getByText("Plaza central, nivel 3")).toBeInTheDocument();
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver QR" })).toBeInTheDocument();
  }, 15_000);

});
