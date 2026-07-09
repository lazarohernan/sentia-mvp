import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingDemoSection } from "./landing-demo-section";

describe("LandingDemoSection", () => {
  it("lets the visitor compare guided operational examples", () => {
    render(<LandingDemoSection />);

    expect(screen.getByText(/esperé casi veinte minutos para pagar/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpieza" }));

    expect(screen.getByText(/la mesa estaba pegajosa/i)).toBeInTheDocument();
    expect(screen.getByText("Encargado de sala")).toBeInTheDocument();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
  });
});
