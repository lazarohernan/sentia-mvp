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
    expect(
      screen
        .getAllByRole("link", { name: /escucha/i })
        .find((link) => link.getAttribute("href") === "/dashboard/escucha"),
    ).toBeInTheDocument();
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
