import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders the MVP product entry points", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /escucha mvp/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /ver dashboard/i })[0])
      .toHaveAttribute("href", "/dashboard");
    expect(
      screen.getByRole("link", { name: /probar formulario qr/i }),
    ).toHaveAttribute("href", "/feedback/demo-cafe");
  });
});
