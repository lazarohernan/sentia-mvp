import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardFloatingNav } from "./dashboard-floating-nav";

const sampleUser = {
  fullName: "Ana Lopez",
  email: "ana@empresa.com",
};

describe("DashboardFloatingNav", () => {
  it("renders the dashboard navigation items", () => {
    render(
      <DashboardFloatingNav
        activeView="resumen"
        onViewChange={() => {}}
        currentUser={sampleUser}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: /navegacion principal/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resumen/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /valoraciones/i })).toHaveAttribute(
      "href",
      "/dashboard#comentarios",
    );
    expect(screen.getByRole("link", { name: /gestión/i })).toHaveAttribute(
      "href",
      "/dashboard#equipo",
    );
    // Escucha es un botón con submenú hover (no un link directo)
    expect(
      screen.getByRole("button", { name: /escucha/i }),
    ).toHaveAttribute("aria-haspopup", "menu");
    expect(
      screen.getByRole("button", { name: /notificaciones/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cuenta de ana lopez/i }),
    ).toBeInTheDocument();
  });

  it("shows a fallback sign out control without user data", () => {
    render(
      <DashboardFloatingNav activeView="resumen" onViewChange={() => {}} />,
    );

    expect(screen.getByRole("button", { name: /salir/i })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("marks the controlled active item", () => {
    render(
      <DashboardFloatingNav activeView="comentarios" onViewChange={() => {}} />,
    );

    expect(screen.getByRole("link", { name: /valoraciones/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("muestra el submenú de Escucha al hacer hover sobre el trigger", () => {
    render(
      <DashboardFloatingNav
        activeView="escucha"
        onViewChange={() => {}}
        listeningSubNav={{
          activeTab: "analytics",
          analyticsHref: "/dashboard/escucha",
          coachingHref: "/dashboard/escucha/coaching",
        }}
      />,
    );

    const trigger = screen.getByRole("button", { name: /escucha/i });

    // Atributos ARIA antes del hover
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    // El submenú no existe en el DOM antes del hover (portal condicional)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    // Hover sobre el contenedor padre
    fireEvent.mouseEnter(trigger.closest("div")!);

    // Tras el hover el menú se renderiza vía portal en document.body
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /analítica/i })).toHaveAttribute(
      "href",
      "/dashboard/escucha",
    );
    expect(screen.getByRole("menuitem", { name: /coaching/i })).toHaveAttribute(
      "href",
      "/dashboard/escucha/coaching",
    );
  });

  it("updates the view without requiring a page refresh", () => {
    const onViewChange = vi.fn();

    render(
      <DashboardFloatingNav activeView="resumen" onViewChange={onViewChange} />,
    );

    window.history.pushState({}, "", "/dashboard");
    fireEvent.click(screen.getByRole("link", { name: /gestión/i }));

    expect(onViewChange).toHaveBeenCalledWith("gestion");
    expect(window.location.pathname).toBe("/dashboard");
    expect(window.location.hash).toBe("#equipo");
  });
});
