import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: /informes/i })).toHaveAttribute(
      "href",
      "/dashboard#informes",
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

  it("allows deleting a notification from the popover", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <DashboardFloatingNav
        activeView="resumen"
        onViewChange={() => {}}
        notifications={[
          {
            id: "notification-001",
            title: "Informe listo",
            detail: "El informe semanal esta disponible.",
            time: "hace 1 min",
            href: "/dashboard#informes",
            unread: true,
            tone: "success",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));
    expect(screen.getByText("Informe listo")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /eliminar notificacion: informe listo/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Informe listo")).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/notification-001", {
      method: "DELETE",
    });
  });

  it("does not show delete for listening survey notifications", () => {
    render(
      <DashboardFloatingNav
        activeView="resumen"
        onViewChange={() => {}}
        notifications={[
          {
            id: "survey-001",
            title: "Registro de escucha pendiente",
            detail: "Completa tu registro de escucha para este turno.",
            time: "hace 1 min",
            href: "/colaborador?view=evaluacion",
            unread: true,
            tone: "warning",
            isListeningSurvey: true,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /notificaciones/i }));

    expect(screen.getByText("Registro de escucha pendiente")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /eliminar notificacion: registro de escucha pendiente/i,
      }),
    ).not.toBeInTheDocument();
  });
});
