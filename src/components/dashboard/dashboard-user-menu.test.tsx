import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardUserMenu } from "./dashboard-user-menu";

describe("DashboardUserMenu", () => {
  it("opens a popover with sign out action", () => {
    render(
      <DashboardUserMenu
        user={{
          fullName: "Ana Lopez",
          email: "ana@empresa.com",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cuenta de ana lopez/i }));

    expect(screen.getByRole("menu", { name: /menu de cuenta/i })).toBeInTheDocument();
    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cerrar sesion/i }),
    ).toHaveAttribute("type", "submit");
  });
});
