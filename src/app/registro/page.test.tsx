import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RegisterView } from "./register-view";

describe("RegisterPage", () => {
  it("renders a separate registration view", () => {
    render(<RegisterView />);

    expect(
      screen.getByRole("heading", { level: 2, name: /crear cuenta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo$/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /volver/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
