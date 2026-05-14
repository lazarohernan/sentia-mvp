import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginView } from "./login-view";

describe("LoginPage", () => {
  it("renders sign in without registration entry points", () => {
    render(<LoginView />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /escucha mejor/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo electronico$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /crear cuenta/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /registrarse/i }),
    ).not.toBeInTheDocument();
  });

  it("ignores registration mode when registration is disabled", () => {
    render(<LoginView mode="registro" />);

    expect(
      screen.getByRole("heading", { level: 2, name: /bienvenido de nuevo/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo electronico$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/nombre completo/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/empresa/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /registrarse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /crear cuenta/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps remember me visible on the login form", () => {
    render(<LoginView />);

    expect(
      screen.getByRole("checkbox", { name: /recordarme/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/recordarme/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /continuar al dashboard/i }),
    ).not.toBeInTheDocument();
  });
});
