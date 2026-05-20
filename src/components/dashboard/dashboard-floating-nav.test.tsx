import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardFloatingNav } from "./dashboard-floating-nav";

describe("DashboardFloatingNav", () => {
  it("renders the dashboard navigation items", () => {
    render(
      <DashboardFloatingNav activeView="resumen" onViewChange={() => {}} />,
    );

    expect(
      screen.getByRole("navigation", { name: /navegacion principal/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resumen/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /comentarios/i })).toHaveAttribute(
      "href",
      "/dashboard#comentarios",
    );
    expect(screen.getByRole("link", { name: /^qr$/i })).toHaveAttribute(
      "href",
      "/dashboard#qr",
    );
    expect(
      screen.getByRole("button", { name: /notificaciones/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /salir/i }),
    ).toHaveAttribute("type", "submit");
  });

  it("marks the controlled active item", () => {
    render(
      <DashboardFloatingNav activeView="comentarios" onViewChange={() => {}} />,
    );

    expect(screen.getByRole("link", { name: /comentarios/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("updates the view without requiring a page refresh", () => {
    const onViewChange = vi.fn();

    render(
      <DashboardFloatingNav activeView="resumen" onViewChange={onViewChange} />,
    );

    fireEvent.click(screen.getByRole("link", { name: /^qr$/i }));

    expect(onViewChange).toHaveBeenCalledWith("qr");
    expect(window.location.pathname).toBe("/dashboard");
    expect(window.location.hash).toBe("#qr");
  });
});
