import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginView } from "./login-view";

describe("LoginPage", () => {
  it("renders sign in and sign up forms", () => {
    render(<LoginView />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /escucha mejor/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continuar al dashboard/i }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute(
      "href",
      "/registro",
    );
  });
});
