import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardUserMenu } from "./dashboard-user-menu";

describe("DashboardUserMenu", () => {
  it("opens a popover with business profile, gestion and sign out actions", () => {
    const onOpenBusinessProfile = vi.fn();
    const onOpenGestion = vi.fn();

    render(
      <DashboardUserMenu
        user={{
          fullName: "Ana Lopez",
          email: "ana@empresa.com",
        }}
        organizationName="Cafe Central"
        canManageBusinessProfile
        onOpenBusinessProfile={onOpenBusinessProfile}
        onOpenGestion={onOpenGestion}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cuenta de ana lopez/i }));

    expect(screen.getByRole("menu", { name: /menu de cuenta/i })).toBeInTheDocument();
    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cerrar sesion/i }),
    ).toHaveAttribute("type", "submit");
    fireEvent.click(screen.getByRole("menuitem", { name: /perfil del negocio/i }));
    expect(onOpenBusinessProfile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /cuenta de ana lopez/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /gestión/i }));
    expect(onOpenGestion).toHaveBeenCalledTimes(1);
  });
});
