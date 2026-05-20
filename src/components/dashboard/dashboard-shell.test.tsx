import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardShell } from "./dashboard-shell";

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
    expect(screen.getByText("Insights IA sin datos")).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("link", { name: /^qr$/i }));

    expect(screen.getByRole("heading", { name: "QR" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Resumen" })).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#qr");
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

  it("renders the QR view with empty and demo states", () => {
    window.history.pushState({}, "", "/dashboard#qr");

    render(<DashboardShell />);

    expect(screen.getByRole("heading", { name: "QR" })).toBeInTheDocument();
    expect(screen.getByText("Sin QRs creados")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vista con datos" }));

    expect(screen.getByText("QRs creados")).toBeInTheDocument();
    expect(screen.getByText("/feedback/cafeteria-centro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/feedback/cafeteria-centro",
    );
  });

  it("renders real QR records from branches when demo data is off", async () => {
    window.history.pushState({}, "", "/dashboard#qr");

    render(
      <DashboardShell
        organizationName="Sayit"
        branches={[
          {
            id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
            organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
            name: "Mall Norte",
            slug: "mall-norte",
            address: "Nivel 2, local 14",
            is_active: true,
            created_at: "2026-05-12T12:00:00.000Z",
          },
        ]}
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
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "QR" })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Sayit")).toHaveLength(2);
    expect(screen.getAllByText("Mall Norte")).toHaveLength(2);
    expect(screen.getByText("/feedback/mall-norte")).toBeInTheDocument();
    expect(screen.getByText("12 comentarios")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/feedback/mall-norte",
    );
  });

  it("creates a QR record from the QR view form", () => {
    window.history.pushState({}, "", "/dashboard#qr");

    render(<DashboardShell />);

    fireEvent.click(screen.getByRole("button", { name: "Vista con datos" }));
    fireEvent.click(screen.getByRole("button", { name: /nuevo qr/i }));

    expect(screen.getByRole("dialog", { name: /nuevo qr/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ej. Cafeteria"), {
      target: { value: "Farmacia" },
    });
    fireEvent.change(screen.getByPlaceholderText("Ej. Centro"), {
      target: { value: "Las Colinas" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generar qr/i }));

    expect(screen.getAllByText("Farmacia")).toHaveLength(2);
    expect(screen.getAllByText("Las Colinas")).toHaveLength(2);
    expect(screen.getByText("/feedback/farmacia-las-colinas")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /nuevo qr/i })).not.toBeInTheDocument();
  });

  it("renders real branches in the branches view when demo data is off", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");

    render(
      <DashboardShell
        branches={[
          {
            id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
            organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
            name: "Mall Norte",
            slug: "mall-norte",
            address: "Nivel 2, local 14",
            is_active: true,
            created_at: "2026-05-12T12:00:00.000Z",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    expect(screen.getByText("Mall Norte")).toBeInTheDocument();
    expect(screen.getByText("Nivel 2, local 14")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/feedback/mall-norte",
    );
    expect(screen.queryByText("Sin sucursales configuradas")).not.toBeInTheDocument();
  });

  it("creates a branch from the drawer and adds it to the branches view", async () => {
    window.history.pushState({}, "", "/dashboard#sucursales");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
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
        ),
      ),
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
      expect(screen.getByText("Centro")).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/branches",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Centro",
          address: "Avenida principal",
          is_active: true,
        }),
      }),
    );
    expect(screen.getByText("Avenida principal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/feedback/centro",
    );
    expect(screen.queryByRole("dialog", { name: "Datos de la sucursal" })).not.toBeInTheDocument();
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

    render(
      <DashboardShell
        branches={[
          {
            id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
            organization_id: "853b4c7e-0fcb-4e9e-9f72-2ec20c8de59c",
            name: "Mall Norte",
            slug: "mall-norte",
            address: "Nivel 2, local 14",
            is_active: true,
            created_at: "2026-05-12T12:00:00.000Z",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursales" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Mall Norte" }));

    expect(screen.getByDisplayValue("Mall Norte")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nivel 2, local 14")).toBeInTheDocument();

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

    expect(fetch).toHaveBeenCalledWith(
      "/api/branches",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          id: "1f9f3375-2a3b-45f8-9f72-1db6f7189b52",
          name: "Mall Norte Renovado",
          address: "Plaza central, nivel 3",
          is_active: false,
        }),
      }),
    );
    expect(screen.getByText("Plaza central, nivel 3")).toBeInTheDocument();
    expect(screen.getByText("Inactiva")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir/i })).toHaveAttribute(
      "href",
      "/feedback/mall-norte-renovado",
    );
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
