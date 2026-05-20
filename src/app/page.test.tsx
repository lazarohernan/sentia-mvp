import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders the MVP product entry points", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /escucha lo que tu negocio aun no ve/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^login$/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: /ver plataforma/i }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: /probar experiencia/i }),
    ).toHaveAttribute("href", "/feedback/demo-cafe");
    expect(
      screen.queryByRole("link", { name: /^dashboard$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Módulos principales")).not.toBeInTheDocument();
  });
});
