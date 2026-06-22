import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardUserMenu } from "./dashboard-user-menu";

describe("DashboardUserMenu", () => {
  it("opens a popover with business profile and sign out actions", () => {
    const onOpenBusinessProfile = vi.fn();

    render(
      <DashboardUserMenu
        user={{
          fullName: "Ana Lopez",
          email: "ana@empresa.com",
        }}
        organizationName="Cafe Central"
        canManageBusinessProfile
        onOpenBusinessProfile={onOpenBusinessProfile}
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
  });
});
