import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { DashboardShell } from "./dashboard-shell";

describe("DashboardShell", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/dashboard");
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

  it("creates a QR record from the QR view form", () => {
    window.history.pushState({}, "", "/dashboard#qr");

    render(<DashboardShell />);

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
