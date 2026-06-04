import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "./dashboard-shell";

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

    if (url.includes("/qr-link")) {
      return Response.json({
        path: "/q/test-token",
        url: "http://localhost/q/test-token",
        feedbackPath: "/feedback/mall-norte",
      });
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
    expect(screen.getByText("Configuracion pendiente")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir asistente IA de alertas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Comentarios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Alertas" })).not.toBeInTheDocument();
    expect(screen.queryByText("1,248")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vista con datos" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders comments as an independent view from the hash", async () => {
    window.history.pushState({}, "", "/dashboard#comentarios");

    render(<DashboardShell />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Comentarios" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByText("Configuracion pendiente")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar comentario")).toBeInTheDocument();
    expect(screen.getByText("Sin comentarios registrados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vista con datos" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
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

  it("opens the notifications panel with mocked items", () => {
    render(<DashboardShell />);

    fireEvent.click(screen.getByRole("button", { name: "Vista con datos" }));
    fireEvent.click(screen.getByRole("button", { name: "Notificaciones" }));

    expect(
      screen.getByRole("dialog", { name: "Panel de notificaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mall Norte requiere atencion")).toBeInTheDocument();
    expect(screen.getByText("Nuevo comentario con riesgo")).toBeInTheDocument();
    expect(screen.getByText("Boulevard estabilizo servicio")).toBeInTheDocument();
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

    expect(screen.getByText("Gerente de tienda")).toBeInTheDocument();
    expect(screen.getByText("Resumen, Valoraciones, Alertas")).toBeInTheDocument();
  });

  it("assigns a created permission profile to a team member", async () => {
    window.history.pushState({}, "", "/dashboard#permisos");

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

    fireEvent.click(screen.getByRole("button", { name: "Equipo" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Ana Lopez" }));

    fireEvent.change(screen.getByLabelText("Rol"), {
      target: { value: "profile-1" },
    });

    expect(screen.getByText("Gerente de tienda")).toBeInTheDocument();
    expect(screen.getByText("Resumen, Valoraciones")).toBeInTheDocument();
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
            label: "Ultimos 7 dias",
            from: "2026-05-06T00:00:00.000Z",
            to: "2026-05-13T23:59:59.999Z",
            timeZone: "America/Tegucigalpa",
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
              status: "Activa",
              csat: "4.6/5",
              comments: "12 comentarios",
              tone: "success",
              marker: 32,
              segments: [40, 35, 25],
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

    expect(screen.getByRole("heading", { name: "Codigo QR" })).toBeInTheDocument();
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
            feedbackPath: "/feedback/centro",
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
      expect(screen.getByRole("heading", { name: "Codigo QR" })).toBeInTheDocument();
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

  it("shows separated demo data in the active view only when the visual toggle is active", async () => {
    window.history.pushState({}, "", "/dashboard#comentarios");

    render(<DashboardShell />);

    const toggle = screen.getByRole("button", { name: "Vista con datos" });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Operacion retail")).not.toBeInTheDocument();
    expect(screen.queryByText("1,248")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar por negocio" })).toBeInTheDocument();
    expect(screen.queryByText("Sin comentarios registrados")).not.toBeInTheDocument();
  });
});
