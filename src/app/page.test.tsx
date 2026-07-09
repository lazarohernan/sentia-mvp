import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders the landing hero entry points", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /escucha lo que tu operación a[uú]n no ve/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /entrar a la demo/i })[0],
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getAllByRole("link", { name: /probar experiencia/i })[0],
    ).toHaveAttribute("href", "/feedback/demo-cafe");
    expect(
      screen.queryByRole("link", { name: /^dashboard$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Módulos principales")).not.toBeInTheDocument();
  }, 10000);

  it("renders the daily business problems section", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /lo que muchos negocios enfrentan a diario/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/clientes se van sin decir por qué/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tu equipo responde, pero no siempre escucha/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/los problemas aparecen cuando ya cuestan dinero/i),
    ).toBeInTheDocument();
  });

  it("renders the complete landing journey and honest product limits", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /de una opinión suelta a una acción clara/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /comprueba qué cambia cuando un comentario se vuelve accionable/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /elige por tamaño de operación/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hasta 25 sucursales")).toBeInTheDocument();
    expect(
      screen.getByText(/no envía mensajes por esos canales ni ejecuta compensaciones automáticamente/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
